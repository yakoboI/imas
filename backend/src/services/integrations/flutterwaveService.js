const BaseIntegrationService = require('./baseIntegrationService');
const IntegrationService = require('./integrationService');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Flutterwave Integration Service
 * Handles all Flutterwave payment gateway integration
 * 
 * Flutterwave API Documentation: https://developer.flutterwave.com/
 */
class FlutterwaveService extends BaseIntegrationService {
  static getIntegrationType() {
    return 'flutterwave';
  }

  // Flutterwave API endpoints
  static getApiEndpoints() {
    return {
      baseUrl: process.env.FLUTTERWAVE_API_URL || 'https://api.flutterwave.com/v3',
      publicKey: 'FLWPUBK-...', // Set from credentials
      secretKey: 'FLWSECK-...' // Set from credentials
    };
  }

  /**
   * Get Flutterwave credentials from integration record
   */
  static async getCredentials(tenantId) {
    const integration = await IntegrationService.getIntegration(tenantId, this.getIntegrationType());
    if (!integration) {
      throw new Error('Flutterwave integration not configured');
    }
    return IntegrationService.decryptCredentials(integration.credentials);
  }

  /**
   * Validate Flutterwave credentials
   */
  static async validateCredentials(credentials) {
    try {
      const { publicKey, secretKey } = credentials;

      if (!publicKey || !secretKey) {
        return {
          success: false,
          message: 'Public key and secret key are required'
        };
      }

      // Test credentials by making a simple API call
      try {
        const response = await axios.get('https://api.flutterwave.com/v3/banks/NG', {
          headers: {
            'Authorization': `Bearer ${secretKey}`
          }
        });
        
        if (response.status === 200) {
          return {
            success: true,
            message: 'Credentials validated successfully'
          };
        }
      } catch (apiError) {
        return {
          success: false,
          message: `Credential validation failed: ${apiError.response?.data?.message || apiError.message}`
        };
      }

      return {
        success: true,
        message: 'Credentials validated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Credential validation failed: ${error.message}`
      };
    }
  }

  /**
   * Initialize payment transaction
   * @param {string} tenantId - Tenant ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} - Payment response with payment link
   */
  static async initializePayment(tenantId, paymentData) {
    try {
      const { orderId, orderNumber, amount, currency, customerEmail, customerPhone, customerName, description, callbackUrl } = paymentData;

      const credentials = await this.getCredentials(tenantId);
      const { secretKey, publicKey } = credentials;

      const baseUrl = process.env.FLUTTERWAVE_API_URL || 'https://api.flutterwave.com/v3';

      // Prepare payment request
      const paymentRequest = {
        tx_ref: orderNumber, // Unique transaction reference
        amount: parseFloat(amount),
        currency: currency || 'KES',
        redirect_url: callbackUrl,
        payment_options: 'card,mobilemoney,ussd,banktransfer',
        customer: {
          email: customerEmail,
          phonenumber: customerPhone || '',
          name: customerName || 'Customer'
        },
        customizations: {
          title: description || `Payment for order ${orderNumber}`,
          description: description || `Payment for order ${orderNumber}`,
          logo: '' // Optional: Add your logo URL
        }
      };

      const url = `${baseUrl}/payments`;
      
      const response = await axios.post(url, paymentRequest, {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Log API call
      await this.logApiCall(
        tenantId,
        null,
        'initialize_payment',
        { orderId, orderNumber, amount },
        'success',
        null,
        response.data?.data?.tx_ref
      );

      return {
        success: true,
        txRef: response.data?.data?.tx_ref,
        paymentLink: response.data?.data?.link,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Flutterwave initializePayment error:', error.response?.data || error.message);
      
      // Log error
      await this.logApiCall(
        tenantId,
        null,
        'initialize_payment',
        paymentData,
        'error',
        error.response?.data?.message || error.message
      );

      throw new Error(`Failed to initialize payment: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify payment transaction
   * @param {string} tenantId - Tenant ID
   * @param {string} transactionId - Flutterwave transaction ID
   * @returns {Promise<Object>} - Payment verification response
   */
  static async verifyPayment(tenantId, transactionId) {
    try {
      const credentials = await this.getCredentials(tenantId);
      const { secretKey } = credentials;
      const baseUrl = process.env.FLUTTERWAVE_API_URL || 'https://api.flutterwave.com/v3';

      const url = `${baseUrl}/transactions/${transactionId}/verify`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        status: response.data?.data?.status,
        amount: response.data?.data?.amount,
        currency: response.data?.data?.currency,
        txRef: response.data?.data?.tx_ref,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Flutterwave verifyPayment error:', error.response?.data || error.message);
      throw new Error(`Failed to verify payment: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload, signature, secretHash) {
    try {
      const hash = crypto
        .createHmac('sha256', secretHash)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      console.error('Flutterwave webhook signature verification error:', error);
      return false;
    }
  }
}

module.exports = FlutterwaveService;

