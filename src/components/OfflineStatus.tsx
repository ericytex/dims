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

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">Offline Mode</span>
        {pendingCount > 0 && (
          <span className="bg-white text-red-500 px-2 py-1 rounded-full text-xs font-bold">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">{pendingCount} pending sync</span>
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
        {isSyncing && syncProgress.total > 0 && (
          <div className="absolute -bottom-8 left-0 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded">
            {syncProgress.current} ({syncProgress.completed}/{syncProgress.total})
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
      <Wifi className="w-4 h-4" />
      <span className="text-sm font-medium">Online</span>
      <CheckCircle className="w-4 h-4" />
    </div>
  );
};

export default OfflineStatus; 