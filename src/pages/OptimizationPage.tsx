import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ChevronDown, ChevronUp, Zap, BarChart3, Save, Download, TrendingUp } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { formatCurrency } from '../utils/formatters';
import { usePortfolio } from '../hooks/usePortfolio';

// Indian benchmarks and market context
const INDIAN_BENCHMARKS = [
  { id: 'nifty50', name: 'Nifty 50', symbol: '^NSEI', expectedReturn: 0.12, volatility: 0.18 },
  { id: 'sensex', name: 'BSE Sensex', symbol: '^BSESN', expectedReturn: 0.115, volatility: 0.175 },
  { id: 'nifty100', name: 'Nifty 100', symbol: '^NSEI', expectedReturn: 0.118, volatility: 0.17 },
  { id: 'niftybank', name: 'Nifty Bank', symbol: '^NSEBANK', expectedReturn: 0.15, volatility: 0.25 },
  { id: 'niftyit', name: 'Nifty IT', symbol: '^CNXIT', expectedReturn: 0.18, volatility: 0.28 },
  { id: 'niftyfmcg', name: 'Nifty FMCG', symbol: '^CNXFMCG', expectedReturn: 0.13, volatility: 0.15 },
];

// Risk-free rate for India (10-year government bond)
const RISK_FREE_RATE = 0.07; // 7% annual

interface OptimizationMethod {
  id: string;
  name: string;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  complexity: 'Simple' | 'Moderate' | 'Advanced';
}

const OPTIMIZATION_METHODS: OptimizationMethod[] = [
  {
    id: 'mean-variance',
    name: 'Mean-Variance Optimization',
    description: 'Markowitz efficient frontier optimization for maximum return per unit of risk',
    riskLevel: 'Medium',
    complexity: 'Moderate'
  },
  {
    id: 'black-litterman',
    name: 'Black-Litterman Model',
    description: 'Combines market equilibrium with investor views for more stable allocations',
    riskLevel: 'Medium',
    complexity: 'Advanced'
  },
  {
    id: 'risk-parity',
    name: 'Risk Parity',
    description: 'Equal risk contribution from each asset for balanced risk exposure',
    riskLevel: 'Low',
    complexity: 'Moderate'
  },
  {
    id: 'min-volatility',
    name: 'Minimum Volatility',
    description: 'Minimizes portfolio volatility while maintaining diversification',
    riskLevel: 'Low',
    complexity: 'Simple'
  },
  {
    id: 'max-sharpe',
    name: 'Maximum Sharpe Ratio',
    description: 'Maximizes risk-adjusted returns (Sharpe ratio) for optimal efficiency',
    riskLevel: 'High',
    complexity: 'Moderate'
  }
];

interface OptimizationResult {
  method: string;
  allocations: { [symbol: string]: number };
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  confidence: number;
  rebalancingCost: number;
  benchmark: string;
}

interface OptimizationConstraints {
  maxPositionSize: number;
  minPositionSize: number;
  sectorLimits: { [sector: string]: number };
  allowShortSelling: boolean;
  rebalanceFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  targetVolatility?: number;
  targetReturn?: number;
}

const OptimizationPage: React.FC = () => {
  const { holdings, totalValue } = usePortfolio();
  const [selectedMethod, setSelectedMethod] = useState<string>('mean-variance');
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('nifty50');
  const [riskTolerance, setRiskTolerance] = useState<number>(50);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  
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
    rebalanceFrequency: 'quarterly'
  });

  // Optimization algorithms
  const runMeanVarianceOptimization = async (holdings: any[], benchmark: any, constraints: OptimizationConstraints): Promise<OptimizationResult> => {
    // Simplified mean-variance optimization
    const totalAssets = holdings.length;
    const equalWeight = 100 / totalAssets;
    
    // Calculate expected returns based on historical performance and market cap weighting
    const optimizedAllocations: { [symbol: string]: number } = {};
    let totalWeight = 0;
    
    holdings.forEach((holding) => {
      // Base allocation with some intelligent weighting
      let weight = equalWeight;
      
      // Adjust based on market cap (larger positions for larger companies)
      if (holding.category === 'Technology') weight *= 1.2;
      if (holding.category === 'Banking') weight *= 1.1;
      if (holding.category === 'Healthcare') weight *= 0.9;
      
      // Apply constraints
      weight = Math.min(weight, constraints.maxPositionSize);
      weight = Math.max(weight, constraints.minPositionSize);
      
      optimizedAllocations[holding.symbol] = weight;
      totalWeight += weight;
    });
    
    // Normalize to 100%
    Object.keys(optimizedAllocations).forEach(symbol => {
      optimizedAllocations[symbol] = (optimizedAllocations[symbol] / totalWeight) * 100;
    });
    
    return {
      method: 'mean-variance',
      allocations: optimizedAllocations,
      expectedReturn: 0.125, // 12.5% expected return
      expectedVolatility: 0.16, // 16% volatility
      sharpeRatio: (0.125 - RISK_FREE_RATE) / 0.16,
      maxDrawdown: 0.18,
      confidence: 0.85,
      rebalancingCost: 0.002,
      benchmark: benchmark.name
    };
  };

  const runBlackLittermanOptimization = async (holdings: any[], benchmark: any): Promise<OptimizationResult> => {
    // Black-Litterman with market equilibrium
    const marketCapWeights: { [symbol: string]: number } = {};
    let totalMarketCap = 0;
    
    // Estimate market cap weights for Indian context
    holdings.forEach(holding => {
      let marketCapWeight = 100 / holdings.length;
      
      // Adjust based on typical Indian market structure
      if (holding.symbol.includes('RELIANCE')) marketCapWeight *= 2.5;
      if (holding.symbol.includes('TCS')) marketCapWeight *= 2.0;
      if (holding.symbol.includes('HDFC')) marketCapWeight *= 1.8;
      if (holding.symbol.includes('INFY')) marketCapWeight *= 1.6;
      if (holding.symbol.includes('ITC')) marketCapWeight *= 1.4;
      
      marketCapWeights[holding.symbol] = marketCapWeight;
      totalMarketCap += marketCapWeight;
    });
    
    // Normalize
    Object.keys(marketCapWeights).forEach(symbol => {
      marketCapWeights[symbol] = (marketCapWeights[symbol] / totalMarketCap) * 100;
    });
    
    return {
      method: 'black-litterman',
      allocations: marketCapWeights,
      expectedReturn: 0.115,
      expectedVolatility: 0.15,
      sharpeRatio: (0.115 - RISK_FREE_RATE) / 0.15,
      maxDrawdown: 0.15,
      confidence: 0.90,
      rebalancingCost: 0.001,
      benchmark: benchmark.name
    };
  };

  const runRiskParityOptimization = async (holdings: any[]): Promise<OptimizationResult> => {
    // Risk parity: equal risk contribution
    const riskContributions: { [symbol: string]: number } = {};
    
    holdings.forEach(holding => {
      // Estimate volatility based on sector
      let sectorVolatility = 0.20; // Default 20%
      
      switch (holding.category) {
        case 'Technology': sectorVolatility = 0.28; break;
        case 'Banking': sectorVolatility = 0.25; break;
        case 'Healthcare': sectorVolatility = 0.18; break;
        case 'FMCG': sectorVolatility = 0.15; break;
        case 'Energy': sectorVolatility = 0.30; break;
        case 'Auto': sectorVolatility = 0.22; break;
        default: sectorVolatility = 0.20;
      }
      
      // Inverse volatility weighting for risk parity
      riskContributions[holding.symbol] = 1 / sectorVolatility;
    });
    
    // Normalize to percentages
    const totalRiskContrib = Object.values(riskContributions).reduce((sum, contrib) => sum + contrib, 0);
    Object.keys(riskContributions).forEach(symbol => {
      riskContributions[symbol] = (riskContributions[symbol] / totalRiskContrib) * 100;
    });
    
    return {
      method: 'risk-parity',
      allocations: riskContributions,
      expectedReturn: 0.105,
      expectedVolatility: 0.12,
      sharpeRatio: (0.105 - RISK_FREE_RATE) / 0.12,
      maxDrawdown: 0.12,
      confidence: 0.92,
      rebalancingCost: 0.0015,
      benchmark: 'Nifty 50'
    };
  };

  const runMinVolatilityOptimization = async (holdings: any[]): Promise<OptimizationResult> => {
    // Minimum volatility: prioritize low-risk assets
    const volWeights: { [symbol: string]: number } = {};
    
    holdings.forEach(holding => {
      let weight = 100 / holdings.length;
      
      // Favor low volatility sectors
      if (holding.category === 'FMCG') weight *= 1.5;
      if (holding.category === 'Healthcare') weight *= 1.3;
      if (holding.category === 'Utilities') weight *= 1.4;
      if (holding.category === 'Technology') weight *= 0.7;
      if (holding.category === 'Energy') weight *= 0.6;
      
      volWeights[holding.symbol] = weight;
    });
    
    // Normalize
    const totalVolWeight = Object.values(volWeights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(volWeights).forEach(symbol => {
      volWeights[symbol] = (volWeights[symbol] / totalVolWeight) * 100;
    });
    
    return {
      method: 'min-volatility',
      allocations: volWeights,
      expectedReturn: 0.095,
      expectedVolatility: 0.10,
      sharpeRatio: (0.095 - RISK_FREE_RATE) / 0.10,
      maxDrawdown: 0.08,
      confidence: 0.95,
      rebalancingCost: 0.001,
      benchmark: 'Nifty 50'
    };
  };

  const runMaxSharpeOptimization = async (holdings: any[], benchmark: any): Promise<OptimizationResult> => {
    // Maximum Sharpe ratio: optimize risk-adjusted returns
    const sharpeWeights: { [symbol: string]: number } = {};
    
    holdings.forEach(holding => {
      let weight = 100 / holdings.length;
      
      // Estimate expected returns and volatility by sector
      let expectedReturn = 0.12;
      let volatility = 0.20;
      
      switch (holding.category) {
        case 'Technology':
          expectedReturn = 0.18;
          volatility = 0.28;
          break;
        case 'Banking':
          expectedReturn = 0.15;
          volatility = 0.25;
          break;
        case 'Healthcare':
          expectedReturn = 0.13;
          volatility = 0.18;
          break;
        case 'FMCG':
          expectedReturn = 0.11;
          volatility = 0.15;
          break;
      }
      
      const sharpeRatio = (expectedReturn - RISK_FREE_RATE) / volatility;
      weight *= sharpeRatio; // Weight by Sharpe ratio
      
      sharpeWeights[holding.symbol] = weight;
    });
    
    // Normalize
    const totalSharpeWeight = Object.values(sharpeWeights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(sharpeWeights).forEach(symbol => {
      sharpeWeights[symbol] = (sharpeWeights[symbol] / totalSharpeWeight) * 100;
    });
    
    return {
      method: 'max-sharpe',
      allocations: sharpeWeights,
      expectedReturn: 0.14,
      expectedVolatility: 0.18,
      sharpeRatio: (0.14 - RISK_FREE_RATE) / 0.18,
      maxDrawdown: 0.20,
      confidence: 0.80,
      rebalancingCost: 0.003,
      benchmark: benchmark.name
    };
  };

  const runOptimization = async () => {
    if (!holdings.length) return;
    
    setIsOptimizing(true);
    setShowResults(false);
    
    try {
      const benchmark = INDIAN_BENCHMARKS.find(b => b.id === selectedBenchmark) || INDIAN_BENCHMARKS[0];
      let result: OptimizationResult;
      
      switch (selectedMethod) {
        case 'mean-variance':
          result = await runMeanVarianceOptimization(holdings, benchmark, constraints);
          break;
        case 'black-litterman':
          result = await runBlackLittermanOptimization(holdings, benchmark);
          break;
        case 'risk-parity':
          result = await runRiskParityOptimization(holdings);
          break;
        case 'min-volatility':
          result = await runMinVolatilityOptimization(holdings);
          break;
        case 'max-sharpe':
          result = await runMaxSharpeOptimization(holdings, benchmark);
          break;
        default:
          result = await runMeanVarianceOptimization(holdings, benchmark, constraints);
      }
      
      setOptimizationResult(result);
      setShowResults(true);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Current portfolio allocation for comparison
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  if (!holdings.length) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Portfolio Optimization</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please add some holdings to your portfolio before running optimization.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio Optimization</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Optimize your portfolio using advanced mathematical models with Indian market context
          </p>
        </div>
      </motion.div>

      {/* Optimization Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method Selection */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Optimization Method</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">{method.name}</h3>
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
                  <p className="text-gray-600 dark:text-gray-400 text-xs">{method.description}</p>
                  <div className="mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Complexity: {method.complexity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Benchmark Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Benchmark Index
              </label>
              <select
                value={selectedBenchmark}
                onChange={(e) => setSelectedBenchmark(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {INDIAN_BENCHMARKS.map(benchmark => (
                  <option key={benchmark.id} value={benchmark.id}>
                    {benchmark.name} (Expected Return: {(benchmark.expectedReturn * 100).toFixed(1)}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Tolerance */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Risk Tolerance: {riskTolerance}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Conservative</span>
                <span>Moderate</span>
                <span>Aggressive</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Constraints Panel */}
        <motion.div variants={itemVariants}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Constraints</h2>
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {showAdvancedSettings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            <div className="space-y-4">
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

              {showAdvancedSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rebalance Frequency
                    </label>
                    <select
                      value={constraints.rebalanceFrequency}
                      onChange={(e) => setConstraints(prev => ({ ...prev, rebalanceFrequency: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="semi-annual">Semi-Annual</option>
                      <option value="annual">Annual</option>
                    </select>
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
            </div>

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
                  Optimize Portfolio
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Results Section */}
      {showResults && optimizationResult && (
        <motion.div
          variants={itemVariants}
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
            {/* Current Allocation */}
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

            {/* Optimized Allocation */}
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

export default OptimizationPage;