// Stock lookup service for autofill functionality
// API base URL for server calls
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://server-nwxv.onrender.com/api';
interface StockInfo {
  symbol: string;
  name: string;
  category: string;
  exchange: string;
  currency: string;
  price?: number;
  type?: 'stock' | 'mutualfund' | 'etf' | 'bond'; // Add asset type field
  amc?: string; // Asset Management Company for mutual funds
  subCategory?: string; // Sub-category (Large Cap, Mid Cap, etc.)
  expense_ratio?: number; // Annual expense ratio percentage
  nav?: number; // Net Asset Value
  aum?: number; // Assets Under Management (in Crores)
  risk_level?: 'Low' | 'Moderate' | 'High' | 'Very High';
  min_investment?: number; // Minimum investment amount
  exit_load?: string; // Exit load description
  change?: number; // Change in price/NAV
  changePercent?: number; // Change percentage
  ytd_return?: number; // Year-to-date return
  yahooSymbol?: string; // Yahoo Finance symbol for API lookups
  // Performance metrics
  oneYearReturn?: number;
  threeYearReturn?: number;
  fiveYearReturn?: number;
  lastUpdated?: string; // ISO date string of last update
}

// Demo stock database for autofill - NSE India stocks
const DEMO_STOCKS: StockInfo[] = [
  // Banking & Financial Services
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', category: 'Financials', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', category: 'Financials', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', category: 'Financials', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Limited', category: 'Financials', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', category: 'Financials', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank Limited', category: 'Financials', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', category: 'Financials', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv Limited', category: 'Financials', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'HDFCLIFE.NS', name: 'HDFC Life Insurance Company Limited', category: 'Financials', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'SBILIFE.NS', name: 'SBI Life Insurance Company Limited', category: 'Financials', exchange: 'NSE', currency: 'INR', type: 'stock' },

  // Information Technology
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services Limited', category: 'Technology', exchange: 'NSE', currency: 'INR' },
  { symbol: 'INFY.NS', name: 'Infosys Limited', category: 'Technology', exchange: 'NSE', currency: 'INR' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies Limited', category: 'Technology', exchange: 'NSE', currency: 'INR' },
  { symbol: 'WIPRO.NS', name: 'Wipro Limited', category: 'Technology', exchange: 'NSE', currency: 'INR' },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra Limited', category: 'Technology', exchange: 'NSE', currency: 'INR' },
  { symbol: 'LTI.NS', name: 'Larsen & Toubro Infotech Limited', category: 'Technology', exchange: 'NSE', currency: 'INR' },
  { symbol: 'MINDTREE.NS', name: 'Mindtree Limited', category: 'Technology', exchange: 'NSE', currency: 'INR' },

  // Oil & Gas
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', category: 'Energy', exchange: 'NSE', currency: 'INR' },
  { symbol: 'ONGC.NS', name: 'Oil and Natural Gas Corporation Limited', category: 'Energy', exchange: 'NSE', currency: 'INR' },
  { symbol: 'IOC.NS', name: 'Indian Oil Corporation Limited', category: 'Energy', exchange: 'NSE', currency: 'INR' },
  { symbol: 'BPCL.NS', name: 'Bharat Petroleum Corporation Limited', category: 'Energy', exchange: 'NSE', currency: 'INR' },
  { symbol: 'HPCL.NS', name: 'Hindustan Petroleum Corporation Limited', category: 'Energy', exchange: 'NSE', currency: 'INR' },

  // Metals & Mining
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel Limited', category: 'Materials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Limited', category: 'Materials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Limited', category: 'Materials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'COALINDIA.NS', name: 'Coal India Limited', category: 'Materials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'VEDL.NS', name: 'Vedanta Limited', category: 'Materials', exchange: 'NSE', currency: 'INR' },

  // Pharmaceuticals
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Limited', category: 'Healthcare', exchange: 'NSE', currency: 'INR' },
  { symbol: 'DRREDDY.NS', name: 'Dr. Reddy\'s Laboratories Limited', category: 'Healthcare', exchange: 'NSE', currency: 'INR' },
  { symbol: 'CIPLA.NS', name: 'Cipla Limited', category: 'Healthcare', exchange: 'NSE', currency: 'INR' },
  { symbol: 'DIVISLAB.NS', name: 'Divi\'s Laboratories Limited', category: 'Healthcare', exchange: 'NSE', currency: 'INR' },
  { symbol: 'BIOCON.NS', name: 'Biocon Limited', category: 'Healthcare', exchange: 'NSE', currency: 'INR' },

  // Automobiles
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited', category: 'Consumer Discretionary', exchange: 'NSE', currency: 'INR' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Limited', category: 'Consumer Discretionary', exchange: 'NSE', currency: 'INR' },
  { symbol: 'M&M.NS', name: 'Mahindra & Mahindra Limited', category: 'Consumer Discretionary', exchange: 'NSE', currency: 'INR' },
  { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Limited', category: 'Consumer Discretionary', exchange: 'NSE', currency: 'INR' },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp Limited', category: 'Consumer Discretionary', exchange: 'NSE', currency: 'INR' },

  // FMCG (Fast Moving Consumer Goods)
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited', category: 'Consumer Staples', exchange: 'NSE', currency: 'INR' },
  { symbol: 'ITC.NS', name: 'ITC Limited', category: 'Consumer Staples', exchange: 'NSE', currency: 'INR' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India Limited', category: 'Consumer Staples', exchange: 'NSE', currency: 'INR' },
  { symbol: 'BRITANNIA.NS', name: 'Britannia Industries Limited', category: 'Consumer Staples', exchange: 'NSE', currency: 'INR' },
  { symbol: 'DABUR.NS', name: 'Dabur India Limited', category: 'Consumer Staples', exchange: 'NSE', currency: 'INR' },

  // Cement
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Limited', category: 'Materials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'SHREECEM.NS', name: 'Shree Cement Limited', category: 'Materials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'ACC.NS', name: 'ACC Limited', category: 'Materials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'AMBUJACEMENT.NS', name: 'Ambuja Cements Limited', category: 'Materials', exchange: 'NSE', currency: 'INR' },

  // Telecom
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', category: 'Communication Services', exchange: 'NSE', currency: 'INR' },
  { symbol: 'IDEA.NS', name: 'Vodafone Idea Limited', category: 'Communication Services', exchange: 'NSE', currency: 'INR' },

  // Power & Utilities
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation of India Limited', category: 'Utilities', exchange: 'NSE', currency: 'INR' },
  { symbol: 'NTPC.NS', name: 'NTPC Limited', category: 'Utilities', exchange: 'NSE', currency: 'INR' },
  { symbol: 'ADANIPOWER.NS', name: 'Adani Power Limited', category: 'Utilities', exchange: 'NSE', currency: 'INR' },

  // Conglomerates
  { symbol: 'LT.NS', name: 'Larsen & Toubro Limited', category: 'Industrials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports and Special Economic Zone Limited', category: 'Industrials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises Limited', category: 'Industrials', exchange: 'NSE', currency: 'INR' },

  // New Age Tech
  { symbol: 'NYKAA.NS', name: 'FSN E-Commerce Ventures Limited', category: 'Consumer Discretionary', exchange: 'NSE', currency: 'INR' },
  { symbol: 'PAYTM.NS', name: 'One 97 Communications Limited', category: 'Technology', exchange: 'NSE', currency: 'INR' },
  { symbol: 'ZOMATO.NS', name: 'Zomato Limited', category: 'Consumer Discretionary', exchange: 'NSE', currency: 'INR' },
  { symbol: 'POLICYBZR.NS', name: 'PB Fintech Limited', category: 'Technology', exchange: 'NSE', currency: 'INR' },

  // Real Estate
  { symbol: 'DLF.NS', name: 'DLF Limited', category: 'Real Estate', exchange: 'NSE', currency: 'INR' },
  { symbol: 'GODREJPROP.NS', name: 'Godrej Properties Limited', category: 'Real Estate', exchange: 'NSE', currency: 'INR' },

  // Retail
  { symbol: 'TRENT.NS', name: 'Trent Limited', category: 'Consumer Discretionary', exchange: 'NSE', currency: 'INR' },
  { symbol: 'AVENUESUPRT.NS', name: 'Avenue Supermarts Limited', category: 'Consumer Staples', exchange: 'NSE', currency: 'INR' },

  // Chemicals
  { symbol: 'PIDILITIND.NS', name: 'Pidilite Industries Limited', category: 'Materials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'UPL.NS', name: 'UPL Limited', category: 'Materials', exchange: 'NSE', currency: 'INR' },

  // Airlines
  { symbol: 'INDIGO.NS', name: 'InterGlobe Aviation Limited', category: 'Consumer Discretionary', exchange: 'NSE', currency: 'INR' },
  { symbol: 'SPICEJET.NS', name: 'SpiceJet Limited', category: 'Consumer Discretionary', exchange: 'NSE', currency: 'INR', type: 'stock' }
];

