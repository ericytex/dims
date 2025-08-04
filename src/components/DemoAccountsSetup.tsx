import React, { useState } from 'react';
import { FirebaseAuthService } from '../services/firebaseAuth';

export const DemoAccountsSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);

  const setupDemoAccounts = async () => {
    setLoading(true);
    setMessage('Setting up demo accounts...');
    
    try {
      await FirebaseAuthService.setupDemoAccounts();
      setMessage('✅ Demo accounts created successfully!');
      
      // Get the demo accounts for display
      const demoAccounts = FirebaseAuthService.getDemoAccounts();
      setAccounts(demoAccounts);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Demo Accounts Setup</h2>
      
      <button
        onClick={setupDemoAccounts}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 disabled:opacity-50"
      >
        {loading ? 'Creating Accounts...' : 'Create Demo Accounts'}
      </button>
      
      {message && (
        <div className={`p-3 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 
          message.includes('❌') ? 'bg-red-100 text-red-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
          {message}
        </div>
      )}
      
      {accounts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Demo Account Credentials:</h3>
          <div className="grid gap-3">
            {accounts.map((account, index) => (
              <div key={index} className="border rounded p-3 bg-gray-50">
                <div className="font-medium">{account.displayName}</div>
                <div className="text-sm text-gray-600">
                  <strong>Email:</strong> {account.email}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Password:</strong> {account.password}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Role:</strong> {account.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 