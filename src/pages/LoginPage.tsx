import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Eye, EyeOff, Lock, Mail, ChevronDown, ChevronUp } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const demoUsers = [
    { email: 'admin@ims.com', role: 'System Administrator', password: 'admin123' },
    { email: 'regional@ims.com', role: 'Regional Manager', password: 'regional123' },
    { email: 'district@ims.com', role: 'District Manager', password: 'district123' },
    { email: 'facility@ims.com', role: 'Facility Manager', password: 'facility123' },
    { email: 'worker@ims.com', role: 'Inventory Worker', password: 'worker123' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      addNotification('Please enter both email and password', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        addNotification('Login successful', 'success');
        navigate('/dashboard');
      } else {
        addNotification('Invalid email or password', 'error');
      }
    } catch (error) {
      addNotification('Login failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoUser: typeof demoUsers[0]) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
  };

  const toggleDemoAccounts = () => {
    setShowDemoAccounts(!showDemoAccounts);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 flex items-center justify-center">
            <img 
              src="https://static.wixstatic.com/media/1e6d1c_510e06d9798e43dba04f363ff29d730f~mv2.jpg/v1/fill/w_98,h_104,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Coat_of_arms_of_Uganda.jpg"
              alt="Uganda Coat of Arms"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Inventory Management System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Republic of Uganda
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          Sign in to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-uganda-yellow focus:border-uganda-yellow sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-uganda-yellow focus:border-uganda-yellow sm:text-sm"
                  placeholder="Enter your password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-uganda-black bg-uganda-yellow hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uganda-yellow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={toggleDemoAccounts}
              className="w-full flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span>Demo Accounts</span>
              {showDemoAccounts ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showDemoAccounts && (
              <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                {demoUsers.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => handleDemoLogin(user)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uganda-yellow transition-colors"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{user.role}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                    <span className="text-xs text-gray-400">Click to fill</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}