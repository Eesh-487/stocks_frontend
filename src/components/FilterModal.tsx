import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  type: 'portfolio' | 'risk';
  currentFilters: FilterOptions;
}

export interface FilterOptions {
  // Portfolio filters
  category?: string[];
  minValue?: number;
  maxValue?: number;
  profitLoss?: 'all' | 'profit' | 'loss';
  
  // Risk filters
  riskLevel?: string[];
  timeHorizon?: number[];
  confidenceLevel?: number[];
  
  // Common filters
  dateRange?: 'all' | '1w' | '1m' | '3m' | '6m' | '1y';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const categoryOptions = [
  'Technology', 'Healthcare', 'Financials', 'Consumer', 'Energy', 
  'Telecom', 'Industrials', 'Materials', 'Utilities', 'Real Estate'
];

const riskLevelOptions = ['Low', 'Medium', 'High', 'Very High'];
const timeHorizonOptions = [1, 5, 10, 21];
const confidenceLevelOptions = [90, 95, 99];

const FilterModal: React.FC<FilterModalProps> = ({ 
  isOpen, 
  onClose, 
  onApply, 
  type, 
  currentFilters 
}) => {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      category: [],
      profitLoss: 'all',
      riskLevel: [],
      timeHorizon: [],
      confidenceLevel: [],
      dateRange: 'all',
      sortBy: '',
      sortOrder: 'desc'
    };
    setFilters(resetFilters);
  };

  const toggleArrayFilter = (key: keyof FilterOptions, value: string | number) => {
    setFilters(prev => {
      const currentArray = (prev[key] as any[]) || [];
      const exists = currentArray.includes(value);
      
      return {
        ...prev,
        [key]: exists 
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter size={20} />
                {type === 'portfolio' ? 'Portfolio Filters' : 'Risk Analysis Filters'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Portfolio-specific filters */}
              {type === 'portfolio' && (
                <>
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categories
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryOptions.map(category => (
                        <label key={category} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={(filters.category || []).includes(category)}
                            onChange={() => toggleArrayFilter('category', category)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Value Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Value Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Min value"
                        value={filters.minValue || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, minValue: Number(e.target.value) || undefined }))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        placeholder="Max value"
                        value={filters.maxValue || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxValue: Number(e.target.value) || undefined }))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Profit/Loss Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Profit/Loss
                    </label>
                    <select
                      value={filters.profitLoss || 'all'}
                      onChange={(e) => setFilters(prev => ({ ...prev, profitLoss: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Holdings</option>
                      <option value="profit">Profitable Only</option>
                      <option value="loss">Loss-making Only</option>
                    </select>
                  </div>
                </>
              )}

              {/* Risk-specific filters */}
              {type === 'risk' && (
                <>
                  {/* Risk Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Risk Levels
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {riskLevelOptions.map(level => (
                        <label key={level} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={(filters.riskLevel || []).includes(level)}
                            onChange={() => toggleArrayFilter('riskLevel', level)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Time Horizon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Horizon (Days)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {timeHorizonOptions.map(days => (
                        <label key={days} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={(filters.timeHorizon || []).includes(days)}
                            onChange={() => toggleArrayFilter('timeHorizon', days)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{days} day{days > 1 ? 's' : ''}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Confidence Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confidence Level (%)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {confidenceLevelOptions.map(level => (
                        <label key={level} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={(filters.confidenceLevel || []).includes(level)}
                            onChange={() => toggleArrayFilter('confidenceLevel', level)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{level}%</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Common filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Time</option>
                  <option value="1w">Last Week</option>
                  <option value="1m">Last Month</option>
                  <option value="3m">Last 3 Months</option>
                  <option value="6m">Last 6 Months</option>
                  <option value="1y">Last Year</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;
