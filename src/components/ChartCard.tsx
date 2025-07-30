import React from 'react';
import { Info } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  info?: string;
  className?: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  subtitle, 
  info, 
  className = '', 
  children 
}) => {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        
        {info && (
          <div className="relative group">
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Info size={18} />
            </button>
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg py-2 px-3 z-10 text-sm text-gray-600 dark:text-gray-300 hidden group-hover:block border border-gray-100 dark:border-gray-700">
              {info}
            </div>
          </div>
        )}
      </div>
      
      <div className="chart-container">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;