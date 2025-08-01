import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'regional_supervisor' | 'district_health_officer' | 'facility_manager' | 'village_health_worker';
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
  'admin@dims.go.ug': {
    password: 'admin123',
    user: {
      id: '1',
      name: 'DIMS Administrator',
      email: 'admin@dims.go.ug',
      phone: '+256700000001',
      role: 'admin'
    }
  },
  'regional@dims.go.ug': {
    password: 'regional123',
    user: {
      id: '2',
      name: 'Regional Supervisor',
      email: 'regional@dims.go.ug',
      phone: '+256700000002',
      role: 'regional_supervisor',
      region: 'Central Region'
    }
  },
  'district@dims.go.ug': {
    password: 'district123',
    user: {
      id: '3',
      name: 'District Health Officer',
      email: 'district@dims.go.ug',
      phone: '+256700000003',
      role: 'district_health_officer',
      district: 'Kampala District'
    }
  },
  'facility@dims.go.ug': {
    password: 'facility123',
    user: {
      id: '4',
      name: 'Facility Manager',
      email: 'facility@dims.go.ug',
      phone: '+256700000004',
      role: 'facility_manager',
      facilityId: '1',
      facilityName: 'Mulago National Referral Hospital'
    }
  },
  'vhw@dims.go.ug': {
    password: 'vhw123',
    user: {
      id: '5',
      name: 'Village Health Worker',
      email: 'vhw@dims.go.ug',
      phone: '+256700000005',
      role: 'village_health_worker',
      facilityId: '2',
      facilityName: 'Kawempe Health Center IV'
    }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('dims_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('dims_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const mockUser = mockUsers[email];
    
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      setIsAuthenticated(true);
      localStorage.setItem('dims_user', JSON.stringify(mockUser.user));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('dims_user');
  };

  const hasRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
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