const { encrypt, decrypt } = require('../../utils/encryption');
const IntegrationLog = require('../../models/IntegrationLog');

/**
 * Base Integration Service
 * All integration services should extend this class
 * Provides common functionality for all integrations
 */
class BaseIntegrationService {
  /**
   * Get the integration type name (should be overridden by subclasses)
   */
  static getIntegrationType() {
    throw new Error('getIntegrationType() must be implemented by subclass');
  }

  /**
   * Decrypt credentials from integration record
   * @param {Object} integration - Integration model instance
   * @returns {Object} - Decrypted credentials object
   */
  static decryptCredentials(integration) {
    if (!integration || !integration.credentials) {
      throw new Error('Integration credentials not found');
    }

    const decrypted = {};
    const credentials = integration.credentials || {};

    // Decrypt each credential field
    for (const [key, value] of Object.entries(credentials)) {
      if (value && typeof value === 'string' && value.includes(':')) {
        // Check if it's encrypted (format: iv:encryptedData)
        try {
          decrypted[key] = decrypt(value);
        } catch (error) {
          // If decryption fails, might not be encrypted - use as-is
          decrypted[key] = value;
        }
      } else {
        decrypted[key] = value;
      }
    }

    return decrypted;
  }

  /**
   * Encrypt credentials for storage
   * @param {Object} credentials - Plain credentials object
   * @returns {Object} - Encrypted credentials object
   */
  static encryptCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return {};
    }

    const encrypted = {};
    
    // List of fields that should be encrypted (sensitive data)
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
        // Encrypt sensitive fields
        encrypted[key] = encrypt(String(value));
      } else {
        // Store non-sensitive fields as-is
        encrypted[key] = value;
      }
    }

    return encrypted;
  }

  /**
   * Log integration activity
   * @param {Object} options - Log options
   */
  static async logActivity({
    tenantId,
    integrationType,
    integrationId,
    eventType,
    direction,
    payload,
    status = 'success',
    errorMessage = null,
    externalId = null,
    relatedEntityType = null,
    relatedEntityId = null
  }) {
    try {
      await IntegrationLog.create({
        tenant_id: tenantId,
        integration_type: integrationType || this.getIntegrationType(),
        integration_id: integrationId,
        event_type: eventType,
        direction,
        payload: payload || {},
        status,
        error_message: errorMessage,
        external_id: externalId,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId
      });
    } catch (error) {
      // Don't fail if logging fails, but log the error
      console.error('Failed to log integration activity:', error);
    }
  }

  /**
   * Log API call (outbound)
   */
  static async logApiCall(tenantId, integrationId, eventType, payload, status = 'success', errorMessage = null, externalId = null) {
    return this.logActivity({
      tenantId,
      integrationId,
      eventType: eventType || 'api_call',
      direction: 'outbound',
      payload,
      status,
      errorMessage,
      externalId
    });
  }

  /**
   * Log webhook (inbound)
   */
  static async logWebhook(tenantId, integrationId, eventType, payload, status = 'success', errorMessage = null, externalId = null, relatedEntityType = null, relatedEntityId = null) {
    return this.logActivity({
      tenantId,
      integrationId,
      eventType: eventType || 'webhook_received',
      direction: 'inbound',
      payload,
      status,
      errorMessage,
      externalId,
      relatedEntityType,
      relatedEntityId
    });
  }

  /**
   * Validate credentials (should be overridden by subclasses)
   * @param {Object} credentials - Decrypted credentials
   * @returns {Promise<Object>} - { success: boolean, message: string }
   */
  static async validateCredentials(credentials) {
    throw new Error('validateCredentials() must be implemented by subclass');
  }

  /**
   * Handle errors and log them
   */
  static handleError(error, context = {}) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const errorData = error.response?.data || {};
    
    console.error(`[${this.getIntegrationType()}] Error:`, {
      message: errorMessage,
      context,
      errorData
    });

    return {
      success: false,
      message: errorMessage,
      error: errorData
    };
  }
}

module.exports = BaseIntegrationService;

