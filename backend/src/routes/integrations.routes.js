const express = require('express');
const router = express.Router();
const IntegrationController = require('../controllers/integrations/integrationController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// Import specific integration routes
const pesapalRoutes = require('./integrations/pesapal.routes');
const flutterwaveRoutes = require('./integrations/flutterwave.routes');
const dpoRoutes = require('./integrations/dpo.routes');
const shopifyRoutes = require('./integrations/shopify.routes');
const quickbooksRoutes = require('./integrations/quickbooks.routes');
const xeroRoutes = require('./integrations/xero.routes');
const whatsappRoutes = require('./integrations/whatsapp.routes');

// All routes require authentication and admin role
router.use(authenticate);
router.use(tenantResolver);

// Get all available integrations (with metadata)
router.get(
  '/available',
  IntegrationController.getAvailableIntegrations
);

// Get all integrations for tenant
router.get(
  '/',
  authorize('admin'),
  IntegrationController.getIntegrations
);

// Get specific integration
router.get(
  '/:type',
  authorize('admin'),
  IntegrationController.getIntegration
);

// Get integration status
router.get(
  '/:type/status',
  IntegrationController.getIntegrationStatus
);

// Connect/Configure integration (generic - specific integrations may override)
router.post(
  '/:type/connect',
  authorize('admin'),
  IntegrationController.connectIntegration
);

// Disconnect integration
router.delete(
  '/:type',
  authorize('admin'),
  IntegrationController.disconnectIntegration
);

// Get integration logs
router.get(
  '/:type/logs',
  authorize('admin'),
  IntegrationController.getIntegrationLogs
);

// Get all integration logs (type = 'all')
router.get(
  '/logs/all',
  authorize('admin'),
  IntegrationController.getIntegrationLogs
);

// Specific integration routes
router.use('/pesapal', pesapalRoutes);
router.use('/flutterwave', flutterwaveRoutes);
router.use('/dpo', dpoRoutes);
router.use('/shopify', shopifyRoutes);
router.use('/quickbooks', quickbooksRoutes);
router.use('/xero', xeroRoutes);
router.use('/whatsapp', whatsappRoutes);

module.exports = router;