// Indian mutual funds collection
const DEMO_MUTUAL_FUNDS: StockInfo[] = [
  // Equity Funds - Large Cap
  { 
    symbol: 'INF179K01UY0', 
    name: 'HDFC Top 100 Fund - Direct Plan', 
    category: 'Equity', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'HDFC Mutual Fund',
    nav: 892.73,
    expense_ratio: 0.65,
    risk_level: 'Moderate',
    min_investment: 5000,
    exit_load: '1% if redeemed within 1 year'
  },
  { 
    symbol: 'INF090I01LE8', 
    name: 'Axis Bluechip Fund - Direct Plan', 
    category: 'Equity', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'Axis Mutual Fund',
    nav: 456.32,
    expense_ratio: 0.44,
    risk_level: 'Moderate',
    min_investment: 5000,
    exit_load: '1% if redeemed within 1 year'
  },
  { 
    symbol: 'INF209K01VL0', 
    name: 'ICICI Prudential Bluechip Fund - Direct Plan', 
    category: 'Equity', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'ICICI Prudential Mutual Fund',
    nav: 687.21,
    expense_ratio: 0.57,
    risk_level: 'Moderate',
    min_investment: 5000,
    exit_load: '1% if redeemed within 1 year'
  },
  { 
    symbol: 'INF174K01LS2', 
    name: 'Mirae Asset Large Cap Fund - Direct Plan', 
    category: 'Equity', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'Mirae Asset Mutual Fund',
    nav: 92.35,
    expense_ratio: 0.54,
    risk_level: 'Moderate',
    min_investment: 5000,
    exit_load: '1% if redeemed within 1 year' 
  },
  
  // Equity Funds - Mid Cap
  { 
    symbol: 'INF209K01UZ2', 
    name: 'ICICI Prudential Midcap Fund - Direct Plan', 
    category: 'Equity', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'ICICI Prudential Mutual Fund' 
  },
  { 
    symbol: 'INF760K01BP0', 
    name: 'SBI Magnum Midcap Fund - Direct Plan', 
    category: 'Equity', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'SBI Mutual Fund' 
  },
  { 
    symbol: 'INF179K01WS7', 
    name: 'HDFC Mid-Cap Opportunities Fund - Direct Plan', 
    category: 'Equity', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'HDFC Mutual Fund' 
  },
  
  // Equity Funds - Small Cap
  { 
    symbol: 'INF090I01LM1', 
    name: 'Axis Small Cap Fund - Direct Plan', 
    category: 'Equity', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'Axis Mutual Fund' 
  },
  { 
    symbol: 'INF204K01Y34', 
    name: 'Nippon India Small Cap Fund - Direct Plan', 
    category: 'Equity', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'Nippon India Mutual Fund' 
  },
  
  // Index Funds
  { 
    symbol: 'INF846K01CH2', 
    name: 'UTI Nifty Index Fund - Direct Plan', 
    category: 'Equity', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'UTI Mutual Fund' 
  },
  
  // Israeli Tech Funds (from error logs)
  { 
    symbol: 'TCH-F68.TA', 
    name: 'Tachlit Israeli Tech Fund', 
    category: 'Equity', 
    exchange: 'TASE', 
    currency: 'ILS',
    type: 'mutualfund',
    amc: 'Tachlit Investment House',
    nav: 142.37,
    expense_ratio: 0.85,
    risk_level: 'High'
  },
  { 
    symbol: 'TCH-F120.TA', 
    name: 'Tachlit Global Innovation Fund', 
    category: 'Equity', 
    exchange: 'TASE', 
    currency: 'ILS',
    type: 'mutualfund',
    amc: 'Tachlit Investment House',
    nav: 187.24,
    expense_ratio: 0.92,
    risk_level: 'High'
  },
  { 
    symbol: 'TCH-F9.TA', 
    name: 'Tachlit Israel Bonds Fund', 
    category: 'Debt', 
    exchange: 'TASE', 
    currency: 'ILS',
    type: 'mutualfund',
    amc: 'Tachlit Investment House',
    nav: 241.53,
    expense_ratio: 0.45,
    risk_level: 'Moderate'
  },
  { 
    symbol: 'TCH-F11.TA', 
    name: 'Tachlit Balanced Fund', 
    category: 'Hybrid', 
    exchange: 'TASE', 
    currency: 'ILS',
    type: 'mutualfund',
    amc: 'Tachlit Investment House',
    nav: 195.82,
    expense_ratio: 0.72,
    risk_level: 'Moderate'
  },
  { 
    symbol: '11DPR.BO', 
    name: 'Aditya Birla Sun Life Dividend Yield Fund', 
    category: 'Equity', 
    exchange: 'BSE', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'Aditya Birla Sun Life Mutual Fund',
    nav: 328.46,
    expense_ratio: 0.64,
    risk_level: 'Moderate'
  },
  { 
    symbol: 'INF179K01XE5', 
    name: 'HDFC Index Fund-NIFTY 50 Plan - Direct Plan', 
    category: 'Equity', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'HDFC Mutual Fund' 
  },
  
  // Debt Funds - Liquid
  { 
    symbol: 'INF200K01LS9', 
    name: 'SBI Liquid Fund - Direct Plan', 
    category: 'Debt', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'SBI Mutual Fund' 
  },
  { 
    symbol: 'INF090I01KD1', 
    name: 'Axis Liquid Fund - Direct Plan', 
    category: 'Debt', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'Axis Mutual Fund' 
  },
  
  // Debt Funds - Corporate Bond
  { 
    symbol: 'INF209K01WA1', 
    name: 'ICICI Prudential Corporate Bond Fund - Direct Plan', 
    category: 'Debt', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'ICICI Prudential Mutual Fund' 
  },
  { 
    symbol: 'INF789F01YH2', 
    name: 'Kotak Corporate Bond Fund - Direct Plan', 
    category: 'Debt', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'Kotak Mahindra Mutual Fund' 
  },
  
  // Hybrid Funds - Aggressive
  { 
    symbol: 'INF109K01VW2', 
    name: 'ICICI Prudential Equity & Debt Fund - Direct Plan', 
    category: 'Hybrid', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'ICICI Prudential Mutual Fund' 
  },
  { 
    symbol: 'INF205K01ZR1', 
    name: 'Mirae Asset Hybrid Equity Fund - Direct Plan', 
    category: 'Hybrid', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'Mirae Asset Mutual Fund' 
  },
  
  // ELSS Funds (Tax Saving)
  { 
    symbol: 'INF090I01KW1', 
    name: 'Axis Long Term Equity Fund - Direct Plan', 
    category: 'ELSS', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'Axis Mutual Fund' 
  },
  { 
    symbol: 'INF179K01VC8', 
    name: 'HDFC Taxsaver - Direct Plan', 
    category: 'ELSS', 
    exchange: 'AMFI', 
    currency: 'INR',
    type: 'mutualfund',
    amc: 'HDFC Mutual Fund' 
  }
];

