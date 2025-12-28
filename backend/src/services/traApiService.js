const axios = require('axios');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const { decrypt } = require('../utils/encryption');

/**
 * TRA EFDMS API Service
 * Handles all communication with Tanzania Revenue Authority EFDMS API
 */
class TraApiService {
  // Default TRA API endpoints (can be overridden per tenant)
  static DEFAULT_API_ENDPOINT = process.env.TRA_API_ENDPOINT || 'https://efdms.tra.go.tz/api'; // Replace with actual TRA endpoint
  static DEFAULT_REGISTRATION_ENDPOINT = '/registration';
  static DEFAULT_TOKEN_ENDPOINT = '/token';
  static DEFAULT_INVOICE_ENDPOINT = '/invoice';
  static DEFAULT_ZREPORT_ENDPOINT = '/zreport';

  /**
   * Get API endpoint for tenant (allows different endpoints for test/prod)
   */
  static getApiEndpoint(tenant) {
    return tenant.tra_api_endpoint || this.DEFAULT_API_ENDPOINT;
  }

  /**
   * Get decrypted certificate password
   */
  static getCertPassword(tenant) {
    if (!tenant.cert_password) {
      throw new Error('Certificate password not configured');
    }
    return decrypt(tenant.cert_password);
  }

  /**
   * Get PFX certificate as buffer from base64 string
   */
  static getCertBuffer(tenant) {
    if (!tenant.tra_cert_pfx_base64) {
      throw new Error('TRA certificate not configured');
    }
    return Buffer.from(tenant.tra_cert_pfx_base64, 'base64');
  }

  /**
   * Create HTTPS agent with client certificate for TRA API
   */
  static createHttpsAgent(tenant) {
    try {
      const certBuffer = this.getCertBuffer(tenant);
      const certPassword = this.getCertPassword(tenant);

      // Note: In a real implementation, you might need to write the PFX to a temporary file
      // or use a library that supports PFX directly. This is a simplified version.
      // For production, consider using 'node-forge' or similar library for PFX handling.

      // Create HTTPS agent with certificate
      const httpsAgent = new https.Agent({
        cert: certBuffer,
        key: certBuffer, // In reality, you'd extract the key from PFX
        passphrase: certPassword,
        rejectUnauthorized: true // Set to false only for development/testing
      });

      return httpsAgent;
    } catch (error) {
      console.error('Error creating HTTPS agent:', error);
      throw new Error('Failed to create HTTPS agent with certificate');
    }
  }

