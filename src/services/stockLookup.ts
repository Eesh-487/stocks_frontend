// Stock lookup service for autofill functionality
interface StockInfo {
  symbol: string;
  name: string;
  category: string;
  exchange: string;
  currency: string;
  price?: number;
}

// Demo stock database for autofill - NSE India stocks
const DEMO_STOCKS: StockInfo[] = [
  // Banking & Financial Services
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', category: 'Financials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', category: 'Financials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', category: 'Financials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Limited', category: 'Financials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', category: 'Financials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank Limited', category: 'Financials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', category: 'Financials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv Limited', category: 'Financials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'HDFCLIFE.NS', name: 'HDFC Life Insurance Company Limited', category: 'Financials', exchange: 'NSE', currency: 'INR' },
  { symbol: 'SBILIFE.NS', name: 'SBI Life Insurance Company Limited', category: 'Financials', exchange: 'NSE', currency: 'INR' },

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
  { symbol: 'SPICEJET.NS', name: 'SpiceJet Limited', category: 'Consumer Discretionary', exchange: 'NSE', currency: 'INR' }
];

class StockLookupService {
  private static instance: StockLookupService;

  static getInstance(): StockLookupService {
    if (!StockLookupService.instance) {
      StockLookupService.instance = new StockLookupService();
    }
    return StockLookupService.instance;
  }

  async searchStocks(query: string): Promise<StockInfo[]> {
    if (!query || query.trim().length === 0) return [];
    // Always use demo stock list for autofill
    const searchTerm = query.toLowerCase();
    return DEMO_STOCKS.filter(stock => 
      stock.symbol.toLowerCase().includes(searchTerm) ||
      stock.name.toLowerCase().includes(searchTerm)
    ).slice(0, 10); // Limit to 10 results
  }

  async getStockInfo(symbol: string): Promise<StockInfo | null> {
    const isDemoMode = localStorage.getItem('token')?.startsWith('demo-token');

    if (isDemoMode) {
      // Demo mode - search in local database
      const stock = DEMO_STOCKS.find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
      return stock || null;
    }

    try {
      // In real mode, you would call an API like:
      // const response = await fetch(`/api/stocks/${symbol}`);
      // return await response.json();
      
      // For now, use demo data as fallback
      const stock = DEMO_STOCKS.find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
      return stock || null;
    } catch (error) {
      console.error('Failed to fetch stock info:', error);
      return null;
    }
  }
}

export default StockLookupService.getInstance();
export type { StockInfo };
