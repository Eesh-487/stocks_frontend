import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Sliders, Download } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import LineChart from '../components/LineChart';
import FilterModal, { FilterOptions } from '../components/FilterModal';
import { useRiskAnalysis } from '../hooks/useRiskAnalysis';
import { formatCurrency } from '../utils/formatters';
import exportService from '../services/exportService';

const RiskPage: React.FC = () => {
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [timeHorizon, setTimeHorizon] = useState(1);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    riskLevel: [],
    timeHorizon: [],
    confidenceLevel: [],
    dateRange: 'all',
    sortBy: '',
    sortOrder: 'desc'
  });
  
  const { 
    riskMetrics,
    varHistoryData,
    stressTestData,
    riskFactorBreakdown,
    isLoading
  } = useRiskAnalysis(confidenceLevel, timeHorizon);
  
  // Get portfolio value for stress test calculations
  const portfolioValue = riskMetrics.portfolioVaR / (riskMetrics.portfolioVaRPercent / 100) || 125000;

  // Handle export
  const handleExport = () => {
    exportService.exportRiskAnalysis(riskMetrics, stressTestData, riskFactorBreakdown);
  };

  // Handle filter application
  const handleFilterApply = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };
  
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <motion.h1 variants={itemVariants} className="text-2xl font-bold">Risk Analysis</motion.h1>
        
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
            <label className="text-sm text-gray-600 dark:text-gray-400">Confidence:</label>
            <select 
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
              className="text-sm bg-transparent border-none focus:ring-0 py-0 pl-1 pr-8 text-gray-700 dark:text-gray-300"
            >
              <option value={90}>90%</option>
              <option value={95}>95%</option>
              <option value={99}>99%</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
            <label className="text-sm text-gray-600 dark:text-gray-400">Horizon:</label>
            <select 
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(parseInt(e.target.value))}
              className="text-sm bg-transparent border-none focus:ring-0 py-0 pl-1 pr-8 text-gray-700 dark:text-gray-300"
            >
              <option value={1}>1 Day</option>
              <option value={5}>5 Days</option>
              <option value={10}>10 Days</option>
              <option value={21}>21 Days</option>
            </select>
          </div>
          
          <button 
            className="btn-secondary flex items-center gap-2"
            onClick={() => setShowFilterModal(true)}
          >
            <Sliders size={16} />
            <span>Settings</span>
          </button>
          
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={handleExport}
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </motion.div>
      </div>
      
      {/* Risk metrics row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Value at Risk (VaR)" 
          value={`${riskMetrics.portfolioVaRPercent.toFixed(2)}%`}
          change={riskMetrics.portfolioVaRChange}
          description={`${formatCurrency(riskMetrics.portfolioVaR)}`}
          icon={<TrendingDown size={20} />}
        />
        <StatCard 
          title="Conditional VaR (CVaR)" 
          value={`${riskMetrics.portfolioCVaRPercent.toFixed(2)}%`}
          change={riskMetrics.portfolioCVaRChange}
          description={`${formatCurrency(riskMetrics.portfolioCVaR)}`}
          icon={<AlertTriangle size={20} />}
        />
        <StatCard 
          title="Volatility (Annual)" 
          value={`${riskMetrics.volatility.toFixed(1)}%`}
          change={riskMetrics.volatilityChange}
          description="vs last month"
          icon={<TrendingUp size={20} />}
        />
        <StatCard 
          title="Beta (vs S&P 500)" 
          value={riskMetrics.beta.toFixed(2)}
          change={riskMetrics.betaChange}
          description="vs last month"
          icon={<Shield size={20} />}
        />
      </motion.div>
      
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <ChartCard 
            title="Value at Risk History" 
            subtitle={`${confidenceLevel}% confidence, ${timeHorizon} day horizon`}
            info="Shows the historical trend of your portfolio's Value at Risk (VaR). VaR represents the potential loss in value of your portfolio over a defined period for a given confidence interval."
          >
            <LineChart 
              data={varHistoryData}
              height={300}
              color="#EF4444"
              formatY={(val) => `${val.toFixed(2)}%`}
            />
          </ChartCard>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <ChartCard 
            title="Stress Test Scenarios" 
            subtitle="Impact on portfolio value"
            info="Shows how your portfolio might perform under various extreme market conditions. These scenarios are based on historical events or hypothetical market movements."
          >
            <div className="h-[300px] overflow-y-auto pr-2">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Scenario
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Impact (%)
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Impact ($)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {stressTestData.map((scenario, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {scenario.scenario}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400 font-medium">
                        {scenario.impact.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400 font-medium">
                        {formatCurrency(portfolioValue * (scenario.impact / 100))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </motion.div>
      </div>
      
      {/* Risk Breakdown */}
      <motion.div variants={itemVariants} className="card">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Risk Factor Breakdown</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Market Risk</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{riskFactorBreakdown.marketRisk.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${riskFactorBreakdown.marketRisk}%` }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sector Concentration</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{riskFactorBreakdown.sectorConcentration.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${riskFactorBreakdown.sectorConcentration}%` }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Interest Rate Risk</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{riskFactorBreakdown.interestRateRisk.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${riskFactorBreakdown.interestRateRisk}%` }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Currency Risk</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{riskFactorBreakdown.currencyRisk.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${riskFactorBreakdown.currencyRisk}%` }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Liquidity Risk</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{riskFactorBreakdown.liquidityRisk.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${riskFactorBreakdown.liquidityRisk}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Risk Mitigation Recommendations</h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mt-1">
                <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400"></div>
              </div>
              <span className="ml-2">Consider reducing technology sector exposure to decrease concentration risk</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mt-1">
                <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400"></div>
              </div>
              <span className="ml-2">Add some fixed income exposure to hedge against market volatility</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mt-1">
                <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400"></div>
              </div>
              <span className="ml-2">Consider adding some international exposure to reduce domestic market dependency</span>
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
        type="risk"
        currentFilters={filters}
      />
    </motion.div>
  );
};

export default RiskPage;