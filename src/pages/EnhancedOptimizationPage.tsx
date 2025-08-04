import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ChevronDown, ChevronUp, Zap, BarChart3, Save, Download, TrendingUp, Settings, Info } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import EfficientFrontierChart from '../components/EfficientFrontierChart';
import { formatCurrency } from '../utils/formatters';
import { usePortfolio } from '../hooks/usePortfolio';

// Enhanced optimization methods based on the technical blueprint
const OPTIMIZATION_METHODS = [
  {
    id: 'mean-variance',
    name: 'Mean-Variance Optimization (MVO)',
    description: 'Markowitz efficient frontier optimization for maximum return per unit of risk. Uses quadratic programming to find optimal portfolios.',
    riskLevel: 'Medium' as const,
    complexity: 'Moderate' as const,
    bestFor: 'Investors seeking theoretical optimal portfolios with clear risk-return trade-offs',
    assumptions: ['Normal distribution of returns', 'Static inputs', 'Rational investors'],
    pros: ['Mathematically optimal', 'Well-established theory', 'Clear risk-return visualization'],
    cons: ['Sensitive to input errors', 'Assumes normal distributions', 'May produce extreme allocations']
  },
  {
    id: 'max-sharpe',
    name: 'Maximum Sharpe Ratio',
    description: 'Finds the tangency portfolio with the highest risk-adjusted return (Sharpe ratio). The single "best" theoretical portfolio.',
    riskLevel: 'Medium' as const,
    complexity: 'Moderate' as const,
    bestFor: 'Growth-oriented investors seeking the most efficient risk-adjusted returns',
    assumptions: ['Known risk-free rate', 'Mean-variance framework applies'],
    pros: ['Single optimal solution', 'Maximizes risk-adjusted returns', 'Easy to interpret'],
    cons: ['May be too concentrated', 'Sensitive to return estimates', 'High turnover']
  },
  {
    id: 'risk-parity',
    name: 'Risk Parity',
    description: 'Equal risk contribution from each asset for balanced risk exposure. Ignores return forecasts to focus on diversification.',
    riskLevel: 'Low' as const,
    complexity: 'Moderate' as const,
    bestFor: 'Investors skeptical of return forecasts who prioritize robust diversification',
    assumptions: ['All assets have similar risk premiums over time', 'Diversification is primary goal'],
    pros: ['Robust to input errors', 'Stable allocations', 'Superior diversification'],
    cons: ['Ignores return expectations', 'May require leverage', 'Lower expected returns']
  },
  {
    id: 'min-volatility',
    name: 'Minimum Volatility',
    description: 'Minimizes portfolio volatility while maintaining diversification. Focus on capital preservation.',
    riskLevel: 'Low' as const,
    complexity: 'Simple' as const,
    bestFor: 'Risk-averse investors prioritizing capital preservation over growth',
    assumptions: ['Lower volatility is always preferred', 'Historical volatility predicts future'],
    pros: ['Low risk', 'Simple to understand', 'Stable returns'],
    cons: ['Lower expected returns', 'May miss growth opportunities', 'Concentration in low-vol assets']
  },
  {
    id: 'cvar-min',
    name: 'CVaR Minimization',
    description: 'Minimizes expected loss in worst-case scenarios (tail risk). Optimizes for downside protection.',
    riskLevel: 'Low' as const,
    complexity: 'Advanced' as const,
    bestFor: 'Highly risk-averse investors or institutions focused on avoiding catastrophic losses',
    assumptions: ['Tail risk is the primary concern', 'Historical scenarios predict future'],
    pros: ['Excellent tail risk management', 'Handles fat tails', 'Coherent risk measure'],
    cons: ['Complex to compute', 'May sacrifice returns', 'Requires scenario data']
  },
  {
    id: 'black-litterman',
    name: 'Black-Litterman Model',
    description: 'Combines market equilibrium returns with investor views using Bayesian updating. More stable than pure MVO.',
    riskLevel: 'Medium' as const,
    complexity: 'Advanced' as const,
    bestFor: 'Sophisticated investors with specific market views who want stable, intuitive portfolios',
    assumptions: ['Market is in equilibrium', 'Investor views are meaningful', 'CAPM holds'],
    pros: ['More stable than MVO', 'Incorporates market wisdom', 'Allows for investor views'],
    cons: ['Complex to implement', 'Requires market cap data', 'Still subject to estimation error']
  }
];

// Input estimation methods
const ESTIMATION_METHODS = {
  returns: [
    { id: 'historical_mean', name: 'Historical Mean', description: 'Simple average of past returns' },
    { id: 'exponential_weighted', name: 'Exponentially Weighted', description: 'More weight on recent data' },
    { id: 'capm', name: 'CAPM-Based', description: 'Based on market beta and risk premium' },
    { id: 'black_litterman', name: 'Black-Litterman', description: 'Market equilibrium with views' }
  ],
  covariance: [
    { id: 'sample', name: 'Sample Covariance', description: 'Direct calculation from historical data' },
    { id: 'shrinkage', name: 'Ledoit-Wolf Shrinkage', description: 'Shrinks toward structured target' },
    { id: 'factor_model', name: 'Factor Model', description: 'Based on common risk factors' }
  ]
};

