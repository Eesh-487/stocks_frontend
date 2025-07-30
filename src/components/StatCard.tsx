import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  description, 
  icon,
  onClick
}) => {
  let changeClass = '';
  let changeIcon = null;
  
  if (change !== undefined) {
    if (change > 0) {
      changeClass = 'positive';
      changeIcon = <ArrowUpRight size={16} />;
    } else if (change < 0) {
      changeClass = 'negative';
      changeIcon = <ArrowDownRight size={16} />;
    } else {
      changeIcon = <Minus size={16} />;
    }
  }

  return (
    <div 
      className={`stat-card ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <span className="stat-label">{title}</span>
        {icon && <div className="text-primary-500 dark:text-primary-400">{icon}</div>}
      </div>
      
      <span className="stat-value">{value}</span>
      
      {change !== undefined && (
        <div className={`stat-change ${changeClass}`}>
          {changeIcon}
          <span className="ml-1">{Math.abs(change)}%</span>
          {description && <span className="ml-1 text-gray-500 dark:text-gray-400">{description}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;