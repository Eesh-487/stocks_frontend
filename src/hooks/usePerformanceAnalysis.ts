import { useState, useEffect, useMemo } from 'react';
import { usePortfolio } from './usePortfolio';
import { useRealTimeData } from './useRealTimeData';
import { apiService } from '../services/api';

interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDate: string;
  calmarRatio: number;
  informationRatio: number;
  treynorRatio: number;
  beta: number;
  alpha: number;
  trackingError: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
}

interface PerformanceReturn {
  date: string;
  portfolioValue: number;
  benchmarkValue?: number;
  dailyReturn: number;
  cumulativeReturn: number;
  benchmarkReturn?: number;
  excessReturn?: number;
}

interface MonthlyPerformance {
  month: string;
  return: number;
  benchmark?: number;
  excess?: number;
}

export const usePerformanceAnalysis = () => {
  const { holdings, totalValue, isLoading: portfolioLoading } = usePortfolio();
  const { isConnected } = useRealTimeData();
  const [isLoading, setIsLoading] = useState(true);
  const [performanceReturns, setPerformanceReturns] = useState<PerformanceReturn[]>([]);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (portfolioLoading || !holdings.length) {
        setIsLoading(false);
        setPerformanceReturns([]);
        return;
      }

      try {
        setIsLoading(true);
        
        // Try to fetch real historical data from API
        try {
          const historyData = await apiService.getPerformanceHistory(365);
          if (historyData && historyData.length > 0) {
            // Calculate returns from real historical data
            const returns = calculatePerformanceReturns(historyData, holdings, totalValue);
            setPerformanceReturns(returns);
          } else {
            // No historical data available, start fresh
            setPerformanceReturns([]);
          }
        } catch (apiError) {
          console.warn('No historical data available, starting fresh:', apiError);
          // Start with empty data - let real data accumulate over time
          setPerformanceReturns([]);
        }
        
      } catch (error) {
        console.error('Error in performance analysis:', error);
        setPerformanceReturns([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [holdings, portfolioLoading, totalValue, isConnected]);

  // Function to calculate returns from historical data
  const calculatePerformanceReturns = (historyData: any[], _holdings: any[], _totalValue: number): PerformanceReturn[] => {
    if (!historyData.length) {
      return [];
    }

    // Process real historical data to calculate portfolio performance
    // This would use actual price data to calculate daily portfolio values
    // For now, return empty array to start accumulating real data
    return [];
  };

  // Calculate performance metrics
  const performanceMetrics = useMemo((): PerformanceMetrics => {
    if (performanceReturns.length === 0) {
      // Return zero/neutral values when no data is available
      return {
        totalReturn: 0,
        totalReturnPercent: 0,
        annualizedReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        maxDrawdownDate: '',
        calmarRatio: 0,
        informationRatio: 0,
        treynorRatio: 0,
        beta: 1,
        alpha: 0,
        trackingError: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0
      };
    }

    const dailyReturns = performanceReturns.map(r => r.dailyReturn / 100);
    const excessReturns = performanceReturns.map(r => (r.excessReturn || 0) / 100);
    const benchmarkReturns = performanceReturns.map(r => (r.benchmarkReturn || 0) / 100);
    
    // Total return
    const totalReturn = performanceReturns[performanceReturns.length - 1].cumulativeReturn;
    
    // Annualized return
    const years = performanceReturns.length / 252; // 252 trading days per year
    const annualizedReturn = (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100;
    
    // Volatility (annualized)
    const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (dailyReturns.length - 1);
    const volatility = Math.sqrt(variance * 252) * 100; // Annualized
    
    // Risk-free rate (assume 2% annually)
    const riskFreeRate = 0.02;
    const dailyRiskFreeRate = riskFreeRate / 252;
    
    // Sharpe Ratio
    const excessReturn = meanReturn - dailyRiskFreeRate;
    const sharpeRatio = (excessReturn * 252) / (volatility / 100);
    
    // Sortino Ratio (only downside volatility)
    const downsideReturns = dailyReturns.filter(r => r < dailyRiskFreeRate);
    const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r - dailyRiskFreeRate, 2), 0) / downsideReturns.length;
    const downsideVolatility = Math.sqrt(downsideVariance * 252);
    const sortinoRatio = downsideVolatility > 0 ? (excessReturn * 252) / downsideVolatility : 0;
    
    // Maximum Drawdown
    let maxDrawdown = 0;
    let maxDrawdownDate = '';
    let peak = performanceReturns[0].portfolioValue;
    
    performanceReturns.forEach(point => {
      if (point.portfolioValue > peak) {
        peak = point.portfolioValue;
      }
      const drawdown = (peak - point.portfolioValue) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownDate = point.date;
      }
    });
    
    // Calmar Ratio
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / (maxDrawdown * 100) : 0;
    
    // Beta (vs benchmark)
    const portfolioBenchmarkCovariance = dailyReturns.reduce((sum, r, i) => {
      return sum + (r - meanReturn) * (benchmarkReturns[i] - benchmarkReturns.reduce((s, br) => s + br, 0) / benchmarkReturns.length);
    }, 0) / (dailyReturns.length - 1);
    
    const benchmarkVariance = benchmarkReturns.reduce((sum, r) => {
      const mean = benchmarkReturns.reduce((s, br) => s + br, 0) / benchmarkReturns.length;
      return sum + Math.pow(r - mean, 2);
    }, 0) / (benchmarkReturns.length - 1);
    
    const beta = benchmarkVariance > 0 ? portfolioBenchmarkCovariance / benchmarkVariance : 1;
    
    // Alpha
    const benchmarkAnnualizedReturn = (Math.pow(1 + benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length * 252, 1) - 1) * 100;
    const alpha = annualizedReturn - (riskFreeRate * 100 + beta * (benchmarkAnnualizedReturn - riskFreeRate * 100));
    
    // Treynor Ratio
    const treynorRatio = beta !== 0 ? (annualizedReturn - riskFreeRate * 100) / beta : 0;
    
    // Information Ratio
    const averageExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
    const trackingErrorVariance = excessReturns.reduce((sum, r) => sum + Math.pow(r - averageExcessReturn, 2), 0) / (excessReturns.length - 1);
    const trackingError = Math.sqrt(trackingErrorVariance * 252) * 100;
    const informationRatio = trackingError > 0 ? (averageExcessReturn * 252 * 100) / trackingError : 0;
    
    // Win Rate and Profit Factor
    const positiveReturns = dailyReturns.filter(r => r > 0);
    const negativeReturns = dailyReturns.filter(r => r < 0);
    const winRate = (positiveReturns.length / dailyReturns.length) * 100;
    const averageWin = positiveReturns.length > 0 ? (positiveReturns.reduce((sum, r) => sum + r, 0) / positiveReturns.length) * 100 : 0;
    const averageLoss = negativeReturns.length > 0 ? Math.abs(negativeReturns.reduce((sum, r) => sum + r, 0) / negativeReturns.length) * 100 : 0;
    const profitFactor = averageLoss > 0 ? (averageWin * positiveReturns.length) / (averageLoss * negativeReturns.length) : 0;

    return {
      totalReturn,
      totalReturnPercent: totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown: maxDrawdown * 100,
      maxDrawdownDate,
      calmarRatio,
      informationRatio,
      treynorRatio,
      beta,
      alpha,
      trackingError,
      winRate,
      averageWin,
      averageLoss,
      profitFactor
    };
  }, [performanceReturns]);

  // Calculate monthly performance
  const monthlyPerformance = useMemo((): MonthlyPerformance[] => {
    const monthlyData: { [key: string]: { portfolio: number[], benchmark: number[] } } = {};
    
    performanceReturns.forEach(point => {
      const monthKey = point.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { portfolio: [], benchmark: [] };
      }
      monthlyData[monthKey].portfolio.push(point.dailyReturn);
      monthlyData[monthKey].benchmark.push(point.benchmarkReturn || 0);
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => {
        const portfolioReturn = data.portfolio.reduce((sum, r) => sum + r, 0);
        const benchmarkReturn = data.benchmark.reduce((sum, r) => sum + r, 0);
        
        return {
          month,
          return: portfolioReturn,
          benchmark: benchmarkReturn,
          excess: portfolioReturn - benchmarkReturn
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [performanceReturns]);

  useEffect(() => {
    setIsLoading(portfolioLoading);
  }, [portfolioLoading]);

  return {
    performanceMetrics,
    performanceReturns,
    monthlyPerformance,
    isLoading,
    isConnected
  };
};