interface OptimizationResult {
  method: string;
  allocations: { [symbol: string]: number };
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  maxDrawdown?: number;
  cvar?: number;
  confidence: number;
  efficientFrontier?: Array<{
    risk: number;
    return: number;
    weights: number[];
  }>;
}

interface OptimizationConstraints {
  maxPositionSize: number;
  minPositionSize: number;
  sectorLimits: { [sector: string]: number };
  allowShortSelling: boolean;
  targetVolatility?: number;
  targetReturn?: number;
  riskTolerance: number;
  rebalanceFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
}

const EnhancedOptimizationPage: React.FC = () => {
  const { holdings, totalValue } = usePortfolio();
  const [selectedMethod, setSelectedMethod] = useState<string>('mean-variance');
  const [selectedReturnMethod, setSelectedReturnMethod] = useState<string>('historical_mean');
  const [selectedCovMethod, setSelectedCovMethod] = useState<string>('shrinkage');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [showMethodDetails, setShowMethodDetails] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [lookbackPeriod, setLookbackPeriod] = useState<number>(252); // 1 year
  
  // Constraints
  const [constraints, setConstraints] = useState<OptimizationConstraints>({
    maxPositionSize: 30,
    minPositionSize: 2,
    sectorLimits: {
      'Technology': 35,
      'Banking': 30,
      'Healthcare': 25,
      'FMCG': 20,
      'Energy': 15,
      'Auto': 15,
      'Materials': 10
    },
    allowShortSelling: false,
    riskTolerance: 50,
    rebalanceFrequency: 'quarterly'
  });

  // Prepare portfolio data for efficient frontier
  const portfolioData = useMemo(() => {
    if (!holdings.length) return { symbols: [], returns: [], covariance: [] };
    
    // This would typically come from your backend estimation engine
    // For now, simulate the data structure
    const symbols = holdings.map(h => h.symbol);
    const returns = holdings.map(() => 0.08 + (Math.random() - 0.5) * 0.1); // Mock returns
    const n = symbols.length;
    
    // Generate mock covariance matrix
    const covariance = Array(n).fill(0).map((_, i) =>
      Array(n).fill(0).map((_, j) => {
        if (i === j) return 0.02 + Math.random() * 0.03; // Diagonal (variances)
        return (Math.random() - 0.5) * 0.01; // Off-diagonal (covariances)
      })
    );
    
    return { symbols, returns, covariance };
  }, [holdings]);

  const selectedMethodInfo = OPTIMIZATION_METHODS.find(m => m.id === selectedMethod);

  const runOptimization = async () => {
    if (!holdings.length) return;
    
    setIsOptimizing(true);
    setShowResults(false);
    
    try {
      // Call the enhanced backend API with new parameters
      const response = await fetch('/api/optimization/optimize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          method: selectedMethod,
          risk_tolerance: constraints.riskTolerance,
          max_position_size: constraints.maxPositionSize,
          constraints: {
            allowShortSelling: constraints.allowShortSelling,
            minPositionSize: constraints.minPositionSize
          },
          estimation: {
            returns: selectedReturnMethod,
            covariance: selectedCovMethod,
            lookback: lookbackPeriod
          }
        })
      });
      
      if (!response.ok) throw new Error('Optimization failed');
      
      const result = await response.json();
      setOptimizationResult(result);
      setShowResults(true);
    } catch (error) {
      console.error('Optimization failed:', error);
      // For demo, show mock results
      setOptimizationResult({
        method: selectedMethod,
        allocations: holdings.reduce((acc, holding) => {
          acc[holding.symbol] = Math.random() * 20 + 5; // 5-25% each
          return acc;
        }, {} as { [symbol: string]: number }),
        expectedReturn: 0.12,
        expectedVolatility: 0.16,
        sharpeRatio: 0.625,
        confidence: 0.85
      });
      setShowResults(true);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handlePortfolioSelect = (weights: number[], metrics: any) => {
    // Convert weights array to allocations object
    const allocations = holdings.reduce((acc, holding, index) => {
      acc[holding.symbol] = weights[index] * 100; // Convert to percentage
      return acc;
    }, {} as { [symbol: string]: number });

    setOptimizationResult({
      method: 'efficient-frontier-selection',
      allocations,
      expectedReturn: metrics.expectedReturn,
      expectedVolatility: metrics.expectedVolatility,
      sharpeRatio: metrics.sharpeRatio,
      confidence: 0.9
    });
    setShowResults(true);
  };

  const currentAllocation = useMemo(() => {
    if (!holdings.length) return [];
    
    return holdings.map(holding => ({
      symbol: holding.symbol,
      name: holding.name,
      currentWeight: ((holding.value || 0) / totalValue) * 100,
      sector: holding.category,
      value: holding.value || 0
    }));
  }, [holdings, totalValue]);

  if (!holdings.length) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Advanced Portfolio Optimization
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please add some holdings to your portfolio before running optimization.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <motion.div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Advanced Portfolio Optimization
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Professional-grade optimization using mathematical models and robust estimation techniques
          </p>
        </div>
      </motion.div>

      {/* Interactive Efficient Frontier */}
      {selectedMethod === 'mean-variance' && portfolioData.symbols.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <EfficientFrontierChart
            portfolioData={portfolioData}
            onPortfolioSelect={handlePortfolioSelect}
            constraints={{
              maxWeight: constraints.maxPositionSize / 100,
              minWeight: constraints.minPositionSize / 100,
              longOnly: !constraints.allowShortSelling
            }}
          />
        </motion.div>
      )}

      {/* Method Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Optimization Method
              </h2>
              <button
                onClick={() => setShowMethodDetails(!showMethodDetails)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <Info size={16} />
                {showMethodDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {OPTIMIZATION_METHODS.map(method => (
                <div
                  key={method.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                      {method.name}
                    </h3>
                    <div className="flex gap-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        method.riskLevel === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        method.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {method.riskLevel}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                    {method.description}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Complexity: {method.complexity}
                  </div>
                </div>
              ))}
            </div>

            {/* Method Details */}
            {showMethodDetails && selectedMethodInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3"
              >
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Best For:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedMethodInfo.bestFor}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Key Assumptions:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                    {selectedMethodInfo.assumptions.map((assumption, idx) => (
                      <li key={idx}>{assumption}</li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-600 dark:text-green-400 mb-1">Pros:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                      {selectedMethodInfo.pros.map((pro, idx) => (
                        <li key={idx}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-600 dark:text-red-400 mb-1">Cons:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                      {selectedMethodInfo.cons.map((con, idx) => (
                        <li key={idx}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Settings Panel */}
        <motion.div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings size={20} />
                Configuration
              </h2>
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {showAdvancedSettings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {/* Basic Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lookback Period: {lookbackPeriod} days
                </label>
                <input
                  type="range"
                  min="63"
                  max="1260"
                  step="63"
                  value={lookbackPeriod}
                  onChange={(e) => setLookbackPeriod(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>3 months</span>
                  <span>1 year</span>
                  <span>5 years</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Position Size: {constraints.maxPositionSize}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={constraints.maxPositionSize}
                  onChange={(e) => setConstraints(prev => ({ ...prev, maxPositionSize: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Position Size: {constraints.minPositionSize}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={constraints.minPositionSize}
                  onChange={(e) => setConstraints(prev => ({ ...prev, minPositionSize: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Advanced Settings */}
            {showAdvancedSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Return Estimation Method
                  </label>
                  <select
                    value={selectedReturnMethod}
                    onChange={(e) => setSelectedReturnMethod(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {ESTIMATION_METHODS.returns.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {ESTIMATION_METHODS.returns.find(m => m.id === selectedReturnMethod)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Covariance Estimation Method
                  </label>
                  <select
                    value={selectedCovMethod}
                    onChange={(e) => setSelectedCovMethod(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {ESTIMATION_METHODS.covariance.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {ESTIMATION_METHODS.covariance.find(m => m.id === selectedCovMethod)?.description}
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="shortSelling"
                    checked={constraints.allowShortSelling}
                    onChange={(e) => setConstraints(prev => ({ ...prev, allowShortSelling: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="shortSelling" className="text-sm text-gray-700 dark:text-gray-300">
                    Allow Short Selling
                  </label>
                </div>
              </motion.div>
            )}

            <button
              onClick={runOptimization}
              disabled={isOptimizing}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Run Optimization
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Results Section */}
      {showResults && optimizationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expected Return</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(optimizationResult.expectedReturn * 100).toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expected Volatility</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {(optimizationResult.expectedVolatility * 100).toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sharpe Ratio</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {optimizationResult.sharpeRatio.toFixed(2)}
                  </p>
                </div>
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">S</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confidence</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {(optimizationResult.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">C</span>
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Current Allocation" className="h-96">
              <div className="space-y-3">
                {currentAllocation.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.symbol}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.currentWeight.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Optimized Allocation" className="h-96">
              <div className="space-y-3">
                {Object.entries(optimizationResult.allocations).map(([symbol, weight], index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{symbol}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{weight.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* Detailed Results Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Allocation Changes</h3>
            </div>
            <DataTable
              keyField="symbol"
              columns={[
                { header: 'Symbol', accessor: 'symbol' },
                { header: 'Name', accessor: 'name' },
                { header: 'Current %', accessor: (row: any) => `${row.currentWeight.toFixed(2)}%` },
                { header: 'Optimized %', accessor: (row: any) => `${(optimizationResult.allocations[row.symbol] || 0).toFixed(2)}%` },
                { 
                  header: 'Change', 
                  accessor: (row: any) => {
                    const change = (optimizationResult.allocations[row.symbol] || 0) - row.currentWeight;
                    return (
                      <span className={change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </span>
                    );
                  }
                },
                { header: 'Sector', accessor: 'sector' },
                { header: 'Value', accessor: (row: any) => formatCurrency(row.value) }
              ]}
              data={currentAllocation}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Save size={20} />
              Save Optimization
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Download size={20} />
              Export Results
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EnhancedOptimizationPage;
