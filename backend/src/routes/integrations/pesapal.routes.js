const express = require('express');
const router = express.Router();
const PesapalController = require('../../controllers/integrations/pesapalController');
const PesapalWebhookController = require('../../controllers/integrations/pesapalWebhookController');
const { authenticate, authorize } = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

// Connect/Configure Pesapal (Admin only)
router.post(
  '/connect',
  authenticate,
  tenantResolver,
  authorize('admin'),
  PesapalController.connectPesapal
);

// Initiate payment (requires authentication)
router.post(
  '/payment/initiate',
  authenticate,
  tenantResolver,
  PesapalController.initiatePayment
);

// Get payment status (requires authentication)
router.get(
  '/payment/status/:orderTrackingId',
  authenticate,
  tenantResolver,
  PesapalController.getPaymentStatus
);

// Webhook endpoint (no authentication - Pesapal calls this)
router.get(
  '/webhook/:tenantId',
  PesapalWebhookController.handleWebhook
);

module.exports = router;

