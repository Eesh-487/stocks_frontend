import React from 'react';

interface AllocationChartProps {
  allocations: {
    name: string;
    value: number;
    color: string;
  }[];
  totalValue: number;
}

const AllocationChart: React.FC<AllocationChartProps> = ({ allocations, totalValue }) => {
  // Sort allocations by value (descending)
  const sortedAllocations = [...allocations].sort((a, b) => b.value - a.value);
  
  return (
    <div className="flex flex-col">
      {/* Allocation bar */}
      <div className="h-8 w-full flex rounded-md overflow-hidden mb-4">
        {sortedAllocations.map((allocation, index) => {
          const width = `${(allocation.value / totalValue) * 100}%`;
          return (
            <div 
              key={index}
              className="h-full group relative transition-all"
              style={{ width, backgroundColor: allocation.color }}
            >
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 text-xs rounded shadow px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {allocation.name}: {((allocation.value / totalValue) * 100).toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sortedAllocations.map((allocation, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-sm mr-2" 
              style={{ backgroundColor: allocation.color }}
            ></div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {allocation.name}
              </span>
              <div className="flex items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {((allocation.value / totalValue) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllocationChart;