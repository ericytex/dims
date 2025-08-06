import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import {
  LayoutDashboard,
  Users,
  Building,
  Package,
  FileText,
  ArrowLeftRight,
  BarChart3,
  Database,
  LogOut,
  X,
  Shield
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
      roles: ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager', 'village_health_worker']
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      roles: ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager']
    },
    {
      name: 'Roles Management',
      href: '/roles-management',
      icon: Shield,
      roles: ['admin', 'regional_supervisor', 'district_health_officer']
    },
    {
      name: 'Facilities',
      href: '/facilities',
      icon: Building,
      roles: ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager']
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Package,
      roles: ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager', 'village_health_worker']
    },
    {
      name: 'Transactions',
      href: '/transactions',
      icon: FileText,
      roles: ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager', 'village_health_worker']
    },
    {
      name: 'Transfers',
      href: '/transfers',
      icon: ArrowLeftRight,
      roles: ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager']
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager']
    },
    {
      name: 'Database Test',
      href: '/database-test',
      icon: Database,
      roles: ['admin']
    }
  ];

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, logout } = useFirebaseAuth();
  const location = useLocation();

  const filteredNavigation = navigation.filter(item => user && item.roles.includes(user.role));
  
  // Debug logging
  console.log('Current user:', user);
  console.log('User role:', user?.role);
  console.log('Available navigation items:', navigation.map(item => ({ name: item.name, roles: item.roles })));
  console.log('Filtered navigation items:', filteredNavigation.map(item => item.name));

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