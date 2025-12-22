const Tenant = require('../models/Tenant');
const AuditService = require('../services/auditService');

// Default tenant settings
const defaultTenantSettings = {
  lowStockThreshold: 10,
  currency: 'USD',
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  emailNotifications: true,
  lowStockAlerts: true,
  orderNotifications: true,
};

class TenantSettingsController {
  // Get tenant settings
  static async getSettings(req, res, next) {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const tenant = await Tenant.findByPk(tenantId);

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Merge tenant settings with defaults
      const settings = { ...defaultTenantSettings, ...(tenant.settings || {}) };

      res.json({ settings });
    } catch (error) {
      console.error('[TenantSettingsController] Error in getSettings:', error);
      next(error);
    }
  }

  // Update tenant settings (Admin only)
  static async updateSettings(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const updates = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const tenant = await Tenant.findByPk(tenantId);

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Validate lowStockThreshold if provided
      if (updates.lowStockThreshold !== undefined) {
        const threshold = parseInt(updates.lowStockThreshold);
        if (isNaN(threshold) || threshold < 0) {
          return res.status(400).json({ error: 'Low stock threshold must be a non-negative number' });
        }
        updates.lowStockThreshold = threshold;
      }

      // Merge with existing settings
      const currentSettings = tenant.settings || {};
      const newSettings = { ...defaultTenantSettings, ...currentSettings, ...updates };

      // Update tenant settings
      tenant.settings = newSettings;
      await tenant.save();

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'UPDATE_TENANT_SETTINGS',
        entity_type: 'Tenant',
        entity_id: tenantId,
        old_values: { settings: currentSettings },
        new_values: { settings: newSettings },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Tenant settings updated by ${req.user.email}`
      });

      res.json({
        message: 'Settings updated successfully',
        settings: newSettings
      });
    } catch (error) {
      console.error('[TenantSettingsController] Error in updateSettings:', error);
      next(error);
    }
  }
}

module.exports = TenantSettingsController;

