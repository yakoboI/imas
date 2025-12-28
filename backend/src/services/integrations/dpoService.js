const BaseIntegrationService = require('./baseIntegrationService');
const IntegrationService = require('./integrationService');
const axios = require('axios');
const crypto = require('crypto');

/**
 * DPO Pay Integration Service
 * Handles all DPO Pay payment gateway integration
 * 
 * DPO API Documentation: https://secure.3gdirectpay.com/
 */
class DpoService extends BaseIntegrationService {
  static getIntegrationType() {
    return 'dpo';
  }

  // DPO API endpoints
  static getApiEndpoints(environment = 'sandbox') {
    const endpoints = {
      sandbox: {
        createTokenUrl: 'https://secure.3gdirectpay.com/API/v6/createToken',
        verifyTokenUrl: 'https://secure.3gdirectpay.com/API/v6/verifyToken'
      },
      production: {
        createTokenUrl: 'https://secure.3gdirectpay.com/API/v6/createToken',
        verifyTokenUrl: 'https://secure.3gdirectpay.com/API/v6/verifyToken'
      }
    };
    return endpoints[environment] || endpoints.sandbox;
  }

  /**
   * Get DPO credentials from integration record
   */
  static async getCredentials(tenantId) {
    const integration = await IntegrationService.getIntegration(tenantId, this.getIntegrationType());
    if (!integration) {
      throw new Error('DPO Pay integration not configured');
    }
    return IntegrationService.decryptCredentials(integration.credentials);
  }

  /**
   * Validate DPO credentials
   */
  static async validateCredentials(credentials) {
    try {
      const { companyToken, serviceType } = credentials;

      if (!companyToken || !serviceType) {
        return {
          success: false,
          message: 'Company token and service type are required'
        };
      }

      // DPO validation is typically done via API call
      // For now, just validate that credentials are provided
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
   * Create payment token (Step 1)
   * @param {string} tenantId - Tenant ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} - Payment response with token and redirect URL
   */
  static async createPaymentToken(tenantId, paymentData) {
    try {
      const { orderId, orderNumber, amount, currency, customerEmail, customerPhone, customerName, description, callbackUrl } = paymentData;

      const credentials = await this.getCredentials(tenantId);
      const { companyToken, serviceType, environment = 'sandbox' } = credentials;

      const endpoints = this.getApiEndpoints(environment);

      // DPO requires XML request
      const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
        <API3G>
          <CompanyToken>${companyToken}</CompanyToken>
          <Request>createToken</Request>
          <Transaction>
            <PaymentAmount>${parseFloat(amount)}</PaymentAmount>
            <PaymentCurrency>${currency || 'KES'}</PaymentCurrency>
            <CompanyRef>${orderNumber}</CompanyRef>
            <RedirectURL>${callbackUrl}</RedirectURL>
            <BackURL>${callbackUrl}</BackURL>
            <CompanyRefUnique>0</CompanyRefUnique>
            <PTL>5</PTL>
          </Transaction>
          <Services>
            <Service>
              <ServiceType>${serviceType}</ServiceType>
              <ServiceDescription>${description || `Payment for order ${orderNumber}`}</ServiceDescription>
              <ServiceDate>${new Date().toISOString()}</ServiceDate>
            </Service>
          </Services>
        </API3G>`;

      const response = await axios.post(endpoints.createTokenUrl, xmlRequest, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });

      // Parse XML response
      const parser = require('xml2js').Parser();
      const result = await parser.parseStringPromise(response.data);

      if (result.API3G.Result && result.API3G.Result[0] === '000') {
        const transToken = result.API3G.TransToken[0];
        const transRef = result.API3G.TransRef[0];

        // DPO redirect URL
        const redirectUrl = `https://secure.3gdirectpay.com/payv2.php?ID=${transToken}`;

        // Log API call
        await this.logApiCall(
          tenantId,
          null,
          'create_payment_token',
          { orderId, orderNumber, amount },
          'success',
          null,
          transRef
        );

        return {
          success: true,
          transToken,
          transRef,
          redirectUrl
        };
      } else {
        const errorMessage = result.API3G.ResultExplanation ? result.API3G.ResultExplanation[0] : 'Unknown error';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('DPO createPaymentToken error:', error.response?.data || error.message);
      
      // Log error
      await this.logApiCall(
        tenantId,
        null,
        'create_payment_token',
        paymentData,
        'error',
        error.message
      );

      throw new Error(`Failed to create payment token: ${error.message}`);
    }
  }

  /**
   * Verify payment token (Step 2 - after payment)
   * @param {string} tenantId - Tenant ID
   * @param {string} transToken - DPO transaction token
   * @returns {Promise<Object>} - Payment verification response
   */
  static async verifyPaymentToken(tenantId, transToken) {
    try {
      const credentials = await this.getCredentials(tenantId);
      const { companyToken, environment = 'sandbox' } = credentials;
      const endpoints = this.getApiEndpoints(environment);

      // DPO requires XML request
      const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
        <API3G>
          <CompanyToken>${companyToken}</CompanyToken>
          <Request>verifyToken</Request>
          <TransactionToken>${transToken}</TransactionToken>
        </API3G>`;

      const response = await axios.post(endpoints.verifyTokenUrl, xmlRequest, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });

      // Parse XML response
      const { parseStringPromise } = require('xml2js');
      const result = await parseStringPromise(response.data);

      if (result.API3G.Result && result.API3G.Result[0] === '000') {
        return {
          success: true,
          status: result.API3G.Transaction[0].TransactionStatus[0],
          amount: result.API3G.Transaction[0].PaymentAmount[0],
          currency: result.API3G.Transaction[0].PaymentCurrency[0],
          transRef: result.API3G.Transaction[0].CompanyRef[0],
          data: result.API3G
        };
      } else {
        const errorMessage = result.API3G.ResultExplanation ? result.API3G.ResultExplanation[0] : 'Unknown error';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('DPO verifyPaymentToken error:', error.response?.data || error.message);
      throw new Error(`Failed to verify payment token: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = DpoService;

