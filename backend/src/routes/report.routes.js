const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// All report routes require authentication
router.use(authenticate);
router.use(tenantResolver);

// Report routes
router.get('/sales', authorize('admin', 'sales_manager', 'accountant'), ReportController.getSalesReport);
router.get('/inventory', authorize('admin', 'sales_manager', 'accountant'), ReportController.getInventoryReport);
router.get('/orders', authorize('admin', 'sales_manager', 'accountant'), ReportController.getOrdersReport);
router.get('/customers', authorize('admin', 'sales_manager', 'accountant'), ReportController.getCustomersReport);
router.get('/products', authorize('admin', 'sales_manager', 'accountant'), ReportController.getProductsReport);
router.get('/comprehensive', authorize('admin', 'sales_manager', 'accountant'), ReportController.getComprehensiveReport);

module.exports = router;

