import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { FirebaseDatabaseService } from '../services/firebaseDatabase';
import { useNotification } from './NotificationContext';

export interface Alert {
  id: string;
  type: 'low_stock' | 'expiry' | 'reorder';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  itemId?: string;
  itemName?: string;
  facilityId?: string;
  facilityName?: string;
  currentStock?: number;
  threshold?: number;
  expiryDate?: string;
  daysUntilExpiry?: number;
  createdAt: Date;
  isRead: boolean;
  isDismissed: boolean;
}

interface AlertsContextType {
  alerts: Alert[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  dismissAllAlerts: () => void;
  refreshAlerts: () => void;
  checkForAlerts: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
};

interface AlertsProviderProps {
  children: ReactNode;
}

export const AlertsProvider: React.FC<AlertsProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useFirebaseAuth();
  const { addNotification } = useNotification();

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  // Check for low stock alerts
  const checkLowStockAlerts = async (inventoryItems: any[]) => {
    const lowStockAlerts: Alert[] = [];
    
    inventoryItems.forEach(item => {
      const currentStock = item.currentStock || 0;
      const reorderPoint = item.reorderPoint || 10;
      const criticalThreshold = Math.max(reorderPoint * 0.5, 5);
      
      if (currentStock <= criticalThreshold) {
        lowStockAlerts.push({
          id: `low_stock_${item.id}_${Date.now()}`,
          type: 'low_stock',
          title: 'Critical Low Stock Alert',
          message: `${item.name} is critically low on stock (${currentStock} units remaining)`,
          severity: 'critical',
          itemId: item.id,
          itemName: item.name,
          facilityId: item.facilityId,
          facilityName: item.facilityName,
          currentStock: currentStock,
          threshold: criticalThreshold,
          createdAt: new Date(),
          isRead: false,
          isDismissed: false
        });
      } else if (currentStock <= reorderPoint) {
        lowStockAlerts.push({
          id: `low_stock_${item.id}_${Date.now()}`,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${item.name} is running low on stock (${currentStock} units remaining)`,
          severity: 'medium',
          itemId: item.id,
          itemName: item.name,
          facilityId: item.facilityId,
          facilityName: item.facilityName,
          currentStock: currentStock,
          threshold: reorderPoint,
          createdAt: new Date(),
          isRead: false,
          isDismissed: false
        });
      }
    });
    
    return lowStockAlerts;
  };

  // Check for expiry alerts
  const checkExpiryAlerts = async (inventoryItems: any[]) => {
    const expiryAlerts: Alert[] = [];
    const now = new Date();
    
    inventoryItems.forEach(item => {
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 0) {
          expiryAlerts.push({
            id: `expiry_${item.id}_${Date.now()}`,
            type: 'expiry',
            title: 'Item Expired',
            message: `${item.name} has expired on ${item.expiryDate}`,
            severity: 'critical',
            itemId: item.id,
            itemName: item.name,
            facilityId: item.facilityId,
            facilityName: item.facilityName,
            expiryDate: item.expiryDate,
            daysUntilExpiry: daysUntilExpiry,
            createdAt: new Date(),
            isRead: false,
            isDismissed: false
          });
        } else if (daysUntilExpiry <= 7) {
          expiryAlerts.push({
            id: `expiry_${item.id}_${Date.now()}`,
            type: 'expiry',
            title: 'Item Expiring Soon',
            message: `${item.name} will expire in ${daysUntilExpiry} days`,
            severity: 'high',
            itemId: item.id,
            itemName: item.name,
            facilityId: item.facilityId,
            facilityName: item.facilityName,
            expiryDate: item.expiryDate,
            daysUntilExpiry: daysUntilExpiry,
            createdAt: new Date(),
            isRead: false,
            isDismissed: false
          });
        } else if (daysUntilExpiry <= 30) {
          expiryAlerts.push({
            id: `expiry_${item.id}_${Date.now()}`,
            type: 'expiry',
            title: 'Item Expiring This Month',
            message: `${item.name} will expire in ${daysUntilExpiry} days`,
            severity: 'medium',
            itemId: item.id,
            itemName: item.name,
            facilityId: item.facilityId,
            facilityName: item.facilityName,
            expiryDate: item.expiryDate,
            daysUntilExpiry: daysUntilExpiry,
            createdAt: new Date(),
            isRead: false,
            isDismissed: false
          });
        }
      }
    });
    
    return expiryAlerts;
  };

  // Check for reorder point alerts
  const checkReorderAlerts = async (inventoryItems: any[]) => {
    const reorderAlerts: Alert[] = [];
    
    inventoryItems.forEach(item => {
      const currentStock = item.currentStock || 0;
      const reorderPoint = item.reorderPoint || 10;
      
      if (currentStock <= reorderPoint && currentStock > 0) {
        reorderAlerts.push({
          id: `reorder_${item.id}_${Date.now()}`,
          type: 'reorder',
          title: 'Reorder Point Reached',
          message: `${item.name} has reached reorder point (${currentStock} units remaining)`,
          severity: 'medium',
          itemId: item.id,
          itemName: item.name,
          facilityId: item.facilityId,
          facilityName: item.facilityName,
          currentStock: currentStock,
          threshold: reorderPoint,
          createdAt: new Date(),
          isRead: false,
          isDismissed: false
        });
      }
    });
    
    return reorderAlerts;
  };

  // Main function to check for all alerts
  const checkForAlerts = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Get all inventory items
      const inventoryItems = await FirebaseDatabaseService.getInventoryItems();
      
      // Check for different types of alerts
      const lowStockAlerts = await checkLowStockAlerts(inventoryItems);
      const expiryAlerts = await checkExpiryAlerts(inventoryItems);
      const reorderAlerts = await checkReorderAlerts(inventoryItems);
      
      // Combine all alerts
      const newAlerts = [...lowStockAlerts, ...expiryAlerts, ...reorderAlerts];
      
      // Filter out duplicates and already dismissed alerts
      const existingAlertIds = alerts.map(alert => alert.id);
      const filteredNewAlerts = newAlerts.filter(alert => 
        !existingAlertIds.includes(alert.id) && !alert.isDismissed
      );
      
      // Add new alerts to the list
      if (filteredNewAlerts.length > 0) {
        setAlerts(prev => [...filteredNewAlerts, ...prev]);
        
        // Show notification for critical alerts
        const criticalAlerts = filteredNewAlerts.filter(alert => alert.severity === 'critical');
        if (criticalAlerts.length > 0) {
          addNotification(`${criticalAlerts.length} critical alert(s) detected`, 'warning');
        }
      }
      
    } catch (error) {
      console.error('Error checking for alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark alert as read
  const markAsRead = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  };

  // Dismiss alert
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isDismissed: true } : alert
      )
    );
  };

  // Dismiss all alerts
  const dismissAllAlerts = () => {
    setAlerts(prev => 
      prev.map(alert => ({ ...alert, isDismissed: true }))
    );
  };

  // Refresh alerts
  const refreshAlerts = () => {
    checkForAlerts();
  };

  // Check for alerts on mount and periodically
  useEffect(() => {
    if (user) {
      checkForAlerts();
      
      // Check for alerts every 5 minutes
      const interval = setInterval(checkForAlerts, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const value: AlertsContextType = {
    alerts,
    unreadCount,
    isLoading,
    markAsRead,
    dismissAlert,
    dismissAllAlerts,
    refreshAlerts,
    checkForAlerts
  };

  return (
    <AlertsContext.Provider value={value}>
      {children}
    </AlertsContext.Provider>
  );
}; 