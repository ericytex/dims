import React from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Users, 
  Package, 
  FileText, 
  TrendingUp,
  TrendingDown, 
  AlertTriangle,
  User,
  Shield,
  Eye,
  Building
} from 'lucide-react';
import RoleDebugger from '../components/RoleDebugger';

export default function Dashboard() {
  const { user } = useFirebaseAuth();

  // Role permissions mapping for debugging
  const rolePermissions = {
    admin: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports', 'database-test'],
      actions: ['create', 'read', 'update', 'delete', 'assign_roles', 'view_reports', 'manage_system']
    },
    regional_supervisor: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports'],
      actions: ['create', 'read', 'update', 'delete', 'view_reports']
    },
    district_health_officer: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports'],
      actions: ['create', 'read', 'update', 'delete', 'view_reports']
    },
    facility_manager: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports'],
      actions: ['create', 'read', 'update', 'delete', 'view_reports']
    },
    village_health_worker: {
      pages: ['dashboard', 'inventory', 'transactions'],
      actions: ['read', 'update']
    }
  };

  const currentUserPermissions = rolePermissions[user?.role as keyof typeof rolePermissions] || { pages: [], actions: [] };

  const stats = [
    {
      name: 'Total Items',
      value: '2,847',
      change: '+12%',
      changeType: 'increase',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      name: 'Active Facilities',
      value: '156',
      change: '+3%',
      changeType: 'increase',
      icon: Building,
      color: 'bg-green-500'
    },
    {
      name: 'Low Stock Items',
      value: '23',
      change: '-8%',
      changeType: 'decrease',
      icon: AlertTriangle,
      color: 'bg-uganda-red'
    },
    {
      name: 'Users Online',
      value: '89',
      change: '+18%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-uganda-yellow'
    }
  ];

  const recentTransactions = [
    {
      id: '1',
      type: 'Stock In',
      item: 'Laptop Computers',
      quantity: 50,
      facility: 'Main Warehouse',
      date: '2025-01-09',
      time: '14:30'
    },
    {
      id: '2',
      type: 'Stock Out',
      item: 'Office Supplies',
      quantity: 200,
      facility: 'Distribution Center',
      date: '2025-01-09',
      time: '13:15'
    },
    {
      id: '3',
      type: 'Transfer',
      item: 'Electronics',
      quantity: 25,
      facility: 'Regional Warehouse',
      date: '2025-01-09',
      time: '11:45'
    }
  ];

  const expiringItems = [
    {
      id: '1',
      name: 'Electronics Components',
      quantity: 45,
      expiryDate: '2025-02-15',
      facility: 'Main Warehouse',
      daysLeft: 37
    },
    {
      id: '2',
      name: 'Office Equipment',
      quantity: 120,
      expiryDate: '2025-01-25',
      facility: 'Distribution Center',
      daysLeft: 16
    },
    {
      id: '3',
      name: 'Industrial Supplies',
      quantity: 85,
      expiryDate: '2025-01-20',
      facility: 'Regional Warehouse',
      daysLeft: 11
    }
  ];

  const lowStockItems = [
    {
      id: '1',
      name: 'Computer Parts',
      currentStock: 5,
      minStock: 20,
      facility: 'Main Warehouse',
      lastUpdated: '2025-01-08'
    },
    {
      id: '2',
      name: 'Office Chairs',
      currentStock: 8,
      minStock: 15,
      facility: 'Distribution Center',
      lastUpdated: '2025-01-07'
    },
    {
      id: '3',
      name: 'Safety Equipment',
      currentStock: 12,
      minStock: 25,
      facility: 'Regional Warehouse',
      lastUpdated: '2025-01-06'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Welcome back, <span className="font-semibold">{user?.name || 'User'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'No Role'}
            </span>
          </div>
        </div>
      </div>

      {/* Role Debugger - Show for all users to help troubleshoot */}
      <RoleDebugger />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {stat.changeType === 'increase' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`ml-1 text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="ml-2 text-sm text-gray-500">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.type === 'Stock In' ? 'bg-green-500' :
                      transaction.type === 'Stock Out' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <div>
                      <p className="font-medium text-gray-900">{transaction.item}</p>
                      <p className="text-sm text-gray-500">{transaction.facility}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{transaction.quantity}</p>
                    <p className="text-sm text-gray-500">{transaction.date} {transaction.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expiring Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Expiring Items</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {expiringItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      item.daysLeft <= 7 ? 'bg-red-500' :
                      item.daysLeft <= 30 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.facility}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{item.quantity}</p>
                    <p className="text-sm text-gray-500">{item.daysLeft} days left</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Items */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Low Stock Items</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.currentStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.minStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.facility}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.lastUpdated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}