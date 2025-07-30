// In production, API will be on the same domain
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
  ? (import.meta.env.VITE_API_URL || 'https://server-nwxv.onrender.com/api')
  : '/api';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/login';
          throw new Error('Unauthorized');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{
      token: string;
      user: { id: string; email: string; name: string; role: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(response.token);
    return response;
  }

  async register(email: string, password: string, name: string) {
    const response = await this.request<{
      token: string;
      user: { id: string; email: string; name: string; role: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    
    this.setToken(response.token);
    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async getCurrentUser() {
    return this.request<{
      id: string;
      email: string;
      name: string;
      role: string;
      created_at: string;
    }>('/auth/me');
  }

  async updateProfile(data: { name?: string; email?: string }) {
    return this.request<{
      user: { id: string; email: string; name: string; role: string };
      message: string;
    }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserSettings() {
    return this.request<{
      theme: string;
      currency: string;
      language: string;
      data_refresh_interval: number;
      notifications_portfolio: boolean;
      notifications_price_alerts: boolean;
      notifications_risk_alerts: boolean;
      notifications_email: boolean;
      notifications_push: boolean;
    }>('/auth/settings');
  }

  async updateUserSettings(settings: {
    theme?: string;
    currency?: string;
    language?: string;
    dataRefreshInterval?: number;
    notifications?: {
      portfolio?: boolean;
      priceAlerts?: boolean;
      riskAlerts?: boolean;
      email?: boolean;
      push?: boolean;
    };
  }) {
    return this.request<{
      settings: any;
      message: string;
    }>('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Portfolio endpoints
// Data management
  async clearPortfolioData() {
    return this.request<{ message: string }>('/portfolio/clear', { method: 'DELETE' });
  }

  async clearAnalyticsData() {
    return this.request<{ message: string }>('/analytics/clear', { method: 'DELETE' });
  }
  
  async getMarketData(symbols: string[]) {
    return this.request<Array<{
      symbol: string;
      price: number;
      change: number;
      changePercent: number;
      volume: number;
      timestamp: string;
    }>>(`/market-data/quotes?symbols=${symbols.join(',')}`);
  }

  // Portfolio endpoints
  async getHoldings() {
    return this.request<{
      holdings: Array<{
        id: string;
        symbol: string;
        company_name: string;
        quantity: number;
        average_cost: number;
        current_price: number;
        change_percent: number;
        market_value: number;
        profit_loss: number;
        profit_loss_percent: number;
      }>;
      total_value: number;
      daily_change: number;
      daily_change_percent: number;
      total_gain_loss: number;
      total_gain_loss_percent: number;
    }>('/portfolio/holdings');
  }  async addHolding(holding: {
    symbol: string;
    name: string;
    category: string;
    quantity: number;
  }) {
    return this.request<{
      message: string;
      currentPrice: number;
      purchasePrice: number;
    }>('/portfolio/holdings', {
      method: 'POST',
      body: JSON.stringify(holding),
    });
  }

  async updateHolding(id: string, updates: {
    quantity?: number;
    average_cost?: number;
  }) {
    return this.request(`/portfolio/holdings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteHolding(id: string) {
    return this.request(`/portfolio/holdings/${id}`, {
      method: 'DELETE',
    });
  }

  async getPortfolioSummary() {
    return this.request<{
      total_value: number;
      daily_pnl: number;
      daily_pnl_percent: number;
      total_cost: number;
      unrealized_pnl: number;
      unrealized_pnl_percent: number;
      holdings_count: number;
    }>('/portfolio/summary');
  }

  async getPortfolioAllocation() {
    return this.request<{
      allocation: Array<{
        category: string;
        value: number;
        percentage: number;
        holdings_count: number;
        color: string;
      }>;
      total_value: number;
    }>('/portfolio/allocation');
  }

  async refreshPortfolio() {
    return this.request<{
      message: string;
      updated_count: number;
      total_symbols: number;
      duplicates_cleaned: number;
      last_updated: string;
    }>('/portfolio/refresh', {
      method: 'POST',
    });
  }

  // cleanupDuplicateHoldings removed - now integrated in refreshPortfolio

  // Risk endpoints
  async getRiskMetrics(confidenceLevel = 95, timeHorizon = 1) {
    return this.request<{
      var_95: number;
      var_99: number;
      cvar_95: number;
      cvar_99: number;
      volatility: number;
      beta: number;
      sharpe_ratio: number;
      max_drawdown: number;
      confidence_level: number;
      time_horizon: number;
    }>(`/risk/metrics?confidence_level=${confidenceLevel}&time_horizon=${timeHorizon}`);
  }

  async getVarHistory(days = 90, confidenceLevel = 95) {
    return this.request<Array<{
      date: string;
      value: number;
    }>>(`/risk/var-history?days=${days}&confidence_level=${confidenceLevel}`);
  }

  async getStressTests() {
    return this.request<Array<{
      scenario: string;
      impact_percent: number;
      impact_amount: number;
      stressed_value: number;
    }>>('/risk/stress-tests');
  }

  async runCustomStressTest(params: {
    scenario_name: string;
    market_shock: number;
    sector_shocks?: Record<string, number>;
  }) {
    return this.request<{
      scenario_name: string;
      current_value: number;
      stressed_value: number;
      impact_percent: number;
      impact_amount: number;
    }>('/risk/stress-test', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getRiskFactors() {
    return this.request<Array<{
      factor: string;
      contribution: number;
      description: string;
    }>>('/risk/factors');
  }

  // Performance endpoints
  async getPerformanceMetrics(period = 'ytd') {
    return this.request<{
      period: string;
      period_return: number;
      benchmark_return: number;
      excess_return: number;
      volatility: number;
      sharpe_ratio: number;
      max_drawdown: number;
      start_value: number;
      end_value: number;
      days_count: number;
    }>(`/performance/metrics?period=${period}`);
  }

  async getPerformanceHistory(days = 180) {
    return this.request<Array<{
      date: string;
      total_value: number;
      daily_return: number;
      cumulative_return: number;
      benchmark_return: number;
    }>>(`/performance/history?days=${days}`);
  }

  async getMonthlyReturns(months = 24) {
    return this.request<Array<{
      period: string;
      portfolio_return: number;
      benchmark_return: number;
      excess_return: number;
    }>>(`/performance/monthly-returns?months=${months}`);
  }

  async getPerformanceAttribution() {
    return this.request<{
      total_return: number;
      category_attribution: Array<{
        category: string;
        weight: number;
        return: number;
        contribution: number;
      }>;
      factor_attribution: Array<{
        factor: string;
        contribution: number;
      }>;
    }>('/performance/attribution');
  }

  async getRiskAdjustedMetrics() {
    return this.request<{
      sharpe_ratio: number;
      sortino_ratio: number;
      information_ratio: number;
      max_drawdown: number;
      calmar_ratio: number;
      treynor_ratio: number;
    }>('/performance/risk-adjusted');
  }

  async exportPerformanceReport(format = 'json', period = 'ytd', options: {
    include_history?: boolean;
    include_monthly?: boolean;
    include_attribution?: boolean;
  } = {}) {
    const params = new URLSearchParams({
      format,
      period,
      ...Object.fromEntries(
        Object.entries(options).map(([key, value]) => [key, value.toString()])
      ),
    });

    const response = await fetch(`${this.baseURL}/performance/export?${params}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // Optimization endpoints
  async runOptimization(params: {
    method: string;
    risk_tolerance: number;
    max_position_size?: number;
    constraints?: Record<string, any>;
  }) {
    return this.request<{
      id: string;
      method: string;
      risk_tolerance: number;
      current_allocation: Array<{
        name: string;
        value: number;
        percentage: number;
      }>;
      optimized_allocation: Array<{
        name: string;
        percentage: number;
        change: number;
      }>;
      expected_return: number;
      expected_volatility: number;
      sharpe_improvement: number;
      implementation_plan: Array<{
        sector: string;
        action: string;
        change_percent: number;
        priority: string;
      }>;
    }>('/optimization/optimize', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getOptimizationHistory(limit = 10) {
    return this.request<Array<{
      id: string;
      method: string;
      risk_tolerance: number;
      expected_return: number;
      expected_volatility: number;
      sharpe_improvement: number;
      created_at: string;
    }>>(`/optimization/history?limit=${limit}`);
  }

  async getOptimizationResult(id: string) {
    return this.request(`/optimization/result/${id}`);
  }

  async applyOptimization(id: string) {
    return this.request<{
      message: string;
      trades: Array<{
        category: string;
        action: string;
        amount: number;
        current_value: number;
        target_value: number;
      }>;
      total_value: number;
    }>(`/optimization/apply/${id}`, {
      method: 'POST',
    });
  }

  async getOptimizationMethods() {
    return this.request<Array<{
      id: string;
      name: string;
      description: string;
      suitable_for: string;
    }>>('/optimization/methods');
  }

  async exportOptimization(id: string, format = 'json') {
    const response = await fetch(`${this.baseURL}/optimization/export/${id}?format=${format}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // Analytics endpoints
  async getAnalyticsDashboard(days = 30) {
    return this.request<{
      period_days: number;
      total_events: number;
      event_counts: Array<{
        event_type: string;
        count: number;
      }>;
      daily_activity: Array<{
        date: string;
        events: number;
      }>;
      top_features: Array<{
        feature: string;
        views: number;
      }>;
    }>(`/analytics/dashboard?days=${days}`);
  }

  async getInsights() {
    return this.request<{
      insights: Array<{
        type: string;
        category: string;
        title: string;
        message: string;
        priority: string;
        action: string;
      }>;
      portfolio_stats: {
        total_value: number;
        categories: number;
        holdings_count: number;
      };
    }>('/analytics/insights');
  }

  async getBehaviorAnalysis(days = 90) {
    return this.request(`/analytics/behavior?days=${days}`);
  }

  async trackEvent(eventType: string, eventData: Record<string, any> = {}) {
    return this.request('/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        event_type: eventType,
        event_data: eventData,
      }),
    });
  }

  // Market data endpoints
  async getMarketQuote(symbol: string) {
    return this.request<{
      symbol: string;
      name: string;
      sector: string;
      price: number;
      change_percent: number;
      volume: number;
      market_cap: number;
      last_updated: string;
    }>(`/market-data/quote/${symbol}`);
  }


  async getMarketOverview() {
    return this.request<{
      indices: Array<{
        symbol: string;
        name: string;
        price: number;
        change: number;
        change_percent: number;
      }>;
      top_gainers: Array<{
        symbol: string;
        name: string;
        price: number;
        change: number;
        change_percent: number;
      }>;
      top_losers: Array<{
        symbol: string;
        name: string;
        price: number;
        change: number;
        change_percent: number;
      }>;
      sector_performance: Array<{
        sector: string;
        change_percent: number;
      }>;
      market_status: string;
      last_updated: string;
    }>('/market-data/overview');
  }

  async getHistoricalData(symbol: string, period = '1y', interval = '1d') {
    return this.request<{
      symbol: string;
      period: string;
      interval: string;
      data: Array<{
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }>;
    }>(`/market-data/history/${symbol}?period=${period}&interval=${interval}`);
  }

  async addToWatchlist(symbol: string) {
    return this.request('/market-data/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    });
  }

  async getWatchlist() {
    return this.request<Array<{
      symbol: string;
      name: string;
      price: number;
      change_percent: number;
      added_at: string;
    }>>('/market-data/watchlist');
  }

  async removeFromWatchlist(symbol: string) {
    return this.request(`/market-data/watchlist/${symbol}`, {
      method: 'DELETE',
    });
  }

  // Symbol/company search (Yahoo Finance public endpoint)
  async searchSymbols(query: string) {
    // Yahoo Finance autocomplete endpoint (no API key required for basic usage)
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch symbol info');
    return await response.json();
  }
}

export const apiService = new ApiService();
export default apiService;