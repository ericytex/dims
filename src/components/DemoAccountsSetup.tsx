import React, { useState } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { DEMO_ACCOUNTS } from '../services/firebaseAuth';

export const DemoAccountsSetup: React.FC = () => {
  const { setupDemoAccounts, loading, error } = useFirebaseAuth();
  const [setupComplete, setSetupComplete] = useState(false);

  const handleSetupDemoAccounts = async () => {
    try {
      await setupDemoAccounts();
      setSetupComplete(true);
    } catch (error) {
      console.error('Setup failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Demo Accounts Setup</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Firebase Demo Accounts</h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            These demo accounts will be created in Firebase Firestore. You can use these credentials to test different user roles.
          </p>
          
          <button
            onClick={handleSetupDemoAccounts}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Setup Demo Accounts'}
          </button>
        </div>

        {setupComplete && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            ✅ Demo accounts have been set up in Firebase!
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            ❌ Error: {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Demo Account Credentials</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DEMO_ACCOUNTS.map((account, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">{account.displayName}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  account.role === 'admin' ? 'bg-red-100 text-red-800' :
                  account.role === 'regional_manager' ? 'bg-blue-100 text-blue-800' :
                  account.role === 'district_manager' ? 'bg-green-100 text-green-800' :
                  account.role === 'facility_manager' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {account.role.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                    {account.email}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium">Password:</span>
                  <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                    {account.password}
                  </span>
                </div>
                
                {account.phone && (
                  <div>
                    <span className="font-medium">Phone:</span>
                    <span className="ml-2">{account.phone}</span>
                  </div>
                )}
                
                {account.region && (
                  <div>
                    <span className="font-medium">Region:</span>
                    <span className="ml-2">{account.region}</span>
                  </div>
                )}
                
                {account.district && (
                  <div>
                    <span className="font-medium">District:</span>
                    <span className="ml-2">{account.district}</span>
                  </div>
                )}
                
                {account.facilityName && (
                  <div>
                    <span className="font-medium">Facility:</span>
                    <span className="ml-2">{account.facilityName}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3">How to Use Demo Accounts</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Click "Setup Demo Accounts" to create the accounts in Firebase</li>
          <li>Go to the login page and use any of the credentials above</li>
          <li>Each account has different permissions based on their role</li>
          <li>Test different features with different user roles</li>
        </ol>
      </div>
    </div>
  );
}; 