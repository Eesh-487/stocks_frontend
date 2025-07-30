import React from 'react';
import { useMarketData } from '../hooks/useRealTimeData';
import { formatCurrency } from '../utils/formatters';

interface RealTimePriceProps {
  symbol: string;
  className?: string;
  showChange?: boolean;
  showPercent?: boolean;
}

const RealTimePrice: React.FC<RealTimePriceProps> = ({
  symbol,
  className = '',
  showChange = true,
  showPercent = true
}) => {
  const { data, loading, error } = useMarketData(symbol);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`text-gray-500 dark:text-gray-400 ${className}`}>
        --
      </div>
    );
  }

  const changeColor = data.changePercent >= 0 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-medium">
        {formatCurrency(data.price)}
      </span>
      
      {showChange && (
        <span className={`text-sm ${changeColor}`}>
          {data.changePercent >= 0 ? '+' : ''}
          {formatCurrency(data.change)}
        </span>
      )}
      
      {showPercent && (
        <span className={`text-sm ${changeColor}`}>
          ({data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
        </span>
      )}
    </div>
  );
};

export default RealTimePrice;