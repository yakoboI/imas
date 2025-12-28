const express = require('express');
const router = express.Router();
const XeroController = require('../../controllers/integrations/xeroController');
const { authenticate, authorize } = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

// Connect/Configure Xero (Admin only)
router.post(
  '/connect',
  authenticate,
  tenantResolver,
  authorize('admin'),
  XeroController.connectXero
);

// Sync receipt to Xero (requires authentication)
router.post(
  '/sync/receipt/:receiptId',
  authenticate,
  tenantResolver,
  XeroController.syncReceiptToXero
);

module.exports = router;

