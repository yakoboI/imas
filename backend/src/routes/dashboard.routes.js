const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// Dashboard routes require authentication
router.use(authenticate);
router.use(tenantResolver);

// Get dashboard statistics
router.get('/stats', DashboardController.getDashboardStats);

// Get chart data for analytics
router.get('/chart-data', DashboardController.getChartData);

module.exports = router;

