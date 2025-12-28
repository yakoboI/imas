const BaseIntegrationService = require('./baseIntegrationService');
const IntegrationService = require('./integrationService');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Shopify Integration Service
 * Handles all Shopify e-commerce integration
 * 
 * Shopify API Documentation: https://shopify.dev/api
 */
class ShopifyService extends BaseIntegrationService {
  static getIntegrationType() {
    return 'shopify';
  }

  /**
   * Get Shopify credentials from integration record
   */
  static async getCredentials(tenantId) {
    const integration = await IntegrationService.getIntegration(tenantId, this.getIntegrationType());
    if (!integration) {
      throw new Error('Shopify integration not configured');
    }
    return IntegrationService.decryptCredentials(integration.credentials);
  }

  /**
   * Validate Shopify credentials
   */
  static async validateCredentials(credentials) {
    try {
      const { shopName, accessToken } = credentials;

      if (!shopName || !accessToken) {
        return {
          success: false,
          message: 'Shop name and access token are required'
        };
      }

      // Test credentials by making API call
      try {
        const response = await axios.get(`https://${shopName}.myshopify.com/admin/api/2024-01/shop.json`, {
          headers: {
            'X-Shopify-Access-Token': accessToken
          }
        });
        
        if (response.status === 200) {
          return {
            success: true,
            message: 'Credentials validated successfully',
            shopData: response.data.shop
          };
        }
      } catch (apiError) {
        return {
          success: false,
          message: `Credential validation failed: ${apiError.response?.data?.errors || apiError.message}`
        };
      }

      return {
        success: false,
        message: 'Failed to validate credentials'
      };
    } catch (error) {
      return {
        success: false,
        message: `Credential validation failed: ${error.message}`
      };
    }
  }

  /**
   * Verify webhook HMAC signature
   */
  static verifyWebhookSignature(body, signature, secret) {
    try {
      const hmac = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');
      
      return hmac === signature;
    } catch (error) {
      console.error('Shopify webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Get order from Shopify
   */
  static async getOrder(tenantId, shopifyOrderId) {
    try {
      const credentials = await this.getCredentials(tenantId);
      const { shopName, accessToken } = credentials;

      const url = `https://${shopName}.myshopify.com/admin/api/2024-01/orders/${shopifyOrderId}.json`;

      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken
        }
      });

      return response.data.order;
    } catch (error) {
      console.error('Shopify getOrder error:', error.response?.data || error.message);
      throw new Error(`Failed to get order: ${error.response?.data?.errors || error.message}`);
    }
  }

  /**
   * Create webhook subscription
   */
  static async createWebhook(tenantId, topic, callbackUrl) {
    try {
      const credentials = await this.getCredentials(tenantId);
      const { shopName, accessToken } = credentials;

      const url = `https://${shopName}.myshopify.com/admin/api/2024-01/webhooks.json`;

      const response = await axios.post(url, {
        webhook: {
          topic,
          address: callbackUrl,
          format: 'json'
        }
      }, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      return response.data.webhook;
    } catch (error) {
      console.error('Shopify createWebhook error:', error.response?.data || error.message);
      throw new Error(`Failed to create webhook: ${error.response?.data?.errors || error.message}`);
    }
  }

  /**
   * List webhooks
   */
  static async listWebhooks(tenantId) {
    try {
      const credentials = await this.getCredentials(tenantId);
      const { shopName, accessToken } = credentials;

      const url = `https://${shopName}.myshopify.com/admin/api/2024-01/webhooks.json`;

      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken
        }
      });

      return response.data.webhooks;
    } catch (error) {
      console.error('Shopify listWebhooks error:', error.response?.data || error.message);
      throw new Error(`Failed to list webhooks: ${error.response?.data?.errors || error.message}`);
    }
  }
}

module.exports = ShopifyService;

