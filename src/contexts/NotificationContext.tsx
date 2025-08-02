import React, { createContext, useContext, useState } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'> | string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'> | string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    
    let newNotification: Notification;
    
    if (typeof notification === 'string') {
      // Handle string-based notification calls
      newNotification = {
        id,
        type,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        message: notification,
        duration: 5000
      };
    } else {
      // Handle object-based notification calls
      newNotification = { ...notification, id };
    }
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove after duration (default 5 seconds)
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration || 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}