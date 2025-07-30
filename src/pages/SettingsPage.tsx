import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import apiService from '../services/api';
import { 
  Settings, 
  Moon, 
  Sun, 
  Shield, 
  Database, 
  Globe, 
  Monitor,
  Palette,
  Trash2
} from 'lucide-react';

// Define the global window property for the refresh interval
declare global {
  interface Window {
    refreshIntervalId?: number;
  }
}

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  
  const [preferences, setPreferences] = useState({
    currency: 'INR',
    language: 'en-IN',
    dataRefresh: '5',
    chartType: 'line',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await apiService.getUserSettings();
      setPreferences({
        currency: settings.currency,
        language: settings.language,
        dataRefresh: settings.data_refresh_interval.toString(),
        chartType: 'line', // This could be added to settings later
      });
      
      // Apply the current refresh interval on load
      const refreshInterval = settings.data_refresh_interval;
      localStorage.setItem('dataRefreshInterval', refreshInterval.toString());
      
      // Trigger the refresh interval change event
      window.dispatchEvent(new CustomEvent('refreshIntervalChanged', { 
        detail: { interval: refreshInterval * 1000 * 60 } 
      }));
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Apply data refresh interval immediately when changed
    if (key === 'dataRefresh') {
      const refreshInterval = parseInt(value);
      // Set websocket refresh interval or other refresh mechanisms
      if (window.refreshIntervalId) {
        clearInterval(window.refreshIntervalId);
      }
      // Store in localStorage for persistence
      localStorage.setItem('dataRefreshInterval', value);
      // Reload market data with new interval
      if (refreshInterval > 0) {
        window.dispatchEvent(new CustomEvent('refreshIntervalChanged', { 
          detail: { interval: refreshInterval * 1000 * 60 } 
        }));
      }
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all your data? This action cannot be undone.')) {
      setIsClearing(true);
      setMessage('');
      try {
        // Clear local data
        localStorage.removeItem('portfolioData');
        localStorage.removeItem('watchlist');
        localStorage.removeItem('chartPreferences');
        
        // Clear server data
        await apiService.clearPortfolioData();
        await apiService.clearAnalyticsData();
        
        setMessage('All data has been cleared successfully!');
      } catch (error) {
        setMessage('Failed to clear data. Please try again.');
        console.error('Clear data error:', error);
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage('');
    try {
      await apiService.updateUserSettings({
        theme,
        currency: preferences.currency,
        language: preferences.language,
        dataRefreshInterval: parseInt(preferences.dataRefresh),
        notifications: {
          portfolio: true,
          priceAlerts: true,
          riskAlerts: true,
          email: false,
          push: true,
        },
      });
      setMessage('Settings saved successfully!');
    } catch (error) {
      setMessage('Failed to save settings. Please try again.');
      console.error('Settings save error:', error);
    } finally {
      setLoading(false);
    }
  };  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Settings size={24} className="mr-3" />
                Settings
              </h1>
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            
            {/* Message Display */}
            {message && (
              <div className={`mt-4 p-3 rounded-md text-sm ${
                message.includes('successfully') 
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {message}
              </div>
            )}
          </div>

          <div className="px-6 py-6 space-y-8">
            {/* Appearance Settings */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Palette size={20} className="mr-2" />
                Appearance
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <div className="flex space-x-4">
                    <button
                      onClick={theme === 'dark' ? toggleTheme : undefined}
                      className={`flex items-center px-4 py-2 rounded-md border ${
                        theme === 'light'
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Sun size={16} className="mr-2" />
                      Light
                    </button>
                    <button
                      onClick={theme === 'light' ? toggleTheme : undefined}
                      className={`flex items-center px-4 py-2 rounded-md border ${
                        theme === 'dark'
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Moon size={16} className="mr-2" />
                      Dark
                    </button>
                    <button className="flex items-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      <Monitor size={16} className="mr-2" />
                      System
                    </button>
                  </div>
                </div>
              </div>
            </div>



            {/* Data & Privacy */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield size={20} className="mr-2" />
                Data & Privacy
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Refresh Interval
                  </label>
                  <select
                    value={preferences.dataRefresh}
                    onChange={(e) => handlePreferenceChange('dataRefresh', e.target.value)}
                    className="w-full md:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="1">1 minute</option>
                    <option value="5">5 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                  </select>
                </div>

                <div className="flex space-x-4">
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <Database size={16} className="mr-2" />
                    Export Data
                  </button>
                  <button 
                    onClick={handleClearAllData}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:border-red-600 dark:text-red-400 dark:bg-gray-700 dark:hover:bg-red-900/20"
                    disabled={loading || isClearing}
                  >
                    <Trash2 size={16} className="mr-2" />
                    {isClearing ? 'Clearing...' : 'Clear All Data'}
                  </button>
                </div>
              </div>
            </div>

            {/* Regional Settings */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Globe size={20} className="mr-2" />
                Regional Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="INR">₹ Indian Rupee (INR)</option>
                    <option value="USD">$ US Dollar (USD)</option>
                    <option value="EUR">€ Euro (EUR)</option>
                    <option value="GBP">£ British Pound (GBP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language & Region
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="en-IN">English (India)</option>
                    <option value="en-US">English (US)</option>
                    <option value="hi-IN">हिन्दी (India)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
