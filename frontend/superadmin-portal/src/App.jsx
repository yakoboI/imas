import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box } from '@mui/material';

import Layout from './components/layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import InstallPrompt from './components/InstallPrompt';
import Tenants from './pages/Tenants/TenantList';
import TenantDetails from './pages/Tenants/TenantDetails';
import TenantCreate from './pages/Tenants/TenantCreate';
import TenantEdit from './pages/Tenants/TenantEdit';
import Users from './pages/Users/UserList';
import GlobalAudit from './pages/Audit/GlobalAuditLog';
import SystemLogs from './pages/Audit/SystemLogs';
import Analytics from './pages/Analytics/Analytics';
import SystemSettings from './pages/System/SystemSettings';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  // Register service worker on app load
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <>
      <InstallPrompt />
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="tenants/create" element={<TenantCreate />} />
        <Route path="tenants/:id/edit" element={<TenantEdit />} />
        <Route path="tenants/:id" element={<TenantDetails />} />
        <Route path="users" element={<Users />} />
        <Route path="audit-logs" element={<GlobalAudit />} />
        <Route path="system-logs" element={<SystemLogs />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  );
}

export default App;

