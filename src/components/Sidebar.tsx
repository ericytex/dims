import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Users, Building, Package, ArrowRightLeft, FileTerminal as FileTransfer, BarChart3, X, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      roles: ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager', 'village_health_worker']
    },
    {
      name: 'User Management',
      href: '/users',
      icon: Users,
      roles: ['admin']
    },
    {
      name: 'Facilities',
      href: '/facilities',
      icon: Building,
      roles: ['admin', 'regional_supervisor']
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Package,
      roles: ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager', 'village_health_worker']
    },
    {
      name: 'Stock Transactions',
      href: '/transactions',
      icon: ArrowRightLeft,
      roles: ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager', 'village_health_worker']
    },
    {
      name: 'Transfers',
      href: '/transfers',
      icon: FileTransfer,
      roles: ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager']
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager']
    }
  ];

  const filteredItems = navigationItems.filter(item => 
    hasRole(item.roles)
  );

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
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <img 
                src="https://images.pexels.com/photos/12935073/pexels-photo-12935073.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop" 
                alt="Uganda Coat of Arms" 
                className="w-8 h-8 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-lg font-bold text-uganda-black">DIMS</h1>
                <p className="text-xs text-gray-600">Uganda</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-uganda-yellow rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-uganda-black">
                  {user?.name?.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-uganda-black truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {user?.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                {user?.facilityName && (
                  <p className="text-xs text-gray-500 truncate">
                    {user.facilityName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-uganda-yellow text-uganda-black' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-uganda-black'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}