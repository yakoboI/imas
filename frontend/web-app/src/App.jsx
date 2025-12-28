import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box } from '@mui/material';

import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import InstallPrompt from './components/InstallPrompt';
import { registerServiceWorker } from './utils/pushNotifications';
import Profile from './pages/Profile/ViewProfile';
import EditProfile from './pages/Profile/EditProfile';
import ChangePassword from './pages/Profile/ChangePassword';
import NotificationSettings from './pages/Profile/NotificationSettings';
import PasskeyManagement from './pages/Profile/PasskeyManagement';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Sales from './pages/Sales';
import Receipts from './pages/Receipts';
import Warehouses from './pages/Warehouses';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Integrations from './pages/Integrations';
import Users from './pages/Users';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  // Register service worker on app load
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker().catch(console.error);
    }
  }, []);


  return (
    <>
      <InstallPrompt />
      <Routes>
      {/* Public Routes - Landing page is PUBLIC, no authentication required */}
      {/* IMPORTANT: This route must be first and must NOT have any authentication checks */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Profile Routes */}
        <Route path="profile" element={<Profile />} />
        <Route path="profile/edit" element={<EditProfile />} />
        <Route path="profile/password" element={<ChangePassword />} />
        <Route path="profile/notifications" element={<NotificationSettings />} />
        <Route path="profile/passkeys" element={<PasskeyManagement />} />
        
        {/* Main Features */}
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="sales" element={<Sales />} />
        <Route path="orders" element={<Orders />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="customers" element={<Customers />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="users" element={<Users />} />
      </Route>

      {/* Redirect authenticated users from root to app */}
      <Route path="/dashboard" element={<PrivateRoute><Navigate to="/app/dashboard" replace /></PrivateRoute>} />

      {/* 404 - redirect to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;

