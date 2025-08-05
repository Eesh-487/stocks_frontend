import { useState, useEffect, useCallback } from 'react';
import websocketService from '../services/websocket';
import apiService from '../services/api';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

interface PortfolioUpdate {
  total_value: number;
  daily_pnl: number;
  daily_pnl_percent: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
}

export const useRealTimeData = () => {
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [portfolioData, setPortfolioData] = useState<PortfolioUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(
    parseInt(localStorage.getItem('dataRefreshInterval') || '5') * 60 * 1000
  );

  // Check if we're in demo mode
  const isDemoMode = localStorage.getItem('token')?.startsWith('demo-token');

  // Listen for refresh interval changes
  useEffect(() => {
    const handleRefreshIntervalChange = (event: CustomEvent) => {
      const newInterval = event.detail?.interval || 5 * 60 * 1000; // Default to 5 minutes
      setRefreshInterval(newInterval);
      
      // The actual refresh logic will be applied in the data fetching effects
      console.log(`Data refresh interval updated to ${newInterval / (60 * 1000)} minutes`);
    };

    // Add event listener for refresh interval changes
    window.addEventListener('refreshIntervalChanged', handleRefreshIntervalChange as EventListener);
    
    // Load initial refresh interval from localStorage
    const savedInterval = localStorage.getItem('dataRefreshInterval');
    if (savedInterval) {
      const intervalMs = parseInt(savedInterval) * 60 * 1000;
      setRefreshInterval(intervalMs);
    }
    
    return () => {
      window.removeEventListener('refreshIntervalChanged', handleRefreshIntervalChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      // Demo mode - simulate real-time data
      const demoSymbols = ['AAPL', 'MSFT', 'GOOGL', 'JNJ', 'JPM'];
      const basePrices: Record<string, number> = {
        'AAPL': 184.32,
        'MSFT': 329.65,
        'GOOGL': 131.86,
        'JNJ': 146.53,
        'JPM': 193.82
      };

      // Initial data load
      const initialData = new Map();
      demoSymbols.forEach(symbol => {
        initialData.set(symbol, {
          symbol,
          price: basePrices[symbol] || 100,
          change: 0,
          changePercent: 0,
          volume: 1000000,
          timestamp: new Date().toISOString()
        });
      });
      setMarketData(initialData);
      setIsConnected(true);

      // Store interval ID in window for access from settings
      if (window.refreshIntervalId) {
        clearInterval(window.refreshIntervalId);
      }

      // Simulate price updates based on refresh interval (minimum 3 seconds for demo)
      const updateInterval = Math.max(refreshInterval, 3000);
      window.refreshIntervalId = setInterval(() => {
        setMarketData(prev => {
          const newData = new Map(prev);
          demoSymbols.forEach(symbol => {
            const current = newData.get(symbol);
            if (current) {
              // Simulate small price movements (-1% to +1%)
              const change = (Math.random() - 0.5) * 0.02; // ±1%
              const newPrice = current.price * (1 + change);
              const changePercent = ((newPrice - basePrices[symbol]) / basePrices[symbol]) * 100;
              
              newData.set(symbol, {
                ...current,
                price: newPrice,
                change: newPrice - basePrices[symbol],
                changePercent,
                timestamp: new Date().toISOString()
              });
            }
          });
          return newData;
        });
      }, updateInterval) as unknown as number;

      return () => {
        if (window.refreshIntervalId) {
          clearInterval(window.refreshIntervalId);
        }
      };
    }

    // Real WebSocket mode
    // Set up WebSocket event listeners
    const handleMarketDataUpdate = (data: MarketData[] | MarketData) => {
      if (Array.isArray(data)) {
        // Handle array of market data
        setMarketData(prev => {
          const newMap = new Map(prev);
          data.forEach(item => {
            newMap.set(item.symbol, item);
          });
          return newMap;
        });
      } else if (data && typeof data === 'object' && 'symbol' in data) {
        // Handle single market data object
        setMarketData(prev => {
          const newMap = new Map(prev);
          newMap.set(data.symbol, data as MarketData);
          return newMap;
        });
      } else {
        console.warn('handleMarketDataUpdate received invalid data:', data);
      }
    };

    const handleMarketUpdate = (data: MarketData) => {
      setMarketData(prev => {
        const newMap = new Map(prev);
        newMap.set(data.symbol, data);
        return newMap;
      });
    };

    const handlePortfolioUpdate = (data: PortfolioUpdate) => {
      setPortfolioData(data);
    };

    // Register event listeners
    websocketService.on('marketDataUpdate', handleMarketDataUpdate);
    websocketService.on('marketUpdate', handleMarketUpdate);
    websocketService.on('portfolioUpdate', handlePortfolioUpdate);

    // Check connection status
    setIsConnected(websocketService.isConnected());

    return () => {
      // Clean up event listeners
      websocketService.off('marketDataUpdate', handleMarketDataUpdate);
      websocketService.off('marketUpdate', handleMarketUpdate);
      websocketService.off('portfolioUpdate', handlePortfolioUpdate);
    };
  }, []);

  const subscribeToSymbol = useCallback((symbol: string) => {
    websocketService.subscribeToMarketData([symbol]);
  }, []);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    websocketService.unsubscribeFromMarketData([symbol]);
  }, []);

  const getSymbolData = useCallback((symbol: string): MarketData | null => {
    return marketData.get(symbol) || null;
  }, [marketData]);

  // Effect for handling refresh interval
  useEffect(() => {
    if (isDemoMode) return; // Skip for demo mode
    
    // Set up market data polling based on refresh interval
    const fetchMarketData = async () => {
      try {
        // Get current symbols we're tracking
        const symbols = Array.from(marketData.keys());
        if (symbols.length > 0) {
          const data = await apiService.getMarketData(symbols);
          // Update market data with fetched data
          setMarketData(prev => {
            const newMap = new Map(prev);
            data.forEach(item => {
              newMap.set(item.symbol, item);
            });
            return newMap;
          });
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };
    
    // Clear any existing interval
    if (window.refreshIntervalId) {
      clearInterval(window.refreshIntervalId);
    }
    
    // Only set up interval if we're connected and have symbols
    if (isConnected && marketData.size > 0) {
      // Store interval ID in window for access from settings
      window.refreshIntervalId = setInterval(fetchMarketData, refreshInterval) as unknown as number;
      console.log(`Market data refresh interval set to ${refreshInterval / (60 * 1000)} minutes`);
    }
    
    return () => {
      if (window.refreshIntervalId) {
        clearInterval(window.refreshIntervalId);
      }
    };
  }, [refreshInterval, isConnected, marketData.size, isDemoMode]);

  return {
    marketData,
    portfolioData,
    isConnected,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    getSymbolData
  };
};

export const useMarketData = (symbol: string) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('token')?.startsWith('demo-token');

    if (isDemoMode) {
      // Demo mode - return mock data for the symbol
      const basePrices: Record<string, number> = {
        'AAPL': 184.32,
        'MSFT': 329.65,
        'GOOGL': 131.86,
        'JNJ': 146.53,
        'JPM': 193.82
      };

      const mockData: MarketData = {
        symbol,
        price: basePrices[symbol] || 100,
        change: 0,
        changePercent: 0,
        volume: 1000000,
        timestamp: new Date().toISOString()
      };

      if (mounted) {
        setData(mockData);
        setLoading(false);
      }
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.getMarketQuote(symbol);
        if (mounted) {
          // Transform the API result to match MarketData interface
          const marketData: MarketData = {
            symbol: result.symbol,
            price: result.price,
            change: result.change_percent > 0 ? (result.price * result.change_percent / 100) : -(result.price * Math.abs(result.change_percent) / 100),
            changePercent: result.change_percent,
            volume: result.volume,
            timestamp: result.last_updated
          };
          setData(marketData);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Subscribe to real-time updates
    const handleUpdate = (updateData: MarketData) => {
      if (updateData.symbol === symbol && mounted) {
        setData(updateData);
      }
    };

    websocketService.on('marketUpdate', handleUpdate);
    websocketService.subscribeToMarketData([symbol]);

    return () => {
      mounted = false;
      websocketService.off('marketUpdate', handleUpdate);
      websocketService.unsubscribeFromMarketData([symbol]);
    };
  }, [symbol]);

  return { data, loading, error };
};

export const usePortfolioData = () => {
  const [data, setData] = useState<PortfolioUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('token')?.startsWith('demo-token');

    if (isDemoMode) {
      // Demo mode - return mock portfolio data
      const mockPortfolioData: PortfolioUpdate = {
        total_value: 125000,
        daily_pnl: 2500,
        daily_pnl_percent: 2.04,
        unrealized_pnl: 15000,
        unrealized_pnl_percent: 13.64
      };

      if (mounted) {
        setData(mockPortfolioData);
        setLoading(false);
      }
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.getPortfolioSummary();
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Subscribe to real-time portfolio updates
    const handleUpdate = (updateData: any) => {
      if (mounted) {
        setData(updateData);
      }
    };

    websocketService.on('portfolioUpdate', handleUpdate);
    websocketService.subscribeToPortfolio();

    return () => {
      mounted = false;
      websocketService.off('portfolioUpdate', handleUpdate);
    };
  }, []);

  return { data, loading, error };
};