const BaseIntegrationService = require('./baseIntegrationService');
const IntegrationService = require('./integrationService');
const axios = require('axios');

/**
 * WhatsApp Business API Integration Service
 * Handles all WhatsApp Business API integration for sending notifications
 * 
 * WhatsApp Business API Documentation: https://developers.facebook.com/docs/whatsapp
 */
class WhatsAppService extends BaseIntegrationService {
  static getIntegrationType() {
    return 'whatsapp';
  }

  // WhatsApp API endpoints
  static getApiEndpoints() {
    return {
      baseUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      phoneNumberId: null // Set from credentials
    };
  }

  /**
   * Get WhatsApp credentials from integration record
   */
  static async getCredentials(tenantId) {
    const integration = await IntegrationService.getIntegration(tenantId, this.getIntegrationType());
    if (!integration) {
      throw new Error('WhatsApp integration not configured');
    }
    return IntegrationService.decryptCredentials(integration.credentials);
  }

  /**
   * Validate WhatsApp credentials
   */
  static async validateCredentials(credentials) {
    try {
      const { accessToken, phoneNumberId } = credentials;

      if (!accessToken || !phoneNumberId) {
        return {
          success: false,
          message: 'Access token and phone number ID are required'
        };
      }

      // Test credentials by making API call
      try {
        const response = await axios.get(
          `https://graph.facebook.com/v18.0/${phoneNumberId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            params: {
              fields: 'verified_name'
            }
          }
        );
        
        if (response.status === 200) {
          return {
            success: true,
            message: 'Credentials validated successfully',
            phoneNumberData: response.data
          };
        }
      } catch (apiError) {
        return {
          success: false,
          message: `Credential validation failed: ${apiError.response?.data?.error?.message || apiError.message}`
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
   * Send WhatsApp message
   */
  static async sendMessage(tenantId, toPhoneNumber, message) {
    try {
      const credentials = await this.getCredentials(tenantId);
      const { accessToken, phoneNumberId } = credentials;

      // Format phone number (remove + and ensure proper format)
      const formattedPhone = toPhoneNumber.replace(/\+/g, '').replace(/\s/g, '');

      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

      const messagePayload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(url, messagePayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Log API call
      await this.logApiCall(
        tenantId,
        null,
        'send_message',
        { to: formattedPhone, messageLength: message.length },
        'success',
        null,
        response.data?.messages?.[0]?.id
      );

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id,
        data: response.data
      };
    } catch (error) {
      console.error('WhatsApp sendMessage error:', error.response?.data || error.message);
      
      // Log error
      await this.logApiCall(
        tenantId,
        null,
        'send_message',
        { to: toPhoneNumber, messageLength: message.length },
        'error',
        error.response?.data?.error?.message || error.message
      );

      throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Send order notification via WhatsApp
   */
  static async sendOrderNotification(tenantId, order, customerPhone) {
    try {
      if (!customerPhone) {
        throw new Error('Customer phone number is required');
      }

      const orderMessage = `Your order ${order.order_number} has been ${order.status === 'completed' ? 'completed' : 'updated'}.\n\n` +
        `Total Amount: ${order.total_amount} ${order.currency || 'KES'}\n` +
        `Status: ${order.status}\n\n` +
        `Thank you for your business!`;

      return await this.sendMessage(tenantId, customerPhone, orderMessage);
    } catch (error) {
      console.error('WhatsApp sendOrderNotification error:', error);
      throw error;
    }
  }

  /**
   * Handle WhatsApp webhook (for receiving messages)
   */
  static async handleWebhook(payload) {
    // WhatsApp sends webhooks for incoming messages, status updates, etc.
    // This can be implemented based on requirements
    return payload;
  }
}

module.exports = WhatsAppService;

