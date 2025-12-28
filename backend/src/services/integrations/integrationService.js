const Integration = require('../../models/Integration');
const Tenant = require('../../models/Tenant');
const { encrypt, decrypt } = require('../../utils/encryption');

/**
 * Integration Management Service
 * Unified service for managing all integrations
 */
class IntegrationService {
  // Supported integration types
  static INTEGRATION_TYPES = {
    PESAPAL: 'pesapal',
    FLUTTERWAVE: 'flutterwave',
    DPO: 'dpo',
    SHOPIFY: 'shopify',
    QUICKBOOKS: 'quickbooks',
    XERO: 'xero',
    WHATSAPP: 'whatsapp'
  };

  // Integration metadata
  static INTEGRATION_METADATA = {
    pesapal: {
      name: 'Pesapal',
      category: 'payment',
      description: 'Accept mobile money and card payments',
      requiresOAuth: false
    },
    flutterwave: {
      name: 'Flutterwave',
      category: 'payment',
      description: 'Accept payments via cards, mobile money, and bank transfers',
      requiresOAuth: false
    },
    dpo: {
      name: 'DPO Pay',
      category: 'payment',
      description: 'Accept payments via various methods',
      requiresOAuth: false
    },
    shopify: {
      name: 'Shopify',
      category: 'ecommerce',
      description: 'Sync orders from your Shopify store',
      requiresOAuth: true
    },
    quickbooks: {
      name: 'QuickBooks Online',
      category: 'accounting',
      description: 'Sync invoices to QuickBooks Online',
      requiresOAuth: true
    },
    xero: {
      name: 'Xero',
      category: 'accounting',
      description: 'Sync invoices to Xero accounting',
      requiresOAuth: true
    },
    whatsapp: {
      name: 'WhatsApp Business',
      category: 'social',
      description: 'Send order notifications via WhatsApp',
      requiresOAuth: false
    }
  };

  /**
   * Get all available integrations with metadata
   */
  static getAvailableIntegrations() {
    return Object.entries(this.INTEGRATION_METADATA).map(([type, metadata]) => ({
      type,
      ...metadata
    }));
  }

  /**
   * Get integration for tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} integrationType - Integration type
   * @returns {Promise<Object|null>} - Integration record or null
   */
  static async getIntegration(tenantId, integrationType) {
    return await Integration.findOne({
      where: {
        tenant_id: tenantId,
        integration_type: integrationType
      }
    });
  }

  /**
   * Get all integrations for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Array>} - Array of integration records
   */
  static async getAllIntegrations(tenantId) {
    return await Integration.findAll({
      where: {
        tenant_id: tenantId
      },
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Check if integration is active
   * @param {string} tenantId - Tenant ID
   * @param {string} integrationType - Integration type
   * @returns {Promise<boolean>} - True if active
   */
  static async isIntegrationActive(tenantId, integrationType) {
    const integration = await this.getIntegration(tenantId, integrationType);
    return integration && integration.status === 'active' && integration.verified === true;
  }

  /**
   * Get active integrations for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Array>} - Array of active integration records
   */
  static async getActiveIntegrations(tenantId) {
    return await Integration.findAll({
      where: {
        tenant_id: tenantId,
        status: 'active',
        verified: true
      }
    });
  }

  /**
   * Save or update integration
   * @param {string} tenantId - Tenant ID
   * @param {string} integrationType - Integration type
   * @param {Object} credentials - Credentials to encrypt and store
   * @param {Object} configuration - Non-sensitive configuration
   * @param {boolean} verified - Whether credentials are verified
   * @returns {Promise<Object>} - Integration record
   */
  static async saveIntegration(tenantId, integrationType, credentials = {}, configuration = {}, verified = false) {
    // Encrypt sensitive credentials
    const encryptedCredentials = this.encryptCredentials(credentials);

    // Check if integration exists
    const existing = await this.getIntegration(tenantId, integrationType);

    if (existing) {
      // Update existing
      await existing.update({
        credentials: encryptedCredentials,
        configuration,
        verified,
        verified_at: verified ? new Date() : null,
        status: verified ? 'active' : existing.status,
        last_error: null
      });
      return existing.reload();
    } else {
      // Create new
      return await Integration.create({
        tenant_id: tenantId,
        integration_type: integrationType,
        credentials: encryptedCredentials,
        configuration,
        verified,
        verified_at: verified ? new Date() : null,
        status: verified ? 'active' : 'pending_verification'
      });
    }
  }

  /**
   * Encrypt credentials (helper method)
   * Note: This is a static method to match BaseIntegrationService pattern
   * For actual encryption, we use the encryption utility
   */
  static encryptCredentials(credentials) {
    const { encrypt } = require('../../utils/encryption');
    if (!credentials || typeof credentials !== 'object') {
      return {};
    }

    const encrypted = {};
    const sensitiveFields = [
      'consumer_secret',
      'access_token',
      'refresh_token',
      'api_key',
      'api_secret',
      'private_key',
      'password',
      'secret',
      'token'
    ];

    for (const [key, value] of Object.entries(credentials)) {
      if (value && sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        encrypted[key] = encrypt(String(value));
      } else {
        encrypted[key] = value;
      }
    }

    return encrypted;

    return encrypted;
  }

  /**
   * Decrypt credentials (helper method)
   */
  static decryptCredentials(credentials) {
    const { decrypt } = require('../../utils/encryption');
    if (!credentials || typeof credentials !== 'object') {
      return {};
    }

    const decrypted = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (value && typeof value === 'string' && value.includes(':')) {
        try {
          decrypted[key] = decrypt(value);
        } catch (error) {
          decrypted[key] = value;
        }
      } else {
        decrypted[key] = value;
      }
    }

    return decrypted;
  }

  /**
   * Update integration status
   * @param {string} tenantId - Tenant ID
   * @param {string} integrationType - Integration type
   * @param {string} status - New status
   * @param {string} errorMessage - Error message if status is 'error'
   */
  static async updateIntegrationStatus(tenantId, integrationType, status, errorMessage = null) {
    const integration = await this.getIntegration(tenantId, integrationType);
    if (!integration) {
      throw new Error('Integration not found');
    }

    await integration.update({
      status,
      last_error: errorMessage,
      last_sync_at: status === 'active' ? new Date() : integration.last_sync_at
    });

    return integration.reload();
  }

  /**
   * Delete/disconnect integration
   * @param {string} tenantId - Tenant ID
   * @param {string} integrationType - Integration type
   */
  static async deleteIntegration(tenantId, integrationType) {
    const integration = await this.getIntegration(tenantId, integrationType);
    if (integration) {
      await integration.destroy();
    }
  }

  /**
   * Get integration with decrypted credentials (for internal use only)
   * @param {string} tenantId - Tenant ID
   * @param {string} integrationType - Integration type
   * @returns {Promise<Object|null>} - Integration with decrypted credentials
   */
  static async getIntegrationWithCredentials(tenantId, integrationType) {
    const integration = await this.getIntegration(tenantId, integrationType);
    if (!integration) {
      return null;
    }

    const decrypted = this.decryptCredentials(integration.credentials);
    return {
      ...integration.toJSON(),
      credentials: decrypted
    };
  }
}

module.exports = IntegrationService;

