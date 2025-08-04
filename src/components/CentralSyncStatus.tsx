import React from 'react';
import { useCentralSync } from '../hooks/useCentralSync';
import { RefreshCw, Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const CentralSyncStatus: React.FC = () => {
  const { 
    isOnline, 
    isSyncing, 
    lastSync, 
    syncProgress, 
    error, 
    pendingItems,
    sync, 
    refreshStats, 
    clearError 
  } = useCentralSync();

  const handleManualSync = async () => {
    try {
      await sync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const getStatusIcon = () => {
    if (isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (lastSync) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (error) return 'Sync Error';
    if (lastSync) return 'Last Sync';
    return 'Never Synced';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Central Database Sync</h3>
      
      {/* Status Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500 mr-2" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500 mr-2" />
            )}
            <div>
              <p className="font-semibold text-gray-800">Connection</p>
              <p className="text-sm text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            {getStatusIcon()}
            <div className="ml-2">
              <p className="font-semibold text-gray-800">Sync Status</p>
              <p className="text-sm text-gray-600">{getStatusText()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-semibold text-gray-800">Pending Items</p>
            <p className="text-2xl font-bold text-blue-600">{pendingItems}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-semibold text-gray-800">Last Sync</p>
            <p className="text-sm text-gray-600">
              {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {isSyncing && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{syncProgress.current}</span>
            <span>{syncProgress.completed}/{syncProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ 
                width: `${syncProgress.total > 0 ? (syncProgress.completed / syncProgress.total) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-800 font-medium">Sync Error</span>
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
          <p className="text-red-700 mt-2 text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleManualSync}
          disabled={isSyncing || !isOnline}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>

        <button
          onClick={refreshStats}
          disabled={isSyncing}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Stats
        </button>
      </div>

      {/* Information Panel */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">How Central Sync Works</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Local changes are marked as 'pending' in your browser</li>
          <li>• Sync downloads the central database from the server</li>
          <li>• Local pending changes are merged with central data</li>
          <li>• Merged database is uploaded back to the server</li>
          <li>• All devices get the same data after sync</li>
        </ul>
      </div>
    </div>
  );
};

export default CentralSyncStatus; 