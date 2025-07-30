import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, TrendingUp, BarChart3, ChevronRight, Sparkles, Zap } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import AllocationChart from '../components/AllocationChart';
import LineChart from '../components/LineChart';
import { formatCurrency, formatDateShort } from '../utils/formatters';
import { usePortfolio } from '../hooks/usePortfolio';
import { usePerformanceAnalysis } from '../hooks/usePerformanceAnalysis';
import { useRiskAnalysis } from '../hooks/useRiskAnalysis';
import { useRealTimeData } from '../hooks/useRealTimeData';

const DashboardPage: React.FC = () => {
  const { holdings, totalValue, isLoading: portfolioLoading } = usePortfolio();
  const { performanceMetrics, performanceReturns, isLoading: performanceLoading } = usePerformanceAnalysis();
  const { isLoading: riskLoading } = useRiskAnalysis();
  const { isConnected } = useRealTimeData();

  const isLoading = portfolioLoading || performanceLoading || riskLoading;

  // Calculate dynamic stats
  const totalInvestment = holdings.reduce((sum, holding) => sum + (holding.average_cost * holding.quantity), 0);
  const unrealizedPnL = totalValue - totalInvestment;
  const unrealizedPnLPercent = totalInvestment > 0 ? (unrealizedPnL / totalInvestment) * 100 : 0;
  
  // Get today's performance from last data point
  const todayReturn = performanceReturns.length > 0 ? performanceReturns[performanceReturns.length - 1].dailyReturn : 0;
  const todayValue = todayReturn * totalValue / 100;

  // Calculate sector allocation from holdings
  const sectorAllocations = holdings.reduce((acc, holding) => {
    const category = holding.category || 'Other';
    if (!acc[category]) {
      acc[category] = { name: category, value: 0, color: getSectorColor(category) };
    }
    acc[category].value += holding.value || 0;
    return acc;
  }, {} as Record<string, { name: string; value: number; color: string }>);

  const allocationData = Object.values(sectorAllocations);

  // Performance chart data (last 90 days)
  const performanceChartData = performanceReturns.slice(-90).map(point => ({
    x: formatDateShort(new Date(point.date)),
    y: point.portfolioValue || totalValue
  }));

  // Get insights based on real data
  const insights = getPortfolioInsights(performanceMetrics, allocationData, totalValue);

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <motion.h1 variants={itemVariants} className="text-2xl font-bold">Dashboard</motion.h1>
        <motion.div variants={itemVariants} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          Last updated: {new Date().toLocaleTimeString()}
        </motion.div>
      </div>
      
      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Portfolio Value" 
          value={formatCurrency(totalValue)}
          change={unrealizedPnLPercent}
          description="total return"
          icon={<Wallet size={20} />}
        />
        <StatCard 
          title="Today's P&L" 
          value={formatCurrency(todayValue)}
          change={todayReturn}
          description="daily change"
          icon={<CreditCard size={20} />}
        />
        <StatCard 
          title="Total Return" 
          value={`${(performanceMetrics?.totalReturnPercent || 0).toFixed(2)}%`}
          change={performanceMetrics?.annualizedReturn || 0}
          description="annualized"
          icon={<TrendingUp size={20} />}
        />
        <StatCard 
          title="Risk Level" 
          value={`${(performanceMetrics?.volatility || 0).toFixed(1)}%`}
          change={performanceMetrics?.sharpeRatio || 0}
          description="Sharpe ratio"
          icon={<BarChart3 size={20} />}
        />
      </motion.div>
      
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <ChartCard 
            title="Portfolio Performance" 
            subtitle="Last 90 days"
            info="Shows the total value of your portfolio over time based on real market data."
          >
            <LineChart 
              data={performanceChartData}
              height={300}
              formatY={(val) => formatCurrency(val)}
            />
          </ChartCard>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <ChartCard 
            title="Asset Allocation" 
            subtitle="By sector"
            info="Your current portfolio allocation based on actual holdings. Diversification helps reduce risk."
          >
            <AllocationChart 
              allocations={allocationData}
              totalValue={totalValue}
            />
          </ChartCard>
        </motion.div>
      </div>
      
      {/* Analytics Insights */}
      <motion.div variants={itemVariants} className="card">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Analytics Insights</h3>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className={`flex items-start p-3 rounded-lg ${insight.bgColor} border ${insight.borderColor}`}>
              <div className="flex-shrink-0 mt-0.5">
                <div className={`w-8 h-8 rounded-full ${insight.iconBg} flex items-center justify-center ${insight.iconColor}`}>
                  {insight.icon}
                </div>
              </div>
              <div className="ml-3">
                <h4 className={`font-medium ${insight.titleColor}`}>{insight.title}</h4>
                <p className={`text-sm ${insight.textColor} mt-1`}>
                  {insight.description}
                </p>
                <button className={`mt-2 inline-flex items-center text-sm font-medium ${insight.linkColor} hover:${insight.linkHover}`}>
                  View details <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Helper function to get sector colors
function getSectorColor(sector: string): string {
  const colors: Record<string, string> = {
    Technology: '#3B82F6',
    Healthcare: '#10B981',
    Financials: '#F59E0B',
    'Consumer Discretionary': '#8B5CF6',
    'Consumer Staples': '#EC4899',
    Energy: '#EF4444',
    Industrials: '#6366F1',
    Materials: '#84CC16',
    Utilities: '#06B6D4',
    'Real Estate': '#F97316',
    'Communication Services': '#14B8A6',
    Other: '#6B7280'
  };
  return colors[sector] || '#6B7280';
}

// Helper function to generate insights based on portfolio data
function getPortfolioInsights(
  performanceMetrics: any, 
  allocations: any[], 
  totalValue: number
) {
  const insights = [];

  // Allocation insight
  if (allocations.length > 0) {
    const largestSector = allocations.reduce((max, sector) => 
      sector.value > max.value ? sector : max
    );
    const largestPercentage = (largestSector.value / totalValue) * 100;
    
    if (largestPercentage > 40) {
      insights.push({
        title: 'Concentration Risk Alert',
        description: `Your ${largestSector.name} allocation (${largestPercentage.toFixed(1)}%) is quite high. Consider diversifying to reduce risk.`,
        icon: <Sparkles size={18} />,
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        iconBg: 'bg-yellow-100 dark:bg-yellow-800',
        iconColor: 'text-yellow-600 dark:text-yellow-300',
        titleColor: 'text-yellow-800 dark:text-yellow-300',
        textColor: 'text-yellow-700 dark:text-yellow-400',
        linkColor: 'text-yellow-600 dark:text-yellow-400',
        linkHover: 'text-yellow-800 dark:hover:text-yellow-300'
      });
    }
  }

  // Performance insight
  if (performanceMetrics?.totalReturnPercent) {
    if (performanceMetrics.totalReturnPercent > 5) {
      insights.push({
        title: 'Strong Performance',
        description: `Your portfolio is outperforming with a ${performanceMetrics.totalReturnPercent.toFixed(1)}% return and a Sharpe ratio of ${(performanceMetrics.sharpeRatio || 0).toFixed(2)}.`,
        icon: <Zap size={18} />,
        bgColor: 'bg-green-50 dark:bg-green-900/30',
        borderColor: 'border-green-200 dark:border-green-800',
        iconBg: 'bg-green-100 dark:bg-green-800',
        iconColor: 'text-green-600 dark:text-green-300',
        titleColor: 'text-green-800 dark:text-green-300',
        textColor: 'text-green-700 dark:text-green-400',
        linkColor: 'text-green-600 dark:text-green-400',
        linkHover: 'text-green-800 dark:hover:text-green-300'
      });
    } else if (performanceMetrics.totalReturnPercent < -5) {
      insights.push({
        title: 'Performance Review Needed',
        description: `Your portfolio has a ${Math.abs(performanceMetrics.totalReturnPercent).toFixed(1)}% loss. Consider reviewing your strategy or rebalancing.`,
        icon: <TrendingUp size={18} />,
        bgColor: 'bg-red-50 dark:bg-red-900/30',
        borderColor: 'border-red-200 dark:border-red-800',
        iconBg: 'bg-red-100 dark:bg-red-800',
        iconColor: 'text-red-600 dark:text-red-300',
        titleColor: 'text-red-800 dark:text-red-300',
        textColor: 'text-red-700 dark:text-red-400',
        linkColor: 'text-red-600 dark:text-red-400',
        linkHover: 'text-red-800 dark:hover:text-red-300'
      });
    }
  }

  // Risk insight
  if (performanceMetrics?.volatility > 20) {
    insights.push({
      title: 'High Volatility Warning',
      description: `Your portfolio volatility is ${performanceMetrics.volatility.toFixed(1)}%, which is considered high. Consider adding more stable assets.`,
      icon: <BarChart3 size={18} />,
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      borderColor: 'border-orange-200 dark:border-orange-800',
      iconBg: 'bg-orange-100 dark:bg-orange-800',
      iconColor: 'text-orange-600 dark:text-orange-300',
      titleColor: 'text-orange-800 dark:text-orange-300',
      textColor: 'text-orange-700 dark:text-orange-400',
      linkColor: 'text-orange-600 dark:text-orange-400',
      linkHover: 'text-orange-800 dark:hover:text-orange-300'
    });
  }

  // Default insight if no specific insights
  if (insights.length === 0) {
    insights.push({
      title: 'Portfolio is Well Balanced',
      description: 'Your portfolio appears to be well-diversified with reasonable risk levels. Continue monitoring performance.',
      icon: <Sparkles size={18} />,
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-300',
      titleColor: 'text-blue-800 dark:text-blue-300',
      textColor: 'text-blue-700 dark:text-blue-400',
      linkColor: 'text-blue-600 dark:text-blue-400',
      linkHover: 'text-blue-800 dark:hover:text-blue-300'
    });
  }

  return insights;
}

export default DashboardPage;