// Combine all assets for search
const ALL_ASSETS = [...DEMO_STOCKS, ...DEMO_MUTUAL_FUNDS];

class StockLookupService {
  private static instance: StockLookupService;

  static getInstance(): StockLookupService {
    if (!StockLookupService.instance) {
      StockLookupService.instance = new StockLookupService();
    }
    return StockLookupService.instance;
  }

  async searchStocks(query: string, filter?: { type?: string }): Promise<StockInfo[]> {
    if (!query || query.trim().length === 0) return [];
    
    const searchTerm = query.toLowerCase();
    let results = ALL_ASSETS.filter(asset => 
      asset.symbol.toLowerCase().includes(searchTerm) ||
      asset.name.toLowerCase().includes(searchTerm)
    );
    
    // Apply filters if specified
    if (filter?.type) {
      results = results.filter(asset => asset.type === filter.type);
    }
    
    return results.slice(0, 10); // Limit to 10 results
  }

  async searchMutualFunds(query: string, category?: string): Promise<StockInfo[]> {
    if (!query || query.trim().length === 0) return [];
    
    const isDemoMode = localStorage.getItem('token')?.startsWith('demo-token');

    if (isDemoMode) {
      // Use demo data in demo mode
      const searchTerm = query.toLowerCase();
      let results = DEMO_MUTUAL_FUNDS.filter(fund => 
        fund.symbol.toLowerCase().includes(searchTerm) ||
        fund.name.toLowerCase().includes(searchTerm) ||
        (fund.amc && fund.amc.toLowerCase().includes(searchTerm))
      );
      
      // Apply category filter if specified
      if (category) {
        results = results.filter(fund => fund.category === category);
      }
      
      return results.slice(0, 10); // Limit to 10 results
    } else {
      try {
        // In real mode, try to use the API endpoint
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/mutual-funds/search?q=${encodeURIComponent(query)}${category ? `&category=${encodeURIComponent(category)}` : ''}`, {
          headers: {
            'Authorization': `Bearer ${token || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching mutual fund data from API:', error);
        // Fall back to demo data if API fails
        return this.searchMutualFundsDemo(query, category);
      }
    }
  }
  
  // Demo version as fallback
  private searchMutualFundsDemo(query: string, category?: string): StockInfo[] {
    const searchTerm = query.toLowerCase();
    let results = DEMO_MUTUAL_FUNDS.filter(fund => 
      fund.symbol.toLowerCase().includes(searchTerm) ||
      fund.name.toLowerCase().includes(searchTerm) ||
      (fund.amc && fund.amc.toLowerCase().includes(searchTerm))
    );
    
    if (category) {
      results = results.filter(fund => fund.category === category);
    }
    
    return results.slice(0, 10);
  }

  async getStockInfo(symbol: string): Promise<StockInfo | null> {
    const isDemoMode = localStorage.getItem('token')?.startsWith('demo-token');
    
    // Check if this is a mutual fund symbol (INF prefix for AMFI codes)
    const isMutualFund = symbol.startsWith('INF');

    if (isDemoMode) {
      // Demo mode - search in local database
      const asset = ALL_ASSETS.find(a => a.symbol.toLowerCase() === symbol.toLowerCase());
      return asset || null;
    }

    try {
      // In real mode, call the appropriate API based on asset type
      if (isMutualFund) {
        return await this.getMutualFundInfo(symbol);
      } else {
        // Stock API call
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/market-data/quote/${symbol}`, {
          headers: {
            'Authorization': `Bearer ${token || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch asset info:', error);
      // Fall back to demo data
      const asset = ALL_ASSETS.find(a => a.symbol.toLowerCase() === symbol.toLowerCase());
      return asset || null;
    }
  }
  
  // Get real-time mutual fund data
  async getMutualFundInfo(symbol: string): Promise<StockInfo | null> {
    try {
      const isDemoMode = localStorage.getItem('token')?.startsWith('demo-token');
      
      if (isDemoMode) {
        // In demo mode, just return demo data
        const fund = DEMO_MUTUAL_FUNDS.find(f => f.symbol.toLowerCase() === symbol.toLowerCase());
        if (fund) {
          return {
            ...fund,
            lastUpdated: new Date().toISOString()
          };
        }
        
        // If no exact match in demo data, still show something with the symbol
        if (symbol.includes('.') || symbol.includes('-')) {
          // Looks like a Yahoo Finance symbol, create a mock entry
          return {
            symbol: symbol,
            name: `Mutual Fund ${symbol}`,
            category: 'Equity',
            exchange: 'AMFI',
            currency: 'INR',
            type: 'mutualfund',
            amc: symbol.split('-')[0] || 'Unknown AMC',
            nav: 100 + Math.random() * 100, // Random NAV between 100-200
            lastUpdated: new Date().toISOString()
          };
        }
        
        return null;
      }
      
      // Real mode - make API call
      const token = localStorage.getItem('token');
      const encodedSymbol = encodeURIComponent(symbol);
      const response = await fetch(`${API_BASE_URL}/mutual-funds/${encodedSymbol}`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch mutual fund info for ${symbol}:`, error);
      
      // Fall back to demo data
      const fund = DEMO_MUTUAL_FUNDS.find(f => f.symbol.toLowerCase() === symbol.toLowerCase());
      
      // If not found in demo data but looks like a Yahoo symbol, create a placeholder
      if (!fund && (symbol.includes('.') || symbol.includes('-'))) {
        return {
          symbol: symbol,
          name: `Mutual Fund ${symbol}`,
          category: 'Equity',
          exchange: 'AMFI',
          currency: 'INR',
          type: 'mutualfund',
          amc: symbol.split('-')[0] || 'Unknown AMC',
          nav: 100 + Math.random() * 100, // Random NAV between 100-200
          lastUpdated: new Date().toISOString()
        };
      }
      
      return fund || null;
    }
  }

  // Additional methods for mutual fund specific functionality
  async getMutualFundCategories(): Promise<string[]> {
    const categories = Array.from(new Set(DEMO_MUTUAL_FUNDS.map(fund => fund.category)));
    return categories;
  }

  async getMutualFundsByAMC(amc: string): Promise<StockInfo[]> {
    return DEMO_MUTUAL_FUNDS.filter(fund => 
      fund.amc && fund.amc.toLowerCase().includes(amc.toLowerCase())
    );
  }
  
  // Simulated function to update mutual fund NAV values
  // In a real app, this would fetch from an actual mutual fund API
  async updateMutualFundNAVs(): Promise<void> {
    const currentDate = new Date();
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    
    // Only update on weekdays in a real scenario (mutual fund NAVs typically update once a day)
    if (isWeekend) return;
    
    // Simulate small random changes to NAV values (±0.5% to 1.5%)
    DEMO_MUTUAL_FUNDS.forEach(fund => {
      if (fund.nav) {
        const changePercent = (Math.random() * 2 - 0.5) / 100; // -0.5% to +1.5%
        fund.nav = parseFloat((fund.nav * (1 + changePercent)).toFixed(2));
        fund.price = fund.nav; // Update price field for consistency with stock interface
      }
    });
    
    console.log('Mutual fund NAVs updated:', new Date().toISOString());
  }
  
  // Get real-time NAV for a mutual fund
  async getMutualFundNAV(symbol: string): Promise<number | null> {
    const isDemoMode = localStorage.getItem('token')?.startsWith('demo-token');
    
    if (isDemoMode) {
      // Simulated NAV in demo mode
      const fund = DEMO_MUTUAL_FUNDS.find(f => f.symbol === symbol);
      if (fund?.nav) {
        // Add a small random variation to simulate "real-time" updates
        const smallVariation = (Math.random() * 0.2 - 0.1) / 100; // ±0.1%
        return parseFloat((fund.nav * (1 + smallVariation)).toFixed(2));
      }
      return null;
    } else {
      try {
        // Get complete fund info from API
        const fundInfo = await this.getMutualFundInfo(symbol);
        return fundInfo?.nav || null;
      } catch (error) {
        console.error(`Error fetching NAV for ${symbol}:`, error);
        
        // Fall back to demo data
        const fund = DEMO_MUTUAL_FUNDS.find(f => f.symbol === symbol);
        return fund?.nav || null;
      }
    }
  }
  
  // Enhanced function to get complete mutual fund details with latest NAV
  // Uses real API data when available
  async getMutualFundDetails(symbol: string): Promise<StockInfo | null> {
    try {
      // Try to get real data first
      const fundInfo = await this.getMutualFundInfo(symbol);
      if (fundInfo) {
        // If we have real data, return it
        return fundInfo;
      }
    } catch (error) {
      console.error(`Error fetching complete data for ${symbol}:`, error);
    }
    
    // Fall back to demo data with simulation
    const fund = DEMO_MUTUAL_FUNDS.find(f => f.symbol === symbol);
    if (!fund) return null;
    
    // Get latest NAV (which might use the API if available)
    const latestNAV = await this.getMutualFundNAV(symbol);
    
    // Calculate some simulated metrics based on date
    const currentDate = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
    
    // Simulate 1-year return (5% to 25% range)
    const oneYearReturn = 5 + Math.random() * 20;
    
    return {
      ...fund,
      nav: latestNAV || fund.nav,
      price: latestNAV || fund.nav, // Set price same as NAV for compatibility with stock interface
      oneYearReturn: parseFloat(oneYearReturn.toFixed(2)),
      threeYearReturn: parseFloat((oneYearReturn * 0.8).toFixed(2)),
      fiveYearReturn: parseFloat((oneYearReturn * 0.7).toFixed(2)),
      lastUpdated: new Date().toISOString()
    };
  }
}

export default StockLookupService.getInstance();
export type { StockInfo };