import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, Plus, RefreshCw as Refresh, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import AllocationChart from '../components/AllocationChart';
import AddAssetModal from '../components/AddAssetModal';
import FilterModal, { FilterOptions } from '../components/FilterModal';
import { usePortfolio } from '../hooks/usePortfolio';
import { formatCurrency } from '../utils/formatters';
import exportService from '../services/exportService';

interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  category: string;
  quantity: number;
  average_cost: number;
  purchase_price?: number;
  current_price: number | null;
  value: number | null;
  allocation: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  change_percent: number | null;
}

const PortfolioPage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: [],
    profitLoss: 'all',
    dateRange: 'all',
    sortBy: '',
    sortOrder: 'desc'
  });
  const { 
    holdings, 
    totalValue, 
    addHolding, 
    removeHolding, 
    refreshHoldings,
    refreshPortfolio
    // cleanupDuplicates - now integrated in refreshPortfolio
  } = usePortfolio();

  // Calculate category allocations from holdings
  const categoryAllocations = holdings.reduce((acc: any[], holding) => {
    const existing = acc.find(cat => cat.name === holding.category);
    if (existing) {
      existing.value += (holding.value || 0);
    } else {
      acc.push({
        name: holding.category,
        value: holding.value || 0,
        allocation: 0 // Will be calculated below
      });
    }
    return acc;
  }, []);

  // Calculate percentages
  categoryAllocations.forEach(cat => {
    cat.allocation = totalValue > 0 ? (cat.value / totalValue) * 100 : 0;
  });

  // Apply filters to holdings
  const filteredHoldings = useMemo(() => {
    let filtered = [...holdings];

    // Category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(holding => filters.category!.includes(holding.category));
    }

    // Value range filter
    if (filters.minValue !== undefined) {
      filtered = filtered.filter(holding => (holding.value || 0) >= filters.minValue!);
    }
    if (filters.maxValue !== undefined) {
      filtered = filtered.filter(holding => (holding.value || 0) <= filters.maxValue!);
    }

    // Profit/Loss filter
    if (filters.profitLoss === 'profit') {
      filtered = filtered.filter(holding => holding.unrealized_pnl > 0);
    } else if (filters.profitLoss === 'loss') {
      filtered = filtered.filter(holding => holding.unrealized_pnl < 0);
    }

    return filtered;
  }, [holdings, filters]);

  // Handle export
  const handleExport = () => {
    exportService.exportPortfolioData(filteredHoldings);
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

  const columns = [
    { header: 'Symbol', accessor: 'symbol' as keyof PortfolioHolding },
    { header: 'Name', accessor: 'name' as keyof PortfolioHolding },
    { header: 'Category', accessor: 'category' as keyof PortfolioHolding },
    { header: 'Quantity', accessor: 'quantity' as keyof PortfolioHolding },
    { 
      header: 'Purchase Price',
      accessor: (row: PortfolioHolding) => formatCurrency(row.purchase_price || 0)
    },
    { 
      header: 'Current Price', 
      accessor: (row: PortfolioHolding) => formatCurrency(row.current_price || 0) 
    },
    { 
      header: 'Net Expenditure', 
      accessor: (row: PortfolioHolding) => formatCurrency(row.net_expenditure || 0),
      className: 'font-medium'
    },
    { 
      header: 'Change', 
      accessor: (row: PortfolioHolding) => {
        const changePercent = row.change_percent ?? 0;
        return (
          <span className={changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
          </span>
        );
      }
    },
    { 
      header: 'Allocation', 
      accessor: (row: PortfolioHolding) => {
        const allocation = totalValue > 0 ? ((row.net_expenditure || 0) / totalValue) * 100 : 0;
        return `${allocation.toFixed(2)}%`;
      }
    },
  ];

  const handleAssetClick = (asset: PortfolioHolding) => {
    setSelectedAsset(asset);
  };

  const handleAddAsset = async (newAsset: { symbol: string; name: string; category: string; quantity: number }) => {
  try {
    const success = await addHolding(newAsset);
    if (success) {
      // Optionally force a refresh here
      await refreshHoldings();
      setShowAddModal(false);
    }
    return success;
  } catch (error) {
    console.error('Failed to add asset:', error);
    return false;
  }
};

  // Cleanup now happens automatically when refreshing holdings

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await removeHolding(assetId);
      setSelectedAsset(null);
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <motion.h1 variants={itemVariants} className="text-2xl font-bold">
          Portfolio
          {(filters.category?.length || filters.profitLoss !== 'all' || filters.minValue || filters.maxValue) && (
            <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">(Filtered)</span>
          )}
        </motion.h1>
        
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
          <button 
            className="btn-secondary flex items-center gap-2"
            onClick={() => setShowFilterModal(true)}
          >
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button 
            className="btn-secondary flex items-center gap-2"
            onClick={refreshPortfolio}
          >
            <Refresh size={16} />
            <span>Refresh</span>
          </button>
          {/* Duplicate cleanup now happens automatically when refreshing */}
          <button 
            className="btn-secondary flex items-center gap-2"
            onClick={handleExport}
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button 
            className="btn-secondary flex items-center gap-2"
            onClick={refreshHoldings}
          >
            <Refresh size={16} />
            <span>Refresh</span>
          </button>
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Add Asset</span>
          </button>
        </motion.div>
      </div>
      
      <motion.div variants={itemVariants} className="card p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Portfolio Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
                <span className="font-semibold">{formatCurrency(totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Assets:</span>
                <span className="font-semibold">{filteredHoldings.length} {filteredHoldings.length !== holdings.length && `(of ${holdings.length})`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Categories:</span>
                <span className="font-semibold">{categoryAllocations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Top Holding:</span>
                <span className="font-semibold">
                  {holdings.length > 0 
                    ? `${holdings.sort((a: any, b: any) => (b.value || 0) - (a.value || 0))[0].symbol} (${(((holdings.sort((a: any, b: any) => (b.value || 0) - (a.value || 0))[0].value || 0) / totalValue) * 100).toFixed(2)}%)`
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Category Allocation</h3>
            <AllocationChart
              allocations={categoryAllocations}
              totalValue={totalValue}
            />
          </div>
        </div>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Portfolio Holdings</h3>
        <DataTable
          columns={columns}
          data={filteredHoldings}
          keyField="id"
          searchable
          pagination
          rowsPerPage={8}
          onRowClick={handleAssetClick}
        />
      </motion.div>
      
      {selectedAsset && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {selectedAsset.symbol}: {selectedAsset.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Category: {selectedAsset.category}</p>
            </div>
            <button 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setSelectedAsset(null)}
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Quantity</div>
              <div className="text-lg font-semibold mt-1">{selectedAsset.quantity}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Current Price</div>
              <div className="text-lg font-semibold mt-1">{formatCurrency(selectedAsset.current_price)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Value</div>
              <div className="text-lg font-semibold mt-1">{formatCurrency(selectedAsset.value)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Allocation</div>
              <div className="text-lg font-semibold mt-1">{((selectedAsset.value / totalValue) * 100).toFixed(2)}%</div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button className="btn-primary">Trade</button>
            <button className="btn-secondary">View Details</button>
            <button 
              className="btn-danger flex items-center gap-2"
              onClick={() => handleDeleteAsset(selectedAsset.id)}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </motion.div>
      )}

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAsset}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
        type="portfolio"
        currentFilters={filters}
      />
    </motion.div>
  );
};

export default PortfolioPage;