const express = require('express');
const router = express.Router();
const TenantSettingsController = require('../controllers/tenantSettingsController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// Get tenant settings (authenticated users)
router.get('/', authenticate, tenantResolver, TenantSettingsController.getSettings);

// Update tenant settings (Admin only)
router.put('/', authenticate, tenantResolver, authorize('admin'), TenantSettingsController.updateSettings);

module.exports = router;

