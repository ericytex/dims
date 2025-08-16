import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { useAlerts, Alert } from '../contexts/AlertsContext';
import { useOffline } from '../contexts/OfflineContext';
import { 
  Menu, 
  Bell, 
  LogOut, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Package,
  Calendar,
  TrendingDown,
  ExternalLink,
  X
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  onAlertsClick: () => void;
}

export default function Header({ onMenuClick, onAlertsClick }: HeaderProps) {
  const { user, logout } = useFirebaseAuth();
  const { alerts, unreadCount, markAsRead } = useAlerts();
  const { isOnline, pendingCount } = useOffline();
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const navigate = useNavigate();

  const recentAlerts = alerts
    .filter(alert => !alert.isDismissed)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleViewItem = (alert: Alert) => {
    if (alert.itemId) {
      if (!alert.isRead) {
        markAsRead(alert.id);
      }
      navigate(`/inventory?itemId=${alert.itemId}`);
      setShowAlertsDropdown(false);
    }
  };

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: Alert['type']) => {
    switch (type) {
      case 'low_stock':
        return <TrendingDown className="w-3 h-3" />;
      case 'expiry':
        return <Calendar className="w-3 h-3" />;
      case 'reorder':
        return <Package className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  // Helper function to format role names
  const formatRoleName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'System Administrator',
      'regional_supervisor': 'Regional Manager',
      'district_health_officer': 'District Manager',
      'facility_manager': 'Facility Manager',
      'village_health_worker': 'Village Health Worker'
    };
    return roleMap[role] || role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-uganda-black">
              Decentralized Inventory Management System
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Online Status Indicator */}
          <div className="flex items-center space-x-2">
            {isOnline && pendingCount === 0 ? (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            ) : !isOnline ? (
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            ) : (
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="View Alerts"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-uganda-red text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Alerts Dropdown */}
            {showAlertsDropdown && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowAlertsDropdown(false)}
                />
                
                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Recent Alerts</h3>
                      <button
                        onClick={onAlertsClick}
                        className="text-xs text-uganda-yellow hover:text-yellow-600 transition-colors"
                      >
                        View All
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {recentAlerts.length > 0 ? (
                      <div className="p-2 space-y-2">
                        {recentAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-gray-50 ${
                              alert.isRead ? 'opacity-75' : 'border-l-4 border-l-uganda-yellow'
                            }`}
                            onClick={() => handleViewItem(alert)}
                          >
                            <div className="flex items-start space-x-3">
                              {getSeverityIcon(alert.severity)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {alert.title}
                                  </h4>
                                  <div className="flex items-center space-x-1">
                                    {getTypeIcon(alert.type)}
                                    <span className="text-xs text-gray-500 capitalize">
                                      {alert.type.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                  {alert.message}
                                </p>
                                
                                {/* Alert Details */}
                                <div className="space-y-1 text-xs text-gray-500">
                                  {alert.itemName && (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-1">
                                        <Package className="w-3 h-3" />
                                        <span className="truncate">{alert.itemName}</span>
                                      </div>
                                      <ExternalLink className="w-3 h-3 text-blue-600" />
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
                                      <Calendar className="w-3 h-3" />
                                      <span>{alert.daysUntilExpiry} days until expiry</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No alerts at the moment</p>
                      </div>
                    )}
                  </div>
                  
                  {recentAlerts.length > 0 && (
                    <div className="p-3 border-t border-gray-200">
                      <button
                        onClick={onAlertsClick}
                        className="w-full px-3 py-2 text-sm text-uganda-yellow bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                      >
                        View All Alerts
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-uganda-black">
                {user?.displayName || user?.email}
              </p>
              <p className="text-xs text-gray-600">
                {user?.role ? formatRoleName(user.role) : 'No Role'}
              </p>
            </div>
            
            <button
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-uganda-red"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}