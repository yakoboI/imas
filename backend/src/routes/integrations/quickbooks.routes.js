const express = require('express');
const router = express.Router();
const QuickBooksController = require('../../controllers/integrations/quickbooksController');
const { authenticate, authorize } = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

// Connect/Configure QuickBooks (Admin only)
router.post(
  '/connect',
  authenticate,
  tenantResolver,
  authorize('admin'),
  QuickBooksController.connectQuickBooks
);

// Sync receipt to QuickBooks (requires authentication)
router.post(
  '/sync/receipt/:receiptId',
  authenticate,
  tenantResolver,
  QuickBooksController.syncReceiptToQuickBooks
);

module.exports = router;

