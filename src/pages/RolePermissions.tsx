import React, { useState } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
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
  Lock
} from 'lucide-react';
import RolePermissionsDisplay from '../components/RolePermissionsDisplay';

interface RolePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  [key: string]: boolean;
}

interface RolePermissions {
  users: RolePermission;
  facilities: RolePermission;
  inventory: RolePermission;
  transactions: RolePermission;
  transfers: RolePermission;
  reports: RolePermission;
  system: RolePermission;
}

interface RoleConfig {
  value: string;
  label: string;
  description: string;
  permissions: RolePermissions;
  totalPermissions: number;
  allowedAreas: number;
}

export default function RolePermissions() {
  const { user: currentUser } = useFirebaseAuth();
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

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

  const roles: RoleConfig[] = [
    {
      value: 'admin',
      label: 'System Administrator',
      description: 'Full system access - can manage users, facilities, inventory, reports, and all data',
      permissions: rolePermissions.admin.permissions,
      totalPermissions: Object.values(rolePermissions.admin.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.admin.permissions).length
    },
    {
      value: 'regional_supervisor',
      label: 'Regional Supervisor',
      description: 'Can manage users, facilities, inventory, and view reports for their region',
      permissions: rolePermissions.regional_supervisor.permissions,
      totalPermissions: Object.values(rolePermissions.regional_supervisor.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.regional_supervisor.permissions).length
    },
    {
      value: 'district_health_officer',
      label: 'District Health Officer',
      description: 'Can manage users, facilities, inventory, and view reports for their district',
      permissions: rolePermissions.district_health_officer.permissions,
      totalPermissions: Object.values(rolePermissions.district_health_officer.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.district_health_officer.permissions).length
    },
    {
      value: 'facility_manager',
      label: 'Facility Manager',
      description: 'Can manage users, facilities, inventory, and view reports for their facility',
      permissions: rolePermissions.facility_manager.permissions,
      totalPermissions: Object.values(rolePermissions.facility_manager.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.facility_manager.permissions).length
    },
    {
      value: 'village_health_worker',
      label: 'Village Health Worker',
      description: 'Can view and update inventory, record transactions',
      permissions: rolePermissions.village_health_worker.permissions,
      totalPermissions: Object.values(rolePermissions.village_health_worker.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.village_health_worker.permissions).length
    }
  ];

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <Check className="w-4 h-4 text-green-600" />
    ) : (
      <X className="w-4 h-4 text-red-600" />
    );
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Role Permissions</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Managing role-based access control
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {currentUser?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'No Role'}
            </span>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
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
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Access Areas:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      {getPermissionIcon(role.permissions.users.view)}
                      <span>Users</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getPermissionIcon(role.permissions.facilities.view)}
                      <span>Facilities</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getPermissionIcon(role.permissions.inventory.view)}
                      <span>Inventory</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getPermissionIcon(role.permissions.transactions.view)}
                      <span>Transactions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getPermissionIcon(role.permissions.transfers.view)}
                      <span>Transfers</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getPermissionIcon(role.permissions.reports.view)}
                      <span>Reports</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedRole(role.value);
                    setViewMode('detailed');
                  }}
                  className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View Details
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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
                      {role.totalPermissions} permissions • {role.allowedAreas}/7 areas
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
      )}
    </div>
  );
} 