const express = require('express');
const router = express.Router();
const DpoController = require('../../controllers/integrations/dpoController');
const { authenticate, authorize } = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

// Connect/Configure DPO Pay (Admin only)
router.post(
  '/connect',
  authenticate,
  tenantResolver,
  authorize('admin'),
  DpoController.connectDpo
);

// Initiate payment (requires authentication)
router.post(
  '/payment/initiate',
  authenticate,
  tenantResolver,
  DpoController.initiatePayment
);

// Verify payment (no auth - called from callback)
router.get(
  '/payment/verify',
  tenantResolver,
  DpoController.verifyPayment
);

module.exports = router;