  /**
   * Generate authentication token from TRA API
   * @param {Object} tenant - Tenant object with TRA credentials
   * @returns {Promise<string>} - Authentication token
   */
  static async generateToken(tenant) {
    try {
      const apiEndpoint = this.getApiEndpoint(tenant);
      const httpsAgent = this.createHttpsAgent(tenant);

      // Get certificate data (base64 encoded PFX)
      const certBase64 = tenant.tra_cert_pfx_base64;
      const certPassword = this.getCertPassword(tenant);

      const response = await axios.post(
        `${apiEndpoint}${this.DEFAULT_TOKEN_ENDPOINT}`,
        {
          tin: tenant.tenant_tin,
          serialNumber: tenant.vfd_serial_num,
          certificate: certBase64, // Include certificate in request body
          password: certPassword // Include password in request body
          // Note: Actual TRA API implementation may differ - adjust according to TRA API documentation
        },
        {
          httpsAgent,
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      if (!response.data || !response.data.token) {
        throw new Error('Token not received from TRA API');
      }

      return response.data.token;
    } catch (error) {
      console.error('TRA Token Generation Error:', error.response?.data || error.message);
      throw new Error(`Failed to generate TRA token: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Register/Verify tenant credentials with TRA API
   * @param {Object} tenant - Tenant object with TRA credentials
   * @returns {Promise<Object>} - Registration response
   */
  static async registerTenant(tenant) {
    try {
      const apiEndpoint = this.getApiEndpoint(tenant);
      const httpsAgent = this.createHttpsAgent(tenant);

      const certBase64 = tenant.tra_cert_pfx_base64;
      const certPassword = this.getCertPassword(tenant);

      const registrationData = {
        tin: tenant.tenant_tin,
        serialNumber: tenant.vfd_serial_num,
        businessName: tenant.company_name || tenant.name,
        address: tenant.company_address || '',
        phone: tenant.company_phone || '',
        email: tenant.company_email || '',
        certificate: certBase64, // Include certificate in request body
        password: certPassword // Include password in request body
        // Note: Actual TRA API implementation may differ - adjust according to TRA API documentation
      };

      const response = await axios.post(
        `${apiEndpoint}${this.DEFAULT_REGISTRATION_ENDPOINT}`,
        registrationData,
        {
          httpsAgent,
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        message: 'Tenant registered successfully with TRA',
        data: response.data
      };
    } catch (error) {
      console.error('TRA Registration Error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to register with TRA API',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Submit invoice to TRA EFDMS
   * @param {Object} tenant - Tenant object with TRA credentials
   * @param {Object} invoiceData - Invoice data to submit
   * @returns {Promise<Object>} - TRA response with receipt number, QR code, and fiscal code
   */
  static async submitInvoice(tenant, invoiceData) {
    try {
      // Generate token first
      const token = await this.generateToken(tenant);

      const apiEndpoint = this.getApiEndpoint(tenant);
      const httpsAgent = this.createHttpsAgent(tenant);

      // Prepare invoice payload according to TRA EFDMS specifications
      const invoicePayload = {
        tin: tenant.tenant_tin,
        serialNumber: tenant.vfd_serial_num,
        dateTime: new Date().toISOString(),
        items: invoiceData.items.map(item => ({
          name: item.description || item.name,
          code: item.code || item.sku || '',
          qty: item.quantity,
          price: item.unitPrice,
          tax: item.taxRate || 0,
          discount: item.discount || 0,
          total: item.subtotal
        })),
        subtotal: invoiceData.subtotal,
        tax: invoiceData.tax,
        discount: invoiceData.discount || 0,
        total: invoiceData.total,
        paymentMethod: invoiceData.paymentMethod || 'cash',
        customerName: invoiceData.customerName || 'Walk-in Customer',
        customerTin: invoiceData.customerTin || ''
      };

      const response = await axios.post(
        `${apiEndpoint}${this.DEFAULT_INVOICE_ENDPOINT}`,
        invoicePayload,
        {
          httpsAgent,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000
        }
      );

      if (!response.data || !response.data.receiptNumber) {
        throw new Error('Invalid response from TRA API');
      }

      return {
        success: true,
        receiptNumber: response.data.receiptNumber, // EFDMS Receipt Number
        qrCode: response.data.qrCode, // QR code data/image
        fiscalCode: response.data.fiscalCode, // Fiscal code
        data: response.data
      };
    } catch (error) {
      console.error('TRA Invoice Submission Error:', error.response?.data || error.message);
      throw new Error(`Failed to submit invoice to TRA: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Submit Z-Report (Daily Sales Summary) to TRA
   * @param {Object} tenant - Tenant object with TRA credentials
   * @param {Object} zReportData - Z-Report data
   * @returns {Promise<Object>} - TRA response
   */
  static async submitZReport(tenant, zReportData) {
    try {
      // Generate token first
      const token = await this.generateToken(tenant);

      const apiEndpoint = this.getApiEndpoint(tenant);
      const httpsAgent = this.createHttpsAgent(tenant);

      // Increment global counter
      const globalCounter = (tenant.current_global_counter || 0) + 1;

      const zReportPayload = {
        tin: tenant.tenant_tin,
        serialNumber: tenant.vfd_serial_num,
        date: zReportData.date || new Date().toISOString().split('T')[0],
        globalCounter: globalCounter,
        totalSales: zReportData.totalSales || 0,
        totalTax: zReportData.totalTax || 0,
        totalInvoices: zReportData.totalInvoices || 0,
        reportData: zReportData.reportData || []
      };

      const response = await axios.post(
        `${apiEndpoint}${this.DEFAULT_ZREPORT_ENDPOINT}`,
        zReportPayload,
        {
          httpsAgent,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 60000 // Z-reports may take longer
        }
      );

      return {
        success: true,
        globalCounter,
        message: 'Z-Report submitted successfully',
        data: response.data
      };
    } catch (error) {
      console.error('TRA Z-Report Submission Error:', error.response?.data || error.message);
      throw new Error(`Failed to submit Z-Report to TRA: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Validate tenant credentials without full registration
   * Used for initial verification when tenant configures TRA integration
   */
  static async validateCredentials(tenant) {
    try {
      // Try to generate a token - if this succeeds, credentials are valid
      await this.generateToken(tenant);
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
}

module.exports = TraApiService;

