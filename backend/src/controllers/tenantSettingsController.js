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

      // Include company information
      const response = {
        settings,
        company: {
          name: tenant.company_name || '',
          email: tenant.company_email || '',
          phone: tenant.company_phone || '',
          address: tenant.company_address || '',
          logo: tenant.company_logo_url || '',
          taxId: tenant.tax_id || ''
        },
        tenant: {
          name: tenant.name || '',
          subdomain: tenant.subdomain || ''
        }
      };

      res.json(response);
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

      // Store old values for audit trail
      const oldSettings = tenant.settings || {};
      const oldCompany = {
        name: tenant.company_name,
        email: tenant.company_email,
        phone: tenant.company_phone,
        address: tenant.company_address,
        logo: tenant.company_logo_url,
        taxId: tenant.tax_id
      };

      // Separate company information from settings
      const companyUpdates = {};
      const settingsUpdates = {};
      
      // Company information fields (direct tenant columns)
      if (updates.companyName !== undefined) companyUpdates.company_name = updates.companyName;
      if (updates.companyEmail !== undefined) companyUpdates.company_email = updates.companyEmail;
      if (updates.companyPhone !== undefined) companyUpdates.company_phone = updates.companyPhone;
      if (updates.companyAddress !== undefined) companyUpdates.company_address = updates.companyAddress;
      if (updates.companyLogo !== undefined) companyUpdates.company_logo_url = updates.companyLogo;
      if (updates.taxId !== undefined) companyUpdates.tax_id = updates.taxId;

      // Settings fields (JSONB)
      const settingsFields = ['currency', 'timezone', 'dateFormat', 'lowStockThreshold', 'emailNotifications', 'lowStockAlerts', 'orderNotifications'];
      settingsFields.forEach(field => {
        if (updates[field] !== undefined) {
          settingsUpdates[field] = updates[field];
        }
      });

      // Update company information if provided
      if (Object.keys(companyUpdates).length > 0) {
        await tenant.update(companyUpdates);
      }

      // Update settings if provided
      let finalSettings = oldSettings;
      if (Object.keys(settingsUpdates).length > 0) {
        const currentSettings = tenant.settings || {};
        finalSettings = { ...defaultTenantSettings, ...currentSettings, ...settingsUpdates };
        tenant.settings = finalSettings;
        await tenant.save();
      }

      // Reload tenant to get updated values
      await tenant.reload();

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'UPDATE_TENANT_SETTINGS',
        entity_type: 'Tenant',
        entity_id: tenantId,
        old_values: { 
          settings: oldSettings,
          company: oldCompany
        },
        new_values: { 
          settings: tenant.settings || {},
          company: {
            name: tenant.company_name,
            email: tenant.company_email,
            phone: tenant.company_phone,
            address: tenant.company_address,
            logo: tenant.company_logo_url,
            taxId: tenant.tax_id
          }
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Tenant settings updated by ${req.user.email}`
      });

      res.json({
        message: 'Settings updated successfully',
        settings: { ...defaultTenantSettings, ...(tenant.settings || {}) },
        company: {
          name: tenant.company_name || '',
          email: tenant.company_email || '',
          phone: tenant.company_phone || '',
          address: tenant.company_address || '',
          logo: tenant.company_logo_url || '',
          taxId: tenant.tax_id || ''
        },
        tenant: {
          name: tenant.name || '',
          subdomain: tenant.subdomain || ''
        }
      });
    } catch (error) {
      console.error('[TenantSettingsController] Error in updateSettings:', error);
      next(error);
    }
  }
}

module.exports = TenantSettingsController;

