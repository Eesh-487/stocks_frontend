/**
 * Format currency values with the specified currency symbol
 */
export const formatCurrency = (
  value: number, 
  currency: string = 'INR', 
  locale: string = 'en-IN',
  options: Intl.NumberFormatOptions = {}
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
};

/**
 * Format number with thousand separators and specified decimal places
 */
export const formatNumber = (
  value: number, 
  decimals: number = 2, 
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format percentage values
 */
export const formatPercent = (
  value: number, 
  decimals: number = 2, 
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
};

/**
 * Format date in short format (e.g., Jan 15, 2023)
 */
export const formatDateShort = (
  date: Date | string | number,
  locale: string = 'en-IN'
): string => {
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Format date in long format (e.g., January 15, 2023)
 */
export const formatDateLong = (
  date: Date | string | number,
  locale: string = 'en-IN'
): string => {
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Format time without date (e.g., 14:30)
 */
export const formatTime = (
  date: Date | string | number,
  locale: string = 'en-IN'
): string => {
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Format date and time (e.g., Jan 15, 2023, 14:30)
 */
export const formatDateTime = (
  date: Date | string | number,
  locale: string = 'en-IN'
): string => {
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Abbreviate large numbers (e.g., 1.2K, 1.5M)
 */
export const abbreviateNumber = (value: number): string => {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toString();
};