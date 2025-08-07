import React from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { useAlerts } from '../contexts/AlertsContext';
import { Menu, Bell, LogOut } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  onAlertsClick: () => void;
}

export default function Header({ onMenuClick, onAlertsClick }: HeaderProps) {
  const { user, logout } = useFirebaseAuth();
  const { unreadCount } = useAlerts();

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
          <button 
            onClick={onAlertsClick}
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

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-uganda-black">
                {user?.name}
              </p>
              <p className="text-xs text-gray-600">
                {user?.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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