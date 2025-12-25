const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// Push notification subscription routes
router.post('/push/subscribe', authenticate, tenantResolver, NotificationController.subscribePush);
router.post('/push/unsubscribe', authenticate, tenantResolver, NotificationController.unsubscribePush);
router.get('/push/public-key', authenticate, NotificationController.getPublicKey);

// Test notification routes (for development)
router.post('/test/low-stock', authenticate, tenantResolver, NotificationController.testLowStockAlert);
router.post('/test/order-update', authenticate, tenantResolver, NotificationController.testOrderUpdate);
router.post('/test/daily-digest', authenticate, tenantResolver, NotificationController.testDailyDigest);

module.exports = router;

