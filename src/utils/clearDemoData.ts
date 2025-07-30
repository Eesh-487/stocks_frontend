/**
 * Utility to clear all demo/mock data from the application
 * This will reset the application to start fresh with real data
 */

export const clearAllDemoData = () => {
  // Clear localStorage of any demo tokens or cached data
  const keysToRemove = ['token', 'demo-data', 'mock-data', 'cached-performance', 'cached-risk'];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`Cleared ${key} from localStorage`);
    }
  });

  // Clear any sessionStorage as well
  keysToRemove.forEach(key => {
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      console.log(`Cleared ${key} from sessionStorage`);
    }
  });

  console.log('All demo data cleared. Application will now use live data only.');
  
  // Force reload to ensure fresh state
  window.location.reload();
};

export const clearPerformanceCache = () => {
  localStorage.removeItem('cached-performance');
  sessionStorage.removeItem('cached-performance');
  console.log('Performance cache cleared');
};

export const clearRiskCache = () => {
  localStorage.removeItem('cached-risk');
  sessionStorage.removeItem('cached-risk');
  console.log('Risk cache cleared');
};
