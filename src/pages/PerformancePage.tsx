import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import LineChart from '../components/LineChart';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { usePerformanceAnalysis } from '../hooks/usePerformanceAnalysis';
import exportService from '../services/exportService';

const PerformancePage: React.FC = () => {
  const { 
    performanceMetrics, 
    performanceReturns, 
    monthlyPerformance, 
    isLoading 
  } = usePerformanceAnalysis();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'returns' | 'risk' | 'monthly'>('overview');

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    exportService.exportPerformanceData(performanceMetrics, performanceReturns);
  };

  // Prepare chart data
  const performanceChartData = performanceReturns.slice(-90).map(point => ({
    x: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    y: point.cumulativeReturn
  }));

  const volatilityData = performanceReturns.slice(-30).map(point => ({
    x: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    y: Math.abs(point.dailyReturn)
  }));

  const stats = [
    { 
      title: 'Total Return', 
      value: `${performanceMetrics.totalReturnPercent?.toFixed(2) || '0.00'}%`, 
      icon: '📈'
    },
    { 
      title: 'Annualized Return', 
      value: `${performanceMetrics.annualizedReturn?.toFixed(2) || '0.00'}%`, 
      icon: '📊'
    },
    { 
      title: 'Sharpe Ratio', 
      value: performanceMetrics.sharpeRatio?.toFixed(2) || '0.00', 
      icon: '⚖️'
    },
    { 
      title: 'Max Drawdown', 
      value: `-${performanceMetrics.maxDrawdown?.toFixed(2) || '0.00'}%`, 
      icon: '📉'
    },
  ];

  const additionalMetrics = [
    { label: 'Volatility', value: `${performanceMetrics.volatility?.toFixed(2) || '0.00'}%` },
    { label: 'Sortino Ratio', value: performanceMetrics.sortinoRatio?.toFixed(2) || '0.00' },
    { label: 'Calmar Ratio', value: performanceMetrics.calmarRatio?.toFixed(2) || '0.00' },
    { label: 'Information Ratio', value: performanceMetrics.informationRatio?.toFixed(2) || '0.00' },
    { label: 'Beta', value: performanceMetrics.beta?.toFixed(2) || '0.00' },
    { label: 'Alpha', value: `${performanceMetrics.alpha?.toFixed(2) || '0.00'}%` },
    { label: 'Tracking Error', value: `${performanceMetrics.trackingError?.toFixed(2) || '0.00'}%` },
    { label: 'Win Rate', value: `${performanceMetrics.winRate?.toFixed(1) || '0.0'}%` },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'returns', label: 'Returns Analysis' },
    { id: 'risk', label: 'Risk Metrics' },
    { id: 'monthly', label: 'Monthly Performance' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Performance Analysis
        </h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>📊</span>
          Export Analysis
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Portfolio vs Benchmark Performance (90 Days)">
              <LineChart data={performanceChartData} />
            </ChartCard>
            
            <ChartCard title="Daily Volatility (30 Days)">
              <LineChart data={volatilityData} />
            </ChartCard>
          </div>
        </>
      )}

      {activeTab === 'returns' && (
        <div className="grid grid-cols-1 gap-6">
          <ChartCard title="Cumulative Returns">
            <LineChart data={performanceChartData} />
          </ChartCard>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Return Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Average Win</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {performanceMetrics.averageWin?.toFixed(2) || '0.00'}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Average Loss</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  -{performanceMetrics.averageLoss?.toFixed(2) || '0.00'}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Profit Factor</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {performanceMetrics.profitFactor?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Treynor Ratio</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {performanceMetrics.treynorRatio?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Risk Metrics
            </h3>
            <div className="space-y-4">
              {additionalMetrics.map((metric, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <span className="text-gray-600 dark:text-gray-400">{metric.label}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Risk Analysis
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Max Drawdown Period</p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {performanceMetrics.maxDrawdownDate ? new Date(performanceMetrics.maxDrawdownDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <span>Risk Level</span>
                  <span>
                    {(performanceMetrics.volatility || 0) < 10 ? 'Low' : 
                     (performanceMetrics.volatility || 0) < 20 ? 'Medium' : 'High'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (performanceMetrics.volatility || 0) < 10 ? 'bg-green-500' :
                      (performanceMetrics.volatility || 0) < 20 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((performanceMetrics.volatility || 0) * 3.33, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monthly' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly Performance Breakdown
            </h3>
          </div>
          <DataTable
            data={monthlyPerformance.map(perf => ({
              Month: new Date(perf.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
              PortfolioReturn: `${perf.return.toFixed(2)}%`,
              BenchmarkReturn: `${(perf.benchmark || 0).toFixed(2)}%`,
              ExcessReturn: `${(perf.excess || 0).toFixed(2)}%`,
              Performance: (perf.excess || 0) > 0 ? 'Outperformed' : 'Underperformed'
            }))}
            columns={[
              { header: 'Month', accessor: 'Month' },
              { header: 'Portfolio Return', accessor: 'PortfolioReturn' },
              { header: 'Benchmark Return', accessor: 'BenchmarkReturn' },
              { header: 'Excess Return', accessor: 'ExcessReturn' },
              { header: 'Performance', accessor: 'Performance' }
            ]}
            keyField="Month"
          />
        </div>
      )}
    </div>
  );
};

export default PerformancePage;