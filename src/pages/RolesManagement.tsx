import React, { useState } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { useNotification } from '../contexts/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Shield, 
  Users, 
  Building, 
  Package, 
  FileText, 
  ArrowLeftRight, 
  BarChart3, 
  Database,
  Check,
  X,
  Eye,
  Plus,
  Edit,
  Trash2,
  Download,
  Settings,
  Key,
  Lock,
  UserPlus,
  UserCheck,
  UserX
} from 'lucide-react';
import RolePermissionsDisplay from '../components/RolePermissionsDisplay';

interface Role {
  value: string;
  label: string;
  description: string;
  permissions: any;
  totalPermissions: number;
  allowedAreas: number;
  userCount: number;
}

export default function RolesManagement() {
  const { user: currentUser } = useFirebaseAuth();
  const { addNotification } = useNotification();
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'users'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Comprehensive role permissions mapping
  const rolePermissions = {
    admin: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports', 'database-test'],
      actions: ['create', 'read', 'update', 'delete', 'assign_roles', 'view_reports', 'manage_system'],
      permissions: {
        users: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          assign_roles: true,
          reset_passwords: true
        },
        facilities: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          manage_users: true
        },
        inventory: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          barcode_scan: true,
          bulk_operations: true,
          export_data: true
        },
        transactions: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          approve: true,
          void: true
        },
        transfers: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          approve: true,
          reject: true,
          track: true
        },
        reports: {
          view: true,
          generate: true,
          export: true,
          schedule: true
        },
        system: {
          database_test: true,
          backup: true,
          restore: true,
          settings: true
        }
      }
    },
    regional_supervisor: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports'],
      actions: ['create', 'read', 'update', 'delete', 'view_reports'],
      permissions: {
        users: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          assign_roles: true,
          reset_passwords: true
        },
        facilities: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          manage_users: true
        },
        inventory: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          barcode_scan: true,
          bulk_operations: true,
          export_data: true
        },
        transactions: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: true,
          void: false
        },
        transfers: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: true,
          reject: true,
          track: true
        },
        reports: {
          view: true,
          generate: true,
          export: true,
          schedule: false
        },
        system: {
          database_test: false,
          backup: false,
          restore: false,
          settings: false
        }
      }
    },
    district_health_officer: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports'],
      actions: ['create', 'read', 'update', 'delete', 'view_reports'],
      permissions: {
        users: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          assign_roles: true,
          reset_passwords: true
        },
        facilities: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          manage_users: true
        },
        inventory: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          barcode_scan: true,
          bulk_operations: true,
          export_data: true
        },
        transactions: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: true,
          void: false
        },
        transfers: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: true,
          reject: true,
          track: true
        },
        reports: {
          view: true,
          generate: true,
          export: true,
          schedule: false
        },
        system: {
          database_test: false,
          backup: false,
          restore: false,
          settings: false
        }
      }
    },
    facility_manager: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports'],
      actions: ['create', 'read', 'update', 'delete', 'view_reports'],
      permissions: {
        users: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          assign_roles: false,
          reset_passwords: true
        },
        facilities: {
          view: true,
          create: false,
          edit: true,
          delete: false,
          manage_users: true
        },
        inventory: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          barcode_scan: true,
          bulk_operations: true,
          export_data: true
        },
        transactions: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: true,
          void: false
        },
        transfers: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: false,
          reject: false,
          track: true
        },
        reports: {
          view: true,
          generate: true,
          export: true,
          schedule: false
        },
        system: {
          database_test: false,
          backup: false,
          restore: false,
          settings: false
        }
      }
    },
    village_health_worker: {
      pages: ['dashboard', 'inventory', 'transactions'],
      actions: ['read', 'update'],
      permissions: {
        users: {
          view: false,
          create: false,
          edit: false,
          delete: false,
          assign_roles: false,
          reset_passwords: false
        },
        facilities: {
          view: false,
          create: false,
          edit: false,
          delete: false,
          manage_users: false
        },
        inventory: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          barcode_scan: true,
          bulk_operations: false,
          export_data: false
        },
        transactions: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: false,
          void: false
        },
        transfers: {
          view: false,
          create: false,
          edit: false,
          delete: false,
          approve: false,
          reject: false,
          track: false
        },
        reports: {
          view: false,
          generate: false,
          export: false,
          schedule: false
        },
        system: {
          database_test: false,
          backup: false,
          restore: false,
          settings: false
        }
      }
    }
  };

  const roles: Role[] = [
    {
      value: 'admin',
      label: 'System Administrator',
      description: 'Full system access - can manage users, facilities, inventory, reports, and all data',
      permissions: rolePermissions.admin.permissions,
      totalPermissions: Object.values(rolePermissions.admin.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.admin.permissions).length,
      userCount: 3
    },
    {
      value: 'regional_supervisor',
      label: 'Regional Supervisor',
      description: 'Can manage users, facilities, inventory, and view reports for their region',
      permissions: rolePermissions.regional_supervisor.permissions,
      totalPermissions: Object.values(rolePermissions.regional_supervisor.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.regional_supervisor.permissions).length,
      userCount: 5
    },
    {
      value: 'district_health_officer',
      label: 'District Health Officer',
      description: 'Can manage users, facilities, inventory, and view reports for their district',
      permissions: rolePermissions.district_health_officer.permissions,
      totalPermissions: Object.values(rolePermissions.district_health_officer.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.district_health_officer.permissions).length,
      userCount: 8
    },
    {
      value: 'facility_manager',
      label: 'Facility Manager',
      description: 'Can manage users, facilities, inventory, and view reports for their facility',
      permissions: rolePermissions.facility_manager.permissions,
      totalPermissions: Object.values(rolePermissions.facility_manager.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.facility_manager.permissions).length,
      userCount: 12
    },
    {
      value: 'village_health_worker',
      label: 'Village Health Worker',
      description: 'Can view and update inventory, record transactions',
      permissions: rolePermissions.village_health_worker.permissions,
      totalPermissions: Object.values(rolePermissions.village_health_worker.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.village_health_worker.permissions).length,
      userCount: 25
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'regional_supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'district_health_officer':
        return 'bg-green-100 text-green-800';
      case 'facility_manager':
        return 'bg-purple-100 text-purple-800';
      case 'village_health_worker':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedRoleConfig = roles.find(role => role.value === selectedRole);

  const handleCreateRole = () => {
    setShowCreateModal(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role.value);
    setShowEditModal(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (role.userCount > 0) {
      addNotification({
        type: 'error',
        title: 'Cannot Delete Role',
        message: `Cannot delete role "${role.label}" because ${role.userCount} users are assigned to it.`
      });
      return;
    }
    
    addNotification({
      type: 'success',
      title: 'Role Deleted',
      message: `Role "${role.label}" has been deleted successfully.`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Manage system roles and permissions
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {currentUser?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'No Role'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'overview'
                ? 'bg-uganda-yellow text-uganda-black'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'detailed'
                ? 'bg-uganda-yellow text-uganda-black'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Detailed View
          </button>
          <button
            onClick={() => setViewMode('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'users'
                ? 'bg-uganda-yellow text-uganda-black'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users by Role
          </button>
        </div>
        
        <button
          onClick={handleCreateRole}
          className="px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Role
        </button>
      </div>

      {viewMode === 'overview' ? (
        /* Overview Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.value} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-uganda-yellow" />
                    <span>{role.label}</span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(role.value)}`}>
                    {role.value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Permissions:</span>
                    <span className="text-sm font-bold text-uganda-yellow">{role.totalPermissions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">System Areas:</span>
                    <span className="text-sm font-bold text-blue-600">{role.allowedAreas}/7</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Users Assigned:</span>
                    <span className="text-sm font-bold text-green-600">{role.userCount}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Access Areas:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      {role.permissions.users.view ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                      <span>Users</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {role.permissions.facilities.view ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                      <span>Facilities</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {role.permissions.inventory.view ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                      <span>Inventory</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {role.permissions.transactions.view ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                      <span>Transactions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {role.permissions.transfers.view ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                      <span>Transfers</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {role.permissions.reports.view ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                      <span>Reports</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedRole(role.value);
                      setViewMode('detailed');
                    }}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleEditRole(role)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Edit Role"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === 'detailed' ? (
        /* Detailed Mode */
        <div className="space-y-6">
          {/* Role Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Select Role to View Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedRole === role.value
                        ? 'border-uganda-yellow bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{role.label}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(role.value)}`}>
                        {role.value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{role.description}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      {role.totalPermissions} permissions • {role.allowedAreas}/7 areas • {role.userCount} users
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Permissions Display */}
          {selectedRoleConfig && (
            <RolePermissionsDisplay 
              role={selectedRoleConfig.value} 
              permissions={selectedRoleConfig.permissions} 
            />
          )}
        </div>
      ) : (
        /* Users by Role Mode */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Users by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.value} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-uganda-yellow" />
                        <div>
                          <h3 className="font-medium text-gray-900">{role.label}</h3>
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </div>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(role.value)}`}>
                        {role.userCount} users
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Permissions:</span>
                        <span className="font-medium">{role.totalPermissions}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">System Areas:</span>
                        <span className="font-medium">{role.allowedAreas}/7</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 