const express = require('express');
const router = express.Router();
const FlutterwaveController = require('../../controllers/integrations/flutterwaveController');
const FlutterwaveWebhookController = require('../../controllers/integrations/flutterwaveWebhookController');
const { authenticate, authorize } = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

// Connect/Configure Flutterwave (Admin only)
router.post(
  '/connect',
  authenticate,
  tenantResolver,
  authorize('admin'),
  FlutterwaveController.connectFlutterwave
);

// Initiate payment (requires authentication)
router.post(
  '/payment/initiate',
  authenticate,
  tenantResolver,
  FlutterwaveController.initiatePayment
);

// Verify payment (requires authentication)
router.get(
  '/payment/verify/:transactionId',
  authenticate,
  tenantResolver,
  FlutterwaveController.verifyPayment
);

// Webhook endpoint (no authentication - Flutterwave calls this)
router.post(
  '/webhook/:tenantId',
  express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }),
  FlutterwaveWebhookController.handleWebhook
);

module.exports = router;

