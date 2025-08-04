import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import stockLookup, { StockInfo } from '../services/stockLookup';

const MutualFundLookupDemo: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [results, setResults] = useState<StockInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedFund, setSelectedFund] = useState<StockInfo | null>(null);

  // Load mutual fund categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const cats = await stockLookup.getMutualFundCategories();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (query.trim().length === 0) return;
    
    setIsLoading(true);
    try {
      const funds = await stockLookup.searchMutualFunds(query, selectedCategory || undefined);
      setResults(funds);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle fund selection
  const handleSelectFund = async (symbol: string) => {
    setIsLoading(true);
    try {
      const fund = await stockLookup.getStockInfo(symbol);
      setSelectedFund(fund);
    } catch (error) {
      console.error('Failed to get fund details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Mutual Fund Lookup</h2>
      
      {/* Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Mutual Funds
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter fund name, AMC, or code"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Filter
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div className="self-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </motion.button>
        </div>
      </div>
      
      {/* Results List */}
      {results.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Search Results</h3>
          <div className="bg-gray-50 rounded-md border border-gray-200">
            {results.map(fund => (
              <motion.div
                key={fund.symbol}
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                className="p-3 border-b border-gray-200 last:border-b-0 cursor-pointer"
                onClick={() => handleSelectFund(fund.symbol)}
              >
                <div className="font-medium">{fund.name}</div>
                <div className="text-sm text-gray-500 flex justify-between">
                  <span>{fund.amc}</span>
                  <span>{fund.category}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Selected Fund Details */}
      {selectedFund && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h3 className="text-xl font-semibold mb-3">{selectedFund.name}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Symbol</p>
              <p className="font-medium">{selectedFund.symbol}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Asset Management Company</p>
              <p className="font-medium">{selectedFund.amc}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium">{selectedFund.category}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Exchange</p>
              <p className="font-medium">{selectedFund.exchange}</p>
            </div>
            
            {selectedFund.nav && (
              <div>
                <p className="text-sm text-gray-500">NAV</p>
                <p className="font-medium">₹{selectedFund.nav.toFixed(2)}</p>
              </div>
            )}
            
            {selectedFund.expense_ratio && (
              <div>
                <p className="text-sm text-gray-500">Expense Ratio</p>
                <p className="font-medium">{selectedFund.expense_ratio}%</p>
              </div>
            )}
            
            {selectedFund.risk_level && (
              <div>
                <p className="text-sm text-gray-500">Risk Level</p>
                <p className="font-medium">{selectedFund.risk_level}</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Add to Portfolio
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MutualFundLookupDemo;
