import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        addNotification({
          type: 'success',
          title: 'Login Successful',
          message: 'Welcome to DIMS!'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Login Failed',
          message: 'Invalid email or password. Please try again.'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Login Error',
        message: 'An error occurred during login. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@nms.go.ug', role: 'Administrator', password: 'admin123' },
    { email: 'regional@nms.go.ug', role: 'Regional Supervisor', password: 'regional123' },
    { email: 'district@nms.go.ug', role: 'District Health Officer', password: 'district123' },
    { email: 'facility@nms.go.ug', role: 'Facility Manager', password: 'facility123' },
    { email: 'vhw@nms.go.ug', role: 'Village Health Worker', password: 'vhw123' }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-uganda-black" />
            </div>
            <h2 className="text-3xl font-bold text-uganda-black">
              Welcome to DIMS
            </h2>
            <p className="mt-2 text-gray-600">
              Decentralized Inventory Management System
            </p>
            <p className="text-sm text-gray-500">
              National Medical Stores - Uganda
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-uganda-yellow focus:border-uganda-yellow"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-uganda-black bg-uganda-yellow hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uganda-yellow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {/* Right side - Demo Accounts */}
      <div className="hidden lg:flex lg:flex-1 bg-gray-50 items-center justify-center px-8">
        <div className="max-w-md w-full">
          <h3 className="text-xl font-semibold text-uganda-black mb-6">
            Demo Accounts
          </h3>
          <div className="space-y-4">
            {demoAccounts.map((account, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-uganda-yellow transition-colors"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-uganda-black">{account.role}</p>
                    <p className="text-sm text-gray-600">{account.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Password:</p>
                    <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {account.password}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Click on any account to auto-fill the login form
          </p>
        </div>
      </div>
    </div>
  );
}