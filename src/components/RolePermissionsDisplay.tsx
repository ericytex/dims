import React from 'react';
import { Shield, Users, Building, Package, FileText, ArrowLeftRight, BarChart3, Database, Check, X } from 'lucide-react';

interface RolePermissionsDisplayProps {
  role: string;
  permissions: any;
}

export default function RolePermissionsDisplay({ role, permissions }: RolePermissionsDisplayProps) {
  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <Check className="w-4 h-4 text-green-600" />
    ) : (
      <X className="w-4 h-4 text-red-600" />
    );
  };

  const getPermissionText = (hasPermission: boolean) => {
    return hasPermission ? (
      <span className="text-green-700 font-medium">Allowed</span>
    ) : (
      <span className="text-red-700 font-medium">Not Allowed</span>
    );
  };

  const permissionSections = [
    {
      title: 'User Management',
      icon: Users,
      permissions: permissions?.users || {}
    },
    {
      title: 'Facility Management',
      icon: Building,
      permissions: permissions?.facilities || {}
    },
    {
      title: 'Inventory Management',
      icon: Package,
      permissions: permissions?.inventory || {}
    },
    {
      title: 'Transactions',
      icon: FileText,
      permissions: permissions?.transactions || {}
    },
    {
      title: 'Transfers',
      icon: ArrowLeftRight,
      permissions: permissions?.transfers || {}
    },
    {
      title: 'Reports',
      icon: BarChart3,
      permissions: permissions?.reports || {}
    },
    {
      title: 'System',
      icon: Database,
      permissions: permissions?.system || {}
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Shield className="w-6 h-6 text-uganda-yellow mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">
          {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Permissions
        </h3>
      </div>

      <div className="space-y-6">
        {permissionSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <Icon className="w-5 h-5 text-gray-600 mr-2" />
                <h4 className="text-md font-medium text-gray-900">{section.title}</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(section.permissions).map(([permission, hasPermission]) => (
                  <div key={permission} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getPermissionIcon(hasPermission as boolean)}
                      <span className="ml-2 text-sm text-gray-700">
                        {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="text-sm">
                      {getPermissionText(hasPermission as boolean)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Permission Summary</p>
            <p className="mt-1">
              This role has access to {Object.values(permissions).flatMap(Object.values).filter(Boolean).length} permissions 
              across {permissionSections.length} system areas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 