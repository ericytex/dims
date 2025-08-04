import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'regional_manager' | 'district_manager' | 'facility_manager' | 'inventory_worker';
  facilityId?: string;
  facilityName?: string;
  region?: string;
  district?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@ims.com': {
    password: 'admin123',
    user: {
      id: '1',
      name: 'System Administrator',
      email: 'admin@ims.com',
      phone: '+256700000001',
      role: 'admin'
    }
  },
  'regional@ims.com': {
    password: 'regional123',
    user: {
      id: '2',
      name: 'Regional Manager',
      email: 'regional@ims.com',
      phone: '+256700000002',
      role: 'regional_manager',
      region: 'Central Region'
    }
  },
  'district@ims.com': {
    password: 'district123',
    user: {
      id: '3',
      name: 'District Manager',
      email: 'district@ims.com',
      phone: '+256700000003',
      role: 'district_manager',
      district: 'Kampala District'
    }
  },
  'facility@ims.com': {
    password: 'facility123',
    user: {
      id: '4',
      name: 'Facility Manager',
      email: 'facility@ims.com',
      phone: '+256700000004',
      role: 'facility_manager',
      facilityId: '1',
      facilityName: 'Main Warehouse'
    }
  },
  'worker@ims.com': {
    password: 'worker123',
    user: {
      id: '5',
      name: 'Inventory Worker',
      email: 'worker@ims.com',
      phone: '+256700000005',
      role: 'inventory_worker',
      facilityId: '2',
      facilityName: 'Distribution Center'
    }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('ims_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('ims_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NODE_ENV === 'production' 
        ? 'https://ims-server-zzxxyy-ericytexs-projects.vercel.app' 
        : 'http://localhost:3001'}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      const userData = {
        id: data.user.id.toString(),
        name: data.user.name,
        email: data.user.email,
        phone: '+256700000000', // Default phone
        role: data.user.role,
        token: data.token
      };
      
      localStorage.setItem('ims_user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      await fetch(`${process.env.NODE_ENV === 'production' 
        ? 'https://ims-server-zzxxyy-ericytexs-projects.vercel.app' 
        : 'http://localhost:3001'}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('ims_user');
    localStorage.removeItem('auth-token');
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
