import React, { useState } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Database, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface TestResults {
  firebase: string;
  roleUpdate: string;
}

export default function DatabaseTest() {
  const { user } = useFirebaseAuth();
  const [testResults, setTestResults] = useState<TestResults>({
    firebase: 'Not tested',
    roleUpdate: 'Not tested'
  });

  const testFirebaseConnection = async () => {
    try {
      setTestResults(prev => ({ ...prev, firebase: 'Testing...' }));
      
      // Test basic Firebase connection
      const { getFirestore, collection, getDocs } = await import('firebase/firestore');
      const { getAuth } = await import('firebase/auth');
      const { db } = await import('../services/firebase');
      
      const auth = getAuth();
      const firestore = getFirestore();
      
      // Test Firestore connection
      const testCollection = collection(firestore, 'test');
      await getDocs(testCollection);
      
      setTestResults(prev => ({ ...prev, firebase: '✅ Connected' }));
    } catch (error) {
      console.error('Firebase test error:', error);
      setTestResults(prev => ({ ...prev, firebase: '❌ Failed' }));
    }
  };

  // Quick role update function for admin
  const updateCurrentUserRole = async () => {
    try {
      setTestResults(prev => ({ ...prev, roleUpdate: 'Updating...' }));
      
      if (!user?.id) {
        setTestResults(prev => ({ ...prev, roleUpdate: '❌ No user ID found' }));
        return;
      }

      const { FirebaseDatabaseService } = await import('../services/firebaseDatabase');
      await FirebaseDatabaseService.updateUser(user.id, { role: 'admin' });
      
      setTestResults(prev => ({ ...prev, roleUpdate: '✅ Role updated to admin' }));
      
      // Refresh the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Role update error:', error);
      setTestResults(prev => ({ ...prev, roleUpdate: '❌ Failed to update role' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Database Test</h1>
        <div className="text-sm text-gray-600">
          Admin only - Database connection and role management
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Firebase Connection Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection Status:</span>
                <span className={`text-sm ${testResults.firebase.includes('✅') ? 'text-green-600' : testResults.firebase.includes('❌') ? 'text-red-600' : 'text-gray-600'}`}>
                  {testResults.firebase}
                </span>
              </div>
              <button
                onClick={testFirebaseConnection}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Test Connection
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="w-5 h-5 mr-2" />
              Role Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Emergency Role Update</p>
                    <p className="mt-1">Use this if you can't access User Management due to role restrictions.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Current User:</strong> {user?.name || 'N/A'}
                </div>
                <div className="text-sm">
                  <strong>Current Role:</strong> {user?.role || 'N/A'}
                </div>
                <div className="text-sm">
                  <strong>User ID:</strong> {user?.id || 'N/A'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Update Status:</span>
                <span className={`text-sm ${testResults.roleUpdate.includes('✅') ? 'text-green-600' : testResults.roleUpdate.includes('❌') ? 'text-red-600' : 'text-gray-600'}`}>
                  {testResults.roleUpdate}
                </span>
              </div>
              
              <button
                onClick={updateCurrentUserRole}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Update My Role to Admin
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 