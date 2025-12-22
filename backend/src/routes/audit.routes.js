const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// All audit routes require authentication
router.use(authenticate);
router.use(tenantResolver);

// Audit log access
router.get('/logs', authorize('admin', 'sales_manager', 'inventory_manager', 'accountant'), AuditController.getAuditLogs);
router.get('/logs/:id', authorize('admin', 'sales_manager', 'inventory_manager', 'accountant'), AuditController.getAuditLogById);
router.get('/logs/entity/:type/:id', authorize('admin', 'sales_manager', 'inventory_manager'), AuditController.getEntityHistory);
router.get('/logs/user/:userId', authorize('admin'), AuditController.getUserActivity);
router.get('/logs/search', authorize('admin', 'sales_manager', 'inventory_manager'), AuditController.searchAuditLogs);
router.post('/logs/export', authorize('admin'), AuditController.exportAuditLogs);
router.get('/stats', authorize('admin'), AuditController.getAuditStats);

module.exports = router;

