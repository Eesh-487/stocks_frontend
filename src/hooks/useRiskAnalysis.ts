import { useState, useEffect, useMemo } from 'react';
import { usePortfolio } from './usePortfolio';
import { useRealTimeData } from './useRealTimeData';

interface RiskMetrics {
  portfolioVaR: number;
  portfolioVaRPercent: number;
  portfolioVaRChange: number;
  portfolioCVaR: number;
  portfolioCVaRPercent: number;
  portfolioCVaRChange: number;
  volatility: number;
  volatilityChange: number;
  beta: number;
  betaChange: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

interface StressTestScenario {
  scenario: string;
  impact: number;
}

interface RiskFactorBreakdown {
  marketRisk: number;
  sectorConcentration: number;
  interestRateRisk: number;
  currencyRisk: number;
  liquidityRisk: number;
}

interface VaRHistoryPoint {
  x: string;
  y: number;
}

export const useRiskAnalysis = (confidenceLevel: number = 95, timeHorizon: number = 1) => {
  const { holdings, totalValue, isLoading: portfolioLoading } = usePortfolio();
  const { isConnected } = useRealTimeData();
  const [isLoading, setIsLoading] = useState(true);

  // Calculate risk metrics
  const riskMetrics = useMemo((): RiskMetrics => {
    if (holdings.length === 0) {
      // No holdings - return zero/default data
      return {
        portfolioVaR: 0,
        portfolioVaRPercent: 0,
        portfolioVaRChange: 0,
        portfolioCVaR: 0,
        portfolioCVaRPercent: 0,
        portfolioCVaRChange: 0,
        volatility: 0,
        volatilityChange: 0,
        beta: 0,
        betaChange: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
      };
    }
    
    let totalVolatility = 0;
    let weightedBeta = 0;
    let totalWeight = 0;

    // Calculate portfolio-level metrics from individual holdings
    holdings.forEach(holding => {
      const weight = (holding.value || 0) / totalValue;
      // Use actual price change data if available, otherwise default to low volatility
      const stockVolatility = holding.change_percent ? Math.abs(holding.change_percent) * 0.01 : 0.02;
      
      // Estimate beta based on sector (more conservative approach)
      const stockBeta = holding.category === 'Technology' ? 1.2 :
                      holding.category === 'Healthcare' ? 0.9 :
                      holding.category === 'Financials' ? 1.1 :
                      holding.category === 'Utilities' ? 0.7 :
                      holding.category === 'Consumer Goods' ? 0.8 : 1.0;
      
      totalVolatility += weight * stockVolatility;
      weightedBeta += weight * stockBeta;
      totalWeight += weight;
    });

    const portfolioVolatility = totalVolatility * Math.sqrt(252); // Annualized
    const portfolioBeta = totalWeight > 0 ? weightedBeta : 1;
    
    // VaR calculation using parametric method
    const zScore = confidenceLevel === 90 ? 1.28 : confidenceLevel === 95 ? 1.65 : 2.33;
    const dailyVaR = portfolioVolatility > 0 ? (portfolioVolatility / Math.sqrt(252)) * zScore : 0;
    const adjustedVaR = dailyVaR * Math.sqrt(timeHorizon);
    
    // Sharpe ratio calculation (assuming 2% risk-free rate)
    const riskFreeRate = 0.02;
    const excessReturn = 0.08; // Assume 8% expected return for calculation
    const sharpeRatio = portfolioVolatility > 0 ? (excessReturn - riskFreeRate) / portfolioVolatility : 0;
    
    return {
      portfolioVaR: totalValue * (adjustedVaR / 100),
      portfolioVaRPercent: adjustedVaR,
      portfolioVaRChange: 0, // No historical comparison yet
      portfolioCVaR: totalValue * (adjustedVaR / 100) * 1.3, // CVaR typically 1.3x VaR
      portfolioCVaRPercent: adjustedVaR * 1.3,
      portfolioCVaRChange: 0,
      volatility: portfolioVolatility * 100, // Convert to percentage
      volatilityChange: 0,
      beta: portfolioBeta,
      betaChange: 0,
      sharpeRatio: sharpeRatio,
      maxDrawdown: 0 // No historical data to calculate drawdown yet
    };
  }, [holdings, totalValue, confidenceLevel, timeHorizon]);

  // VaR history data (start empty - will accumulate over time)
  const varHistoryData = useMemo((): VaRHistoryPoint[] => {
    // Return empty array initially - real data will be collected over time
    // In a production system, this would fetch historical VaR calculations from the database
    return [];
  }, [riskMetrics.portfolioVaRPercent]);

  // Generate stress test scenarios
  const stressTestData = useMemo((): StressTestScenario[] => {
    const baseScenarios = [
      { scenario: 'Market Drop (10%)', baseImpact: -8.2 },
      { scenario: 'Tech Correction (15%)', baseImpact: -12.7 },
      { scenario: 'Interest Rate +1%', baseImpact: -5.4 },
      { scenario: 'Oil Price Spike (30%)', baseImpact: -3.1 },
      { scenario: 'USD Strength (10%)', baseImpact: -2.8 },
      { scenario: '2008 Crisis', baseImpact: -19.3 },
      { scenario: 'COVID-19 Crash', baseImpact: -15.6 },
      { scenario: 'Inflation Spike (5%)', baseImpact: -6.3 }
    ];

    // Adjust impacts based on portfolio composition
    return baseScenarios.map(scenario => {
      let adjustmentFactor = 1;
      
      // Adjust based on portfolio beta and sector concentration
      if (scenario.scenario.includes('Market Drop') || scenario.scenario.includes('Crisis')) {
        adjustmentFactor = riskMetrics.beta;
      }
      
      // Tech heavy portfolios are more affected by tech corrections
      const techWeight = holdings.reduce((sum, holding) => 
        holding.category === 'Technology' ? sum + ((holding.value || 0) / totalValue) : sum, 0);
      
      if (scenario.scenario.includes('Tech')) {
        adjustmentFactor *= (1 + techWeight);
      }

      return {
        scenario: scenario.scenario,
        impact: scenario.baseImpact * adjustmentFactor
      };
    });
  }, [holdings, totalValue, riskMetrics.beta]);

  // Calculate risk factor breakdown
  const riskFactorBreakdown = useMemo((): RiskFactorBreakdown => {
    if (holdings.length === 0) {
      return {
        marketRisk: 65,
        sectorConcentration: 45,
        interestRateRisk: 30,
        currencyRisk: 15,
        liquidityRisk: 10
      };
    }

    // Calculate sector concentration
    const sectorWeights = holdings.reduce((acc, holding) => {
      acc[holding.category] = (acc[holding.category] || 0) + ((holding.value || 0) / totalValue);
      return acc;
    }, {} as Record<string, number>);

    const maxSectorWeight = Math.max(...Object.values(sectorWeights));
    const sectorConcentration = maxSectorWeight * 100;

    // Market risk based on beta
    const marketRisk = Math.min(90, riskMetrics.beta * 65);

    return {
      marketRisk,
      sectorConcentration,
      interestRateRisk: 30, // Could be calculated based on duration
      currencyRisk: 15, // Could be calculated based on foreign exposure
      liquidityRisk: 10 // Could be calculated based on asset types
    };
  }, [holdings, totalValue, riskMetrics.beta]);

  useEffect(() => {
    setIsLoading(portfolioLoading);
  }, [portfolioLoading]);

  return {
    riskMetrics,
    varHistoryData,
    stressTestData,
    riskFactorBreakdown,
    isLoading,
    isConnected
  };
};
