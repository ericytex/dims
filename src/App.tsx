import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseAuthProvider, useFirebaseAuth } from './hooks/useFirebaseAuth';
import { NotificationProvider } from './contexts/NotificationContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { AlertsProvider } from './contexts/AlertsContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import RolesManagement from './pages/RolesManagement';
import FacilityManagement from './pages/FacilityManagement';
import InventoryManagement from './pages/InventoryManagement';
import StockTransactions from './pages/StockTransactions';
import TransferManagement from './pages/TransferManagement';
import Reports from './pages/Reports';
import DatabaseTestPage from './pages/DatabaseTestPage';
import { FirebaseTest } from './components/FirebaseTest';
import { DemoAccountsSetup } from './components/DemoAccountsSetup';
import { FirebaseConfigTest } from './components/FirebaseConfigTest';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationContainer from './components/NotificationContainer';
import OfflineStatus from './components/OfflineStatus';

function AppContent() {
  const { user } = useFirebaseAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationContainer />
      <OfflineStatus />
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" /> : <LoginPage />
        } />
        <Route path="/" element={
          user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
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
          <ProtectedRoute>
            <Layout>
              <InventoryManagement />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute>
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
        <Route path="/database-test" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <DatabaseTestPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/firebase-test" element={
          <FirebaseTest />
        } />
        <Route path="/firebase-config-test" element={
          <FirebaseConfigTest />
        } />
        <Route path="/demo-setup" element={
          <DemoAccountsSetup />
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