import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Search } from 'lucide-react';
import stockLookupService, { StockInfo } from '../services/stockLookup';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: {
    symbol: string;
    name: string;
    category: string;
    quantity: number;
  }) => Promise<boolean>;
}


const assetTypeOptions = [
  'Stock',
  'Mutual Fund',
  'ETF',
  'Bond',
  'Commodity',
  'Crypto',
  'Real Estate',
  'Cash',
  'Other'
];

const categoryOptionsMap: Record<string, string[]> = {
  Stock: [
    'Technology', 'Healthcare', 'Financials', 'Consumer', 'Energy', 'Telecom', 'Industrials', 'Materials', 'Utilities', 'Real Estate'
  ],
  'Mutual Fund': ['Equity', 'Debt', 'Hybrid', 'Index', 'Other'],
  ETF: ['Equity', 'Bond', 'Commodity', 'Currency', 'Other'],
  Bond: ['Government', 'Corporate', 'Municipal', 'Other'],
  Commodity: ['Gold', 'Silver', 'Oil', 'Agriculture', 'Other'],
  Crypto: ['Bitcoin', 'Ethereum', 'Altcoin', 'Stablecoin', 'Other'],
  'Real Estate': ['Residential', 'Commercial', 'REIT', 'Other'],
  Cash: ['INR', 'USD', 'EUR', 'Other'],
  Other: ['Other']
};

const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    asset_type: 'Stock',
    symbol: '',
    name: '',
    category: 'Technology',
    quantity: '',
    purchase_price: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [autoFilledFields, setAutoFilledFields] = useState({ name: false, category: false });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Search for assets (stocks or mutual funds)
  const searchAssets = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      let results: StockInfo[] = [];
      
      // Search based on asset type
      if (formData.asset_type === 'Mutual Fund') {
        // Get mutual funds with potentially updated NAVs
        results = await stockLookupService.searchMutualFunds(query);
        
        // Trigger NAV updates for the mutual funds
        await stockLookupService.updateMutualFundNAVs();
        
        // For each result, try to get latest NAV
        for (const fund of results) {
          const latestNAV = await stockLookupService.getMutualFundNAV(fund.symbol);
          if (latestNAV) {
            fund.nav = latestNAV;
            fund.price = latestNAV;  // Keep price field in sync for consistency
          }
        }
      } else {
        // Default to stock search with filter
        results = await stockLookupService.searchStocks(query, { 
          type: formData.asset_type.toLowerCase().replace(' ', '') as any
        });
      }
      
      setSearchResults(results);
      setShowDropdown(results.length > 0);
    } catch (error) {
      console.error('Asset search failed:', error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle symbol input change with debounced search
  const handleSymbolChange = (value: string) => {
    handleInputChange('symbol', value.toUpperCase());
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    const timeout = setTimeout(() => {
      searchAssets(value);
    }, 300); // 300ms debounce

    setSearchTimeout(timeout);
  };

  // Handle asset selection from dropdown
  const handleStockSelect = async (asset: StockInfo) => {
    const newFormData = {
      ...formData,
      symbol: asset.symbol,
      name: asset.name,
      category: asset.category,
    };
    
    try {
      // For mutual funds, get latest NAV
      if (asset.type === 'mutualfund') {
        // Get updated NAV
        const latestNAV = await stockLookupService.getMutualFundNAV(asset.symbol);
        if (latestNAV) {
          newFormData.purchase_price = latestNAV.toString();
          console.log(`Latest NAV for ${asset.symbol}: ${latestNAV}`);
        } else if (asset.nav) {
          newFormData.purchase_price = asset.nav.toString();
        }
      } else if (asset.price) {
        // For stocks use price
        newFormData.purchase_price = asset.price.toString();
      }
    } catch (error) {
      console.error("Error fetching latest asset data:", error);
      // Fallback to static data
      if (asset.type === 'mutualfund' && asset.nav) {
        newFormData.purchase_price = asset.nav.toString();
      } else if (asset.price) {
        newFormData.purchase_price = asset.price.toString();
      }
    }
    
    setFormData(newFormData);
    setAutoFilledFields({ name: true, category: true });
    setShowDropdown(false);
    setSearchResults([]);
  };

  // Handle asset type change
  const handleAssetTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      asset_type: value,
      category: categoryOptionsMap[value][0] || '',
      symbol: '',
      purchase_price: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return; // Prevent double submission
    }
    
    setError('');
    setIsSubmitting(true);

    try {
      const assetData: any = {
        asset_type: formData.asset_type,
        name: formData.name || formData.symbol.toUpperCase(),
        category: formData.category,
        quantity: parseFloat(formData.quantity),
      };
      if (!['Cash', 'Other', 'Real Estate'].includes(formData.asset_type)) {
        assetData.symbol = formData.symbol.toUpperCase();
      }
      if (['Cash', 'Other', 'Real Estate'].includes(formData.asset_type) || formData.purchase_price) {
        assetData.purchase_price = formData.purchase_price ? parseFloat(formData.purchase_price) : undefined;
      }

      const success = await onAdd(assetData);

      if (success) {
        setFormData({
          asset_type: 'Stock',
          symbol: '',
          name: '',
          category: 'Technology',
          quantity: '',
          purchase_price: ''
        });
        setAutoFilledFields({ name: false, category: false });
        onClose();
      }
    } catch (err) {
      setError('Failed to add asset. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset auto-filled status when manually editing
    if (field === 'name' && autoFilledFields.name) {
      setAutoFilledFields(prev => ({ ...prev, name: false }));
    }
    if (field === 'category' && autoFilledFields.category) {
      setAutoFilledFields(prev => ({ ...prev, category: false }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Asset</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Asset Type *
                </label>
                <select
                  value={formData.asset_type}
                  onChange={e => handleAssetTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  {assetTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Symbol input for all except Cash/Other/Real Estate */}
              {!["Cash", "Other", "Real Estate"].includes(formData.asset_type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Symbol *
                  </label>
                  <div className="relative" ref={searchRef}>
                    <input
                      type="text"
                      value={formData.symbol}
                      onChange={(e) => handleSymbolChange(e.target.value)}
                      placeholder="AAPL"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                      required
                      autoComplete="off"
                    />
                    {isSearching ? (
                      <div className="absolute right-3 top-2.5">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
                    )}
                    {/* Search Results Dropdown */}
                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((asset) => (
                          <div
                            key={asset.symbol}
                            onClick={() => handleStockSelect(asset)}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                                  <span>{asset.symbol}</span>
                                  {asset.type && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                      asset.type === 'mutualfund' 
                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' 
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    }`}>
                                      {asset.type === 'mutualfund' ? 'MF' : 'Stock'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {asset.name}
                                </div>
                                {asset.type === 'mutualfund' && asset.amc && (
                                  <div className="text-xs text-gray-400 dark:text-gray-500">
                                    {asset.amc}
                                  </div>
                                )}
                                {asset.type === 'mutualfund' && asset.expense_ratio !== undefined && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Expense: {asset.expense_ratio}%
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 ml-2 min-w-[80px] text-right">
                                {asset.category}
                                {asset.type === 'mutualfund' && asset.nav && (
                                  <div className="font-medium text-gray-700 dark:text-gray-300 mt-1">
                                    NAV: ₹{asset.nav}
                                  </div>
                                )}
                                {asset.type === 'mutualfund' && asset.risk_level && (
                                  <div className="text-xs mt-1">
                                    <span className={`px-1.5 py-0.5 rounded ${
                                      asset.risk_level === 'Low' ? 'bg-green-100 text-green-800' :
                                      asset.risk_level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {asset.risk_level} Risk
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Name {autoFilledFields.name && (
                    <span className="text-xs text-green-600 dark:text-green-400">(Auto-filled)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Apple Inc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category * {autoFilledFields.category && (
                    <span className="text-xs text-green-600 dark:text-green-400">(Auto-filled)</span>
                  )}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  {(categoryOptionsMap[formData.asset_type] || []).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              {/* Purchase price for Cash, Other, Real Estate, or if user wants to override */}
              {(['Cash', 'Other', 'Real Estate'].includes(formData.asset_type)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                    placeholder="Enter price"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the value for this asset.
                  </p>
                </div>
              )}
              {/* For stocks, show auto-filled price as potentially editable */}
              {(formData.asset_type === 'Stock' && !['Cash', 'Other', 'Real Estate'].includes(formData.asset_type)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Price (Auto-filled)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                    placeholder="Market Price"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                    readOnly={autoFilledFields.name || autoFilledFields.category}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This is auto-filled from the current market price when you select a stock.
                  </p>
                </div>
              )}
              {/* For mutual funds, show NAV as purchase price */}
              {(formData.asset_type === 'Mutual Fund') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    NAV (Auto-filled)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                    placeholder="Net Asset Value"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                    readOnly={autoFilledFields.name || autoFilledFields.category}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This is the latest Net Asset Value (NAV) for the selected mutual fund.
                  </p>
                </div>
              )}
              {/* For ETFs and bonds */}
              {(['ETF', 'Bond'].includes(formData.asset_type)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                    placeholder="Market Price"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the purchase price for this {formData.asset_type.toLowerCase()}.
                  </p>
                </div>
              )}

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:bg-primary-400 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add Asset
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddAssetModal;
