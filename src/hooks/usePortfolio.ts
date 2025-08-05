import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import { useRealTimeData } from './useRealTimeData';

interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  category: string;
  quantity: number;
  average_cost: number;
  purchase_price?: number;
  current_price: number | null;
  value: number | null;
  allocation: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  change_percent: number | null;
}

interface NewHolding {
  asset_type?: string;
  symbol?: string;
  name: string;
  category: string;
  quantity: number;
  purchase_price?: number;
}

export const usePortfolio = () => {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { marketData } = useRealTimeData();

  const fetchHoldings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getHoldings();
      const mappedHoldings: PortfolioHolding[] = Array.isArray(response.holdings)
  ? response.holdings.map(item => ({  id: item.id,
        symbol: item.symbol,
        name: item.company_name, // Map company_name to name
        category: 'Stock', // Default category
        quantity: item.quantity,
        average_cost: item.average_cost,
        purchase_price: item.average_cost,
        current_price: item.current_price,
        value: item.market_value,
        net_expenditure: item.average_cost * item.quantity,
        allocation: (item.market_value / response.total_value) * 100, // Calculate allocation percentage
        unrealized_pnl: item.profit_loss,
        unrealized_pnl_percent: item.profit_loss_percent,
        change_percent: item.current_price && item.average_cost
          ? ((item.current_price - item.average_cost) / item.average_cost) * 100
          : 0
      }))
  : [];
      // Map the API response to match the PortfolioHolding interface

      
      setHoldings(mappedHoldings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
      console.error('Portfolio fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addHolding = useCallback(async (holding: NewHolding) => {
    try {
      setError(null);
      console.log('Adding holding:', holding);
      
      const result = await apiService.addHolding(holding);
      console.log('Add holding result:', result);
      
      // Wait a moment before refreshing to ensure DB consistency
      setTimeout(async () => {
        await fetchHoldings(); // Refresh the list
      }, 500);
      
      return true;
    } catch (err) {
      // Extract more specific error message if available
      let errorMessage = 'Failed to add holding';
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Try to extract API error details
        if (err.message.includes('API Error')) {
          const match = err.message.match(/API Error \d+: (.*)/);
          if (match && match[1]) {
            errorMessage = match[1];
          }
        }
      }
      
      setError(errorMessage);
      console.error('Add holding error:', err);
      return false;
    }
  }, [fetchHoldings]);

  const updateHolding = useCallback(async (id: string, updates: { quantity?: number; average_cost?: number }) => {
    try {
      setError(null);
      
      await apiService.updateHolding(id, updates);
      await fetchHoldings(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update holding');
      console.error('Update holding error:', err);
      return false;
    }
  }, [fetchHoldings]);

  const removeHolding = useCallback(async (id: string) => {
    try {
      setError(null);
      
      await apiService.deleteHolding(id);
      await fetchHoldings(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove holding');
      console.error('Remove holding error:', err);
      return false;
    }
  }, [fetchHoldings]);

  // Update holdings with real-time market data
  useEffect(() => {
    if (holdings.length > 0 && marketData.size > 0) {
      setHoldings(prevHoldings => 
        prevHoldings.map(holding => {
          const realTimeData = marketData.get(holding.symbol);
          if (realTimeData) {
            const newValue = holding.quantity * realTimeData.price;
            const newUnrealizedPnl = newValue - (holding.quantity * holding.average_cost);
            const newUnrealizedPnlPercent = ((realTimeData.price - holding.average_cost) / holding.average_cost) * 100;
            
            return {
              ...holding,
              current_price: realTimeData.price,
              value: newValue,
              unrealized_pnl: newUnrealizedPnl,
              unrealized_pnl_percent: newUnrealizedPnlPercent,
              change_percent: realTimeData.changePercent,
            };
          }
          return holding;
        })
      );
    }
  }, [marketData]); // Remove holdings.length dependency

  const refreshPortfolio = useCallback(async () => {
    try {
      setError(null);
      const result = await apiService.refreshPortfolio();
      await fetchHoldings(); // Refresh the holdings after price update
      
      // Show notification if duplicates were cleaned
      if (result && result.duplicates_cleaned > 0) {
        alert(`Auto-cleanup: ${result.duplicates_cleaned} duplicate symbols were automatically merged.`);
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh portfolio');
      console.error('Refresh portfolio error:', err);
      return false;
    }
  }, [fetchHoldings]);
  
  // Removed cleanupDuplicates - now integrated in refreshPortfolio

  // Initial fetch
  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const totalValue = holdings.reduce((sum, holding) => sum + (holding.value || 0), 0);
  const totalUnrealizedPnl = holdings.reduce((sum, holding) => sum + holding.unrealized_pnl, 0);
  const totalUnrealizedPnlPercent = totalValue > 0 ? (totalUnrealizedPnl / (totalValue - totalUnrealizedPnl)) * 100 : 0;

  return {
    holdings,
    isLoading,
    error,
    totalValue,
    totalUnrealizedPnl,
    totalUnrealizedPnlPercent,
    addHolding,
    updateHolding,
    removeHolding,
    refreshHoldings: fetchHoldings,
    refreshPortfolio,
  };
};
