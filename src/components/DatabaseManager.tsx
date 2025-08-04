import React from 'react';
import { useSQLiteDatabase } from '../hooks/useSQLiteDatabase';

const DatabaseManager: React.FC = () => {
  const {
    isInitialized,
    isOnline,
    isLoading,
    error,
    stats,
    reset,
    exportDatabase,
    refreshStats,
    clearError
  } = useSQLiteDatabase();

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the database? This will clear all data.')) {
      await reset();
    }
  };

  const handleExport = async () => {
    await exportDatabase();
  };

  const handleRefreshStats = async () => {
    await refreshStats();
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Initializing database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Database Manager</h2>
      
      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
          <div className={`w-3 h-3 rounded-full mr-3 ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div>
            <p className="font-semibold text-gray-800">Database Status</p>
            <p className="text-sm text-gray-600">
              {isInitialized ? 'Initialized' : 'Not Initialized'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
          <div className={`w-3 h-3 rounded-full mr-3 ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <div>
            <p className="font-semibold text-gray-800">Connection Status</p>
            <p className="text-sm text-gray-600">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      )}

      {/* Database Statistics */}
      {stats && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Database Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
              <p className="text-sm text-blue-800">Users</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.totalItems}</p>
              <p className="text-sm text-green-800">Inventory Items</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{stats.totalTransactions}</p>
              <p className="text-sm text-purple-800">Transactions</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{stats.totalTransfers}</p>
              <p className="text-sm text-orange-800">Transfers</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingSync}</p>
              <p className="text-sm text-yellow-800">Pending Sync</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-600">
                {stats.lastSave ? new Date(stats.lastSave).toLocaleString() : 'Never'}
              </p>
              <p className="text-sm text-gray-800">Last Save</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleRefreshStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Refresh Stats
        </button>

        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export Database
        </button>

        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Reset Database
        </button>
      </div>

      {/* Information Panel */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">How it works:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Database automatically saves to IndexedDB after each write operation</li>
          <li>• Data persists between page reloads and browser restarts</li>
          <li>• Works entirely offline - no network required</li>
          <li>• Automatic save on page unload</li>
          <li>• Export functionality allows downloading the database file</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseManager; 