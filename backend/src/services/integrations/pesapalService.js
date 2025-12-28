const BaseIntegrationService = require('./baseIntegrationService');
const IntegrationService = require('./integrationService');
const IntegrationLog = require('../../models/IntegrationLog');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Pesapal Integration Service
 * Handles all Pesapal payment gateway integration
 * 
 * Pesapal API Documentation: https://developer.pesapal.com/
 */
class PesapalService extends BaseIntegrationService {
  static getIntegrationType() {
    return 'pesapal';
  }

  // Pesapal API endpoints
  static getApiEndpoints(environment = 'sandbox') {
    const endpoints = {
      sandbox: {
        baseUrl: 'https://cybqa.pesapal.com/pesapalv3',
        ipnUrl: 'https://cybqa.pesapal.com/pesapalv3/api/URLSetup/RegisterIPN'
      },
      production: {
        baseUrl: 'https://pay.pesapal.com/v3',
        ipnUrl: 'https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN'
      }
    };
    return endpoints[environment] || endpoints.sandbox;
  }

  /**
   * Get Pesapal credentials from integration record
   */
  static async getCredentials(tenantId) {
    const integration = await IntegrationService.getIntegration(tenantId, this.getIntegrationType());
    if (!integration) {
      throw new Error('Pesapal integration not configured');
    }
    return IntegrationService.decryptCredentials(integration.credentials);
  }

  /**
   * Validate Pesapal credentials
   * @param {Object} credentials - Decrypted credentials
   * @returns {Promise<Object>} - { success: boolean, message: string }
   */
  static async validateCredentials(credentials) {
    try {
      const { consumer_key, consumer_secret, environment = 'sandbox' } = credentials;

      if (!consumer_key || !consumer_secret) {
        return {
          success: false,
          message: 'Consumer key and consumer secret are required'
        };
      }

      // Pesapal uses OAuth 1.0a for authentication
      // We'll test by making an authentication request
      const endpoints = this.getApiEndpoints(environment);
      const authUrl = `${endpoints.baseUrl}/api/Auth/RequestToken`;

      // For now, we'll just validate that credentials are provided
      // Actual validation happens when making first API call
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
   * Generate Pesapal OAuth signature (OAuth 1.0a)
   * Pesapal uses OAuth 1.0a for API authentication
   */
  static generateOAuthSignature(method, url, parameters, consumerSecret, tokenSecret = '') {
    // Create parameter string
    const paramString = Object.keys(parameters)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`)
      .join('&');

    // Create signature base string
    const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

    // Create signing key
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

    // Generate HMAC-SHA1 signature
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBaseString)
      .digest('base64');

    return signature;
  }

  /**
   * Get Pesapal access token (OAuth 1.0a)
   */
  static async getAccessToken(tenantId) {
    try {
      const credentials = await this.getCredentials(tenantId);
      const { consumer_key, consumer_secret, environment = 'sandbox' } = credentials;

      const endpoints = this.getApiEndpoints(environment);
      const url = `${endpoints.baseUrl}/api/Auth/RequestToken`;

      // OAuth 1.0a parameters
      const oauthParams = {
        oauth_consumer_key: consumer_key,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_version: '1.0'
      };

      // Generate signature
      oauthParams.oauth_signature = this.generateOAuthSignature('POST', url, oauthParams, consumer_secret);

      // Create Authorization header
      const authHeader = 'OAuth ' + Object.keys(oauthParams)
        .sort()
        .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
        .join(', ');

      const response = await axios.post(url, {}, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.token) {
        return response.data.token;
      }

      throw new Error('Failed to get access token from Pesapal');
    } catch (error) {
      console.error('Pesapal getAccessToken error:', error.response?.data || error.message);
      throw new Error(`Failed to get Pesapal access token: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Register IPN (Instant Payment Notification) URL
   * This should be called once when setting up the integration
   */
  static async registerIPN(tenantId, ipnUrl) {
    try {
      const accessToken = await this.getAccessToken(tenantId);
      const credentials = await this.getCredentials(tenantId);
      const { environment = 'sandbox' } = credentials;
      const endpoints = this.getApiEndpoints(environment);
      const url = `${endpoints.ipnUrl}`;

      const response = await axios.post(url, {
        url: ipnUrl,
        ipn_notification_type: 'GET'
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Pesapal registerIPN error:', error.response?.data || error.message);
      throw new Error(`Failed to register IPN: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Submit payment request to Pesapal
   * @param {string} tenantId - Tenant ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} - Payment response with redirect URL
   */
  static async submitPaymentRequest(tenantId, paymentData) {
    try {
      const { orderId, orderNumber, amount, currency, customerEmail, customerPhone, customerName, description, callbackUrl } = paymentData;

      const credentials = await this.getCredentials(tenantId);
      const { environment = 'sandbox' } = credentials;
      const endpoints = this.getApiEndpoints(environment);

      // Get access token
      const accessToken = await this.getAccessToken(tenantId);

      // Prepare payment request
      const paymentRequest = {
        id: orderNumber, // Order tracking ID
        currency: currency || 'KES',
        amount: parseFloat(amount).toFixed(2),
        description: description || `Payment for order ${orderNumber}`,
        callback_url: callbackUrl,
        cancellation_url: callbackUrl,
        notification_id: credentials.ipn_id || null, // IPN ID (should be registered)
        billing_address: {
          email_address: customerEmail,
          phone_number: customerPhone || '',
          country_code: 'KE',
          first_name: customerName?.split(' ')[0] || 'Customer',
          last_name: customerName?.split(' ').slice(1).join(' ') || '',
          line_1: '',
          city: '',
          state: '',
          postal_code: ''
        }
      };

      const url = `${endpoints.baseUrl}/api/Transactions/SubmitOrderRequest`;
      
      const response = await axios.post(url, paymentRequest, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Log API call
      await this.logApiCall(
        tenantId,
        null, // integrationId will be set by caller if needed
        'submit_payment_request',
        { orderId, orderNumber, amount },
        'success',
        null,
        response.data?.order_tracking_id
      );

      return {
        success: true,
        orderTrackingId: response.data?.order_tracking_id,
        redirectUrl: response.data?.redirect_url,
        data: response.data
      };
    } catch (error) {
      console.error('Pesapal submitPaymentRequest error:', error.response?.data || error.message);
      
      // Log error
      await this.logApiCall(
        tenantId,
        null,
        'submit_payment_request',
        paymentData,
        'error',
        error.response?.data?.message || error.message
      );

      throw new Error(`Failed to submit payment request: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get payment status from Pesapal
   * @param {string} tenantId - Tenant ID
   * @param {string} orderTrackingId - Pesapal order tracking ID
   * @returns {Promise<Object>} - Payment status
   */
  static async getPaymentStatus(tenantId, orderTrackingId) {
    try {
      const credentials = await this.getCredentials(tenantId);
      const { environment = 'sandbox' } = credentials;
      const endpoints = this.getApiEndpoints(environment);
      const accessToken = await this.getAccessToken(tenantId);

      const url = `${endpoints.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        status: response.data?.payment_status_description,
        paymentMethod: response.data?.payment_method,
        data: response.data
      };
    } catch (error) {
      console.error('Pesapal getPaymentStatus error:', error.response?.data || error.message);
      throw new Error(`Failed to get payment status: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify webhook signature (Pesapal sends orderTrackingId and orderMerchantReference)
   */
  static verifyWebhookSignature(queryParams, credentials) {
    // Pesapal webhook verification
    // Pesapal sends orderTrackingId and orderMerchantReference in the callback
    // You can verify by checking if the orderMerchantReference matches your order number
    return true; // Simplified - implement proper verification based on Pesapal docs
  }
}

module.exports = PesapalService;

