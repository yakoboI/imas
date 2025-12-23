const express = require('express');
const router = express.Router();
const SuperAdminController = require('../controllers/superAdminController');
const { authenticate, superAdminOnly } = require('../middleware/auth');

// SuperAdmin authentication
router.post('/login', SuperAdminController.login);
router.post('/logout', authenticate, superAdminOnly, SuperAdminController.logout);

// All routes below require SuperAdmin authentication
router.use(authenticate);
router.use(superAdminOnly);

// Tenant management
router.get('/tenants', SuperAdminController.getAllTenants);
router.post('/tenants', SuperAdminController.createTenant);
router.get('/tenants/:id', SuperAdminController.getTenantById);
router.put('/tenants/:id', SuperAdminController.updateTenant);
router.delete('/tenants/:id', SuperAdminController.deleteTenant);
router.put('/tenants/:id/suspend', SuperAdminController.suspendTenant);
router.put('/tenants/:id/activate', SuperAdminController.activateTenant);
router.get('/tenants/:id/stats', SuperAdminController.getTenantStats);

// User management (across all tenants)
router.get('/users', SuperAdminController.getAllUsers);
router.get('/users/:id', SuperAdminController.getUserById);
router.put('/users/:id/reset-password', SuperAdminController.resetUserPassword);
router.put('/users/:id/deactivate', SuperAdminController.deactivateUser);

// Global audit logs
router.get('/audit-logs', SuperAdminController.getGlobalAuditLogs);
router.get('/audit-logs/tenant/:id', SuperAdminController.getTenantAuditLogs);
router.get('/audit-logs/search', SuperAdminController.searchAuditLogs);
router.post('/audit-logs/export', SuperAdminController.exportAuditLogs);
router.get('/system-logs', SuperAdminController.getSystemLogs);
router.post('/system-logs/archive', SuperAdminController.archiveSystemLogs);

// Analytics
router.get('/analytics/overview', SuperAdminController.getAnalyticsOverview);
router.get('/analytics/revenue', SuperAdminController.getRevenueReports);
router.get('/analytics/usage', SuperAdminController.getUsageStatistics);
router.get('/analytics/tenants/growth', SuperAdminController.getTenantGrowth);

// System management
router.get('/system/health', SuperAdminController.getSystemHealth);
router.post('/system/backup', SuperAdminController.triggerBackup);
router.get('/system/settings', SuperAdminController.getSystemSettings);
router.put('/system/settings', SuperAdminController.updateSystemSettings);

module.exports = router;

