import { saveAs } from 'file-saver';

interface ExportData {
  [key: string]: any;
}

class ExportService {
  private static instance: ExportService;

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  // Export to CSV
  exportToCSV(data: ExportData[], filename: string) {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  }

  // Export to JSON
  exportToJSON(data: ExportData, filename: string) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, `${filename}.json`);
  }

  // Export portfolio data
  exportPortfolioData(holdings: any[]) {
    const portfolioData = holdings.map(holding => ({
      Symbol: holding.symbol,
      Name: holding.name,
      Category: holding.category,
      Quantity: holding.quantity,
      'Average Cost': holding.average_cost,
      'Current Price': holding.current_price,
      'Market Value': holding.value,
      'Unrealized P&L': holding.unrealized_pnl,
      'Unrealized P&L %': holding.unrealized_pnl_percent,
      'Change %': holding.change_percent
    }));

    this.exportToCSV(portfolioData, `portfolio_holdings_${new Date().toISOString().split('T')[0]}`);
  }

  // Export risk analysis data
  exportRiskAnalysis(riskMetrics: any, stressTestData: any[], riskFactorBreakdown: any) {
    const riskData = {
      riskMetrics: {
        'VaR (%)': riskMetrics.portfolioVaRPercent,
        'VaR ($)': riskMetrics.portfolioVaR,
        'CVaR (%)': riskMetrics.portfolioCVaRPercent,
        'CVaR ($)': riskMetrics.portfolioCVaR,
        'Volatility (%)': riskMetrics.volatility,
        'Beta': riskMetrics.beta,
        'Sharpe Ratio': riskMetrics.sharpeRatio,
        'Max Drawdown (%)': riskMetrics.maxDrawdown
      },
      stressTestScenarios: stressTestData,
      riskFactorBreakdown
    };

    this.exportToJSON(riskData, `risk_analysis_${new Date().toISOString().split('T')[0]}`);
  }

  // Export performance analysis
  exportPerformanceData(performanceMetrics: any, returns: any[]) {
    const performanceData = {
      metrics: performanceMetrics,
      returns: returns,
      exportDate: new Date().toISOString()
    };

    this.exportToJSON(performanceData, `performance_analysis_${new Date().toISOString().split('T')[0]}`);
  }

  // Export performance analysis (alternative method name)
  exportPerformanceAnalysis(data: any) {
    this.exportToJSON(data, `performance_analysis_${new Date().toISOString().split('T')[0]}`);
  }
}

export default ExportService.getInstance();
