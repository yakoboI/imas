const express = require('express');
const router = express.Router();
const ShopifyController = require('../../controllers/integrations/shopifyController');
const ShopifyWebhookController = require('../../controllers/integrations/shopifyWebhookController');
const { authenticate, authorize } = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

// Connect/Configure Shopify (Admin only)
router.post(
  '/connect',
  authenticate,
  tenantResolver,
  authorize('admin'),
  ShopifyController.connectShopify
);

// Webhook endpoint (no authentication - Shopify calls this)
router.post(
  '/webhook/:tenantId',
  express.json(), // Shopify sends JSON
  ShopifyWebhookController.handleWebhook
);

module.exports = router;

