import React, { useState } from 'react';
import { FirebaseAuthService, DEMO_ACCOUNTS } from '../services/firebaseAuth';

export const DemoAccountsSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [creatingAccount, setCreatingAccount] = useState<string | null>(null);

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

  const createSingleAccount = async (account: any) => {
    setCreatingAccount(account.email);
    setMessage(`Creating account: ${account.email}...`);
    
    try {
      // Import the Firebase Auth functions directly
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../services/firebase');
      const { setDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
      
      // Update display name
      if (userCredential.user) {
        await userCredential.user.updateProfile({
          displayName: account.displayName
        });
      }
      
      // Create Firestore document
      await setDoc(doc(db, 'users', account.email), {
        email: account.email,
        displayName: account.displayName,
        role: account.role,
        phone: account.phone,
        facilityId: account.facilityId,
        facilityName: account.facilityName,
        region: account.region,
        district: account.district,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDemoAccount: true
      });
      
      setMessage(`✅ Account created successfully: ${account.email}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setMessage(`ℹ️ Account already exists: ${account.email}`);
      } else {
        setMessage(`❌ Error creating ${account.email}: ${error.message}`);
      }
    } finally {
      setCreatingAccount(null);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Demo Accounts Setup</h2>
      
      <div className="mb-6">
        <button
          onClick={setupDemoAccounts}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 disabled:opacity-50"
        >
          {loading ? 'Creating All Accounts...' : 'Create All Demo Accounts'}
        </button>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Create Individual Accounts:</h3>
        <div className="grid gap-2">
          {DEMO_ACCOUNTS.map((account, index) => (
            <button
              key={index}
              onClick={() => createSingleAccount(account)}
              disabled={creatingAccount === account.email}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 text-left"
            >
              {creatingAccount === account.email ? 'Creating...' : `Create ${account.displayName} (${account.email})`}
            </button>
          ))}
        </div>
      </div>
      
      {message && (
        <div className={`p-3 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 
          message.includes('❌') ? 'bg-red-100 text-red-800' : 
          message.includes('ℹ️') ? 'bg-blue-100 text-blue-800' :
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