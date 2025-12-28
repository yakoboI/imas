const express = require('express');
const router = express.Router();
const WhatsAppController = require('../../controllers/integrations/whatsappController');
const { authenticate, authorize } = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

// Connect/Configure WhatsApp (Admin only)
router.post(
  '/connect',
  authenticate,
  tenantResolver,
  authorize('admin'),
  WhatsAppController.connectWhatsApp
);

// Send message (requires authentication)
router.post(
  '/send',
  authenticate,
  tenantResolver,
  WhatsAppController.sendMessage
);

module.exports = router;

