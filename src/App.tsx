import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseAuthProvider } from './hooks/useFirebaseAuth';
import { NotificationProvider } from './contexts/NotificationContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { AlertsProvider } from './contexts/AlertsContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import RolesManagement from './pages/RolesManagement';
import FacilityManagement from './pages/FacilityManagement';
import InventoryManagement from './pages/InventoryManagement';
import StockTransactions from './pages/StockTransactions';
import TransferManagement from './pages/TransferManagement';
import Reports from './pages/Reports';
import NotificationContainer from './components/NotificationContainer';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';

function AppContent() {
  const { user, loading } = useFirebaseAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uganda-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationContainer />
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } />
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager', 'village_health_worker']}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager']}>
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/roles-management" element={
          <ProtectedRoute allowedRoles={['admin', 'regional_supervisor', 'district_health_officer']}>
            <Layout>
              <RolesManagement />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/facilities" element={
          <ProtectedRoute allowedRoles={['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager']}>
            <Layout>
              <FacilityManagement />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/inventory" element={
          <ProtectedRoute allowedRoles={['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager', 'village_health_worker']}>
            <Layout>
              <InventoryManagement />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/transactions" element={
          <ProtectedRoute allowedRoles={['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager', 'village_health_worker']}>
            <Layout>
              <StockTransactions />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/transfers" element={
          <ProtectedRoute allowedRoles={['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager']}>
            <Layout>
              <TransferManagement />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['admin', 'regional_supervisor', 'district_health_officer', 'facility_manager']}>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <FirebaseAuthProvider>
        <NotificationProvider>
          <OfflineProvider>
            <AlertsProvider>
              <AppContent />
            </AlertsProvider>
          </OfflineProvider>
        </NotificationProvider>
      </FirebaseAuthProvider>
    </Router>
  );
}

export default App;