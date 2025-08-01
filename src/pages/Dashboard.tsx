import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Package,
  Building,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

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
      item: 'Paracetamol 500mg',
      quantity: 1000,
      facility: 'Mulago Hospital',
      date: '2025-01-09',
      time: '14:30'
    },
    {
      id: '2',
      type: 'Stock Out',
      item: 'Amoxicillin 250mg',
      quantity: 50,
      facility: 'Kawempe HC IV',
      date: '2025-01-09',
      time: '13:15'
    },
    {
      id: '3',
      type: 'Transfer',
      item: 'Artemether/Lumefantrine',
      quantity: 200,
      facility: 'Kiruddu Hospital',
      date: '2025-01-09',
      time: '11:45'
    }
  ];

  const expiringItems = [
    {
      id: '1',
      name: 'Insulin Vials',
      quantity: 45,
      expiryDate: '2025-02-15',
      facility: 'Mulago Hospital',
      daysLeft: 37
    },
    {
      id: '2',
      name: 'ORS Sachets',
      quantity: 120,
      expiryDate: '2025-01-25',
      facility: 'Kawempe HC IV',
      daysLeft: 16
    },
    {
      id: '3',
      name: 'Vitamin A Capsules',
      quantity: 80,
      expiryDate: '2025-03-10',
      facility: 'Kiruddu Hospital',
      daysLeft: 60
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-uganda-black">
              Welcome back, {user?.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              {user?.facilityName && ` • ${user.facilityName}`}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-UG', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-uganda-black mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {stat.changeType === 'increase' ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-uganda-red mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-500' : 'text-uganda-red'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-uganda-black">
              Recent Transactions
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.type === 'Stock In' ? 'bg-green-500' :
                        transaction.type === 'Stock Out' ? 'bg-uganda-red' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-uganda-black">
                          {transaction.item}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{transaction.type}: {transaction.quantity} units</span>
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {transaction.facility}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{transaction.date}</p>
                    <p>{transaction.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expiring Items */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-uganda-black">
              Items Expiring Soon
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {expiringItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-uganda-black">{item.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{item.quantity} units</span>
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {item.facility}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      item.daysLeft <= 30 ? 'text-uganda-red' : 
                      item.daysLeft <= 60 ? 'text-uganda-yellow' : 'text-green-500'
                    }`}>
                      {item.daysLeft} days left
                    </p>
                    <p className="text-xs text-gray-500">{item.expiryDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}