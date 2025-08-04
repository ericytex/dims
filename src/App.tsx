import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { OfflineProvider } from './contexts/OfflineContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import FacilityManagement from './pages/FacilityManagement';
import InventoryManagement from './pages/InventoryManagement';
import StockTransactions from './pages/StockTransactions';
import TransferManagement from './pages/TransferManagement';
import Reports from './pages/Reports';
import DatabaseTestPage from './pages/DatabaseTestPage';
import { FirebaseTest } from './components/FirebaseTest';
import { DemoAccountsSetup } from './components/DemoAccountsSetup';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationContainer from './components/NotificationContainer';
import OfflineStatus from './components/OfflineStatus';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationContainer />
      <OfflineStatus />
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
        } />
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/facilities" element={
          <ProtectedRoute allowedRoles={['admin', 'regional_manager']}>
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
          <ProtectedRoute>
            <Layout>
              <TransferManagement />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
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
      <AuthProvider>
        <NotificationProvider>
          <OfflineProvider>
          <AppContent />
          </OfflineProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;