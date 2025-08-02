import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building,
  Package,
  FileText,
  ArrowLeftRight,
  BarChart3,
  LogOut,
  X
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'regional_manager', 'district_manager', 'facility_manager', 'inventory_worker']
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    roles: ['admin', 'regional_manager', 'district_manager', 'facility_manager', 'inventory_worker']
  },
  {
    name: 'Facilities',
    href: '/facilities',
    icon: Building,
    roles: ['admin', 'regional_manager', 'district_manager', 'facility_manager']
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Package,
    roles: ['admin', 'regional_manager', 'district_manager', 'facility_manager']
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: FileText,
    roles: ['admin', 'regional_manager', 'district_manager', 'facility_manager']
  },
  {
    name: 'Transfers',
    href: '/transfers',
    icon: ArrowLeftRight,
    roles: ['admin', 'regional_manager', 'district_manager', 'facility_manager']
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['admin', 'regional_manager', 'district_manager', 'facility_manager']
  }
];

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const filteredNavigation = navigation.filter(item => hasRole(item.roles));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white text-gray-800 border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-4">
          {/* Header with close button for mobile */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold text-uganda-yellow">IMS</h1>
              <p className="text-sm text-gray-600">Inventory Management System</p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose} // Close sidebar on navigation for mobile
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-uganda-yellow text-uganda-black'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="w-8 h-8 bg-uganda-yellow rounded-full flex items-center justify-center">
                <span className="text-uganda-black text-sm font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full mt-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}