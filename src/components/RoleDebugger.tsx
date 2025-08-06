import React from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { Shield, Eye, User, AlertTriangle } from 'lucide-react';

export default function RoleDebugger() {
  const { user } = useFirebaseAuth();

  if (!user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-800 font-medium">No user logged in</span>
        </div>
      </div>
    );
  }

  const canAccessUsers = ['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager'].includes(user.role || '');

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center mb-3">
        <Shield className="w-5 h-5 text-blue-600 mr-2" />
        <span className="text-blue-800 font-medium">Role Debug Information</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="font-medium text-blue-800 mb-2">Current User:</h4>
          <div className="space-y-1">
            <p><strong>Name:</strong> {user.name || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            <p><strong>Role:</strong> {user.role || 'N/A'}</p>
            <p><strong>User ID:</strong> {user.id || 'N/A'}</p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-blue-800 mb-2">Access Status:</h4>
          <div className="space-y-1">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>Users Page Access: </span>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${canAccessUsers ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {canAccessUsers ? '✅ Allowed' : '❌ Denied'}
              </span>
            </div>
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              <span>Role Assignment: </span>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${['admin', 'regional_supervisor', 'district_health_officer'].includes(user.role || '') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {['admin', 'regional_supervisor', 'district_health_officer'].includes(user.role || '') ? '✅ Allowed' : '❌ Denied'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
        <strong>Note:</strong> If you can't see the Users page, your role might not be set correctly in the database. 
        Contact an administrator to update your role to 'admin', 'regional_supervisor', 'district_health_officer', or 'facility_manager'.
      </div>
    </div>
  );
} 