import React, { useState } from 'react';
import { useAlerts, Alert } from '../contexts/AlertsContext';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  Check, 
  Clock, 
  Package,
  Calendar,
  TrendingDown,
  Eye,
  EyeOff
} from 'lucide-react';

interface AlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ isOpen, onClose }) => {
  const { alerts, unreadCount, markAsRead, dismissAlert, dismissAllAlerts, refreshAlerts, isLoading } = useAlerts();
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'low_stock' | 'expiry' | 'reorder'>('all');

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: Alert['type']) => {
    switch (type) {
      case 'low_stock':
        return <TrendingDown className="w-4 h-4" />;
      case 'expiry':
        return <Calendar className="w-4 h-4" />;
      case 'reorder':
        return <Package className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.isRead;
    if (filter === 'critical') return alert.severity === 'critical';
    if (filter === 'low_stock') return alert.type === 'low_stock';
    if (filter === 'expiry') return alert.type === 'expiry';
    if (filter === 'reorder') return alert.type === 'reorder';
    return true;
  });

  const activeAlerts = filteredAlerts.filter(alert => !alert.isDismissed);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Alerts Panel */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-xl border-l border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-uganda-yellow" />
              <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Filter Alerts</h3>
              <button
                onClick={refreshAlerts}
                disabled={isLoading}
                className="text-xs text-uganda-yellow hover:text-yellow-600 transition-colors"
              >
                Refresh
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'unread', label: 'Unread' },
                { value: 'critical', label: 'Critical' },
                { value: 'low_stock', label: 'Low Stock' },
                { value: 'expiry', label: 'Expiry' },
                { value: 'reorder', label: 'Reorder' }
              ].map((filterOption) => (
                <button
                  key={filterOption.value}
                  onClick={() => setFilter(filterOption.value as any)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === filterOption.value
                      ? 'bg-uganda-yellow text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-uganda-yellow"></div>
              </div>
            ) : activeAlerts.length > 0 ? (
              <div className="p-4 space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-4 transition-all ${
                      alert.isRead ? 'opacity-75' : ''
                    } ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                            <div className="flex items-center space-x-1">
                              {getTypeIcon(alert.type)}
                              <span className="text-xs text-gray-500 capitalize">
                                {alert.type.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                          
                          {/* Alert Details */}
                          <div className="space-y-1 text-xs text-gray-500">
                            {alert.itemName && (
                              <div className="flex items-center space-x-1">
                                <Package className="w-3 h-3" />
                                <span>{alert.itemName}</span>
                              </div>
                            )}
                            {alert.facilityName && (
                              <div className="flex items-center space-x-1">
                                <Info className="w-3 h-3" />
                                <span>{alert.facilityName}</span>
                              </div>
                            )}
                            {alert.currentStock !== undefined && (
                              <div className="flex items-center space-x-1">
                                <TrendingDown className="w-3 h-3" />
                                <span>Stock: {alert.currentStock} units</span>
                              </div>
                            )}
                            {alert.daysUntilExpiry !== undefined && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{alert.daysUntilExpiry} days until expiry</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(alert.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {!alert.isRead && (
                          <button
                            onClick={() => markAsRead(alert.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Mark as read"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Dismiss alert"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Alerts</h3>
                <p className="text-sm text-gray-500">
                  {filter === 'all' 
                    ? 'You\'re all caught up! No alerts at the moment.'
                    : `No ${filter} alerts found.`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {activeAlerts.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={dismissAllAlerts}
                className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Dismiss All Alerts
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AlertsPanel; 