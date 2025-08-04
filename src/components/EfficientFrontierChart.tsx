import React, { useState, useEffect, useCallback } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface EfficientFrontierPoint {
  risk: number;
  return: number;
  weights: number[];
  sharpeRatio: number;
  isOptimal?: boolean;
}

interface EfficientFrontierProps {
  portfolioData: {
    symbols: string[];
    returns: number[];
    covariance: number[][];
  };
  onPortfolioSelect: (weights: number[], metrics: any) => void;
  constraints?: {
    maxWeight?: number;
    minWeight?: number;
    longOnly?: boolean;
  };
}

const EfficientFrontierChart: React.FC<EfficientFrontierProps> = ({
  portfolioData,
  onPortfolioSelect,
  constraints = {}
}) => {
  const [frontierPoints, setFrontierPoints] = useState<EfficientFrontierPoint[]>([]);
  const [randomPortfolios, setRandomPortfolios] = useState<EfficientFrontierPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<EfficientFrontierPoint | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate random portfolios for context
  const generateRandomPortfolios = useCallback((numPortfolios = 10000) => {
    const portfolios: EfficientFrontierPoint[] = [];
    const numAssets = portfolioData.symbols.length;

    for (let i = 0; i < numPortfolios; i++) {
      // Generate random weights
      let weights = Array(numAssets).fill(0).map(() => Math.random());
      
      // Normalize to sum to 1
      const sum = weights.reduce((a, b) => a + b, 0);
      weights = weights.map(w => w / sum);

      // Apply constraints
      if (constraints.maxWeight) {
        weights = weights.map(w => Math.min(w, constraints.maxWeight!));
      }
      if (constraints.minWeight) {
        weights = weights.map(w => Math.max(w, constraints.minWeight!));
      }
      
      // Renormalize after constraints
      const constrainedSum = weights.reduce((a, b) => a + b, 0);
      if (constrainedSum > 0) {
        weights = weights.map(w => w / constrainedSum);
      }

      // Calculate portfolio metrics
      const expectedReturn = weights.reduce((sum, w, idx) => sum + w * portfolioData.returns[idx], 0);
      
      let variance = 0;
      for (let j = 0; j < numAssets; j++) {
        for (let k = 0; k < numAssets; k++) {
          variance += weights[j] * weights[k] * portfolioData.covariance[j][k];
        }
      }
      const volatility = Math.sqrt(variance);
      
      const riskFreeRate = 0.02;
      const sharpeRatio = volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;

      portfolios.push({
        risk: volatility * 100, // Convert to percentage
        return: expectedReturn * 100, // Convert to percentage
        weights,
        sharpeRatio
      });
    }

    return portfolios;
  }, [portfolioData, constraints]);

  // Generate efficient frontier points
  const generateEfficientFrontier = useCallback(async (numPoints = 50) => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the backend optimization service
      // For now, we'll simulate the efficient frontier
      const points: EfficientFrontierPoint[] = [];
      const minReturn = Math.min(...portfolioData.returns) * 100;
      const maxReturn = Math.max(...portfolioData.returns) * 100;
      
      for (let i = 0; i < numPoints; i++) {
        const targetReturn = minReturn + (maxReturn - minReturn) * i / (numPoints - 1);
        
        // Simulate mean-variance optimization for this target return
        // In practice, this would call your optimization engine
        const weights = await simulateMeanVarianceOptimization(targetReturn / 100);
        
        if (weights) {
          const expectedReturn = weights.reduce((sum, w, idx) => sum + w * portfolioData.returns[idx], 0);
          
          let variance = 0;
          for (let j = 0; j < portfolioData.symbols.length; j++) {
            for (let k = 0; k < portfolioData.symbols.length; k++) {
              variance += weights[j] * weights[k] * portfolioData.covariance[j][k];
            }
          }
          const volatility = Math.sqrt(variance);
          
          const riskFreeRate = 0.02;
          const sharpeRatio = volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;

          points.push({
            risk: volatility * 100,
            return: expectedReturn * 100,
            weights,
            sharpeRatio
          });
        }
      }
      
      // Find the maximum Sharpe ratio point
      const maxSharpePoint = points.reduce((max, point) => 
        point.sharpeRatio > max.sharpeRatio ? point : max
      );
      maxSharpePoint.isOptimal = true;
      
      setFrontierPoints(points);
    } catch (error) {
      console.error('Error generating efficient frontier:', error);
    } finally {
      setIsLoading(false);
    }
  }, [portfolioData]);

  // Simulate mean-variance optimization (replace with actual API call)
  const simulateMeanVarianceOptimization = async (targetReturn: number): Promise<number[] | null> => {
    // This is a simplified simulation - replace with actual optimization
    // For demonstration, create weights that bias toward higher-return assets
    const weights = portfolioData.returns.map(ret => Math.max(0, ret - targetReturn + 0.05));
    const sum = weights.reduce((a, b) => a + b, 0);
    
    if (sum > 0) {
      return weights.map(w => w / sum);
    }
    
    return null;
  };

  // Handle point selection
  const handlePointClick = useCallback((point: EfficientFrontierPoint) => {
    setSelectedPoint(point);
    
    const metrics = {
      expectedReturn: point.return / 100,
      expectedVolatility: point.risk / 100,
      sharpeRatio: point.sharpeRatio,
      isOptimal: point.isOptimal || false
    };
    
    onPortfolioSelect(point.weights, metrics);
  }, [onPortfolioSelect]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Risk: {data.risk.toFixed(2)}%
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Return: {data.return.toFixed(2)}%
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Sharpe: {data.sharpeRatio.toFixed(3)}
          </p>
          {data.isOptimal && (
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              Max Sharpe Ratio
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Color function for random portfolios based on Sharpe ratio
  const getColorForSharpeRatio = (sharpe: number) => {
    // Create a color gradient from red (low Sharpe) to green (high Sharpe)
    const normalized = Math.max(0, Math.min(1, (sharpe + 0.5) / 2)); // Normalize roughly to 0-1
    const red = Math.floor(255 * (1 - normalized));
    const green = Math.floor(255 * normalized);
    return `rgb(${red}, ${green}, 100)`;
  };

  // Generate data on mount
  useEffect(() => {
    if (portfolioData.symbols.length > 0) {
      const randomPorts = generateRandomPortfolios();
      setRandomPortfolios(randomPorts);
      generateEfficientFrontier();
    }
  }, [portfolioData, generateRandomPortfolios, generateEfficientFrontier]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Chart Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Interactive Efficient Frontier
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click any point on the frontier to select that risk-return profile
          </p>
        </div>
        
        {selectedPoint && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-300">
              Selected Portfolio
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Risk: {selectedPoint.risk.toFixed(2)}% | Return: {selectedPoint.return.toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="risk" 
              type="number" 
              domain={['dataMin - 1', 'dataMax + 1']}
              label={{ value: 'Risk (Volatility %)', position: 'insideBottom', offset: -10 }}
              stroke="#6B7280"
            />
            <YAxis 
              dataKey="return" 
              type="number"
              domain={['dataMin - 1', 'dataMax + 1']}
              label={{ value: 'Expected Return (%)', angle: -90, position: 'insideLeft' }}
              stroke="#6B7280"
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Random portfolios cloud */}
            <Scatter
              data={randomPortfolios}
              fill="#E5E7EB"
              opacity={0.6}
            >
              {randomPortfolios.map((entry, index) => (
                <Cell key={`random-${index}`} fill={getColorForSharpeRatio(entry.sharpeRatio)} />
              ))}
            </Scatter>
            
            {/* Efficient frontier */}
            <Scatter
              data={frontierPoints}
              fill="#3B82F6"
              stroke="#1E40AF"
              strokeWidth={2}
              cursor="pointer"
              onClick={(data) => data && handlePointClick(data)}
            >
              {frontierPoints.map((entry, index) => (
                <Cell 
                  key={`frontier-${index}`} 
                  fill={entry.isOptimal ? "#EF4444" : "#3B82F6"}
                  r={entry.isOptimal ? 8 : 6}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full opacity-60"></div>
          <span className="text-gray-600 dark:text-gray-400">Random Portfolios</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400">Efficient Frontier</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400">Maximum Sharpe Ratio</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          How to Use
        </h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• The gray cloud shows thousands of random portfolio combinations</li>
          <li>• Colors indicate Sharpe ratio: red (poor) to green (excellent)</li>
          <li>• The blue curve is the efficient frontier - optimal risk/return combinations</li>
          <li>• Click any point on the frontier to select that portfolio allocation</li>
          <li>• The red point shows the maximum Sharpe ratio (tangency) portfolio</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default EfficientFrontierChart;
