import React, { useState } from 'react';
import { useOffline } from '../contexts/OfflineContext';
import { useNotification } from '../contexts/NotificationContext';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const OfflineStatus: React.FC = () => {
  const { isOnline, isSyncing, syncProgress, pendingCount, syncOfflineData } = useOffline();
  const { addNotification } = useNotification();

  const handleSync = async () => {
    if (!isOnline) {
      addNotification('Cannot sync while offline. Please check your internet connection.', 'error');
      return;
    }

    if (pendingCount === 0) {
      addNotification('No offline data to sync.', 'info');
      return;
    }

    try {
      await syncOfflineData();
      addNotification(`Successfully synced ${pendingCount} offline records.`, 'success');
    } catch (error) {
      addNotification('Failed to sync offline data. Please try again.', 'error');
    }
  };

  // Simple blinking dot for online status
  if (isOnline && pendingCount === 0) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    );
  }

  // Show sync status when there are pending items
  if (pendingCount > 0) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-lg shadow-lg flex items-center space-x-2 z-50">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">{pendingCount}</span>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="bg-white text-yellow-500 px-2 py-1 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50 flex items-center space-x-1"
        >
          {isSyncing ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          <span>Sync</span>
        </button>
      </div>
    );
  }

  // Offline status
  if (!isOnline) {
    return (
      <div className="fixed top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg shadow-lg flex items-center space-x-2 z-50">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">Offline</span>
        {pendingCount > 0 && (
          <span className="bg-white text-red-500 px-2 py-1 rounded-full text-xs font-bold">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  return null;
};

export default OfflineStatus; 