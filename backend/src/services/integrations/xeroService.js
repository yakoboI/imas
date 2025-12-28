const BaseIntegrationService = require('./baseIntegrationService');
const IntegrationService = require('./integrationService');
const axios = require('axios');

/**
 * Xero Integration Service
 * Handles all Xero accounting integration
 * 
 * Xero API Documentation: https://developer.xero.com/documentation
 */
class XeroService extends BaseIntegrationService {
  static getIntegrationType() {
    return 'xero';
  }

  // Xero API endpoints
  static getApiEndpoints() {
    return {
      baseUrl: 'https://api.xero.com/api.xro/2.0',
      tokenUrl: 'https://identity.xero.com/connect/token',
      authorizeUrl: 'https://login.xero.com/identity/connect/authorize'
    };
  }

  /**
   * Get Xero credentials from integration record
   */
  static async getCredentials(tenantId) {
    const integration = await IntegrationService.getIntegration(tenantId, this.getIntegrationType());
    if (!integration) {
      throw new Error('Xero integration not configured');
    }
    return IntegrationService.decryptCredentials(integration.credentials);
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(tenantId) {
    try {
      const credentials = await this.getCredentials(tenantId);
      const { refreshToken, clientId, clientSecret } = credentials;

      if (!refreshToken || !clientId || !clientSecret) {
        throw new Error('Missing Xero credentials');
      }

      const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const response = await axios.post(
        'https://identity.xero.com/connect/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }),
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;

      // Update stored credentials
      const integration = await IntegrationService.getIntegration(tenantId, this.getIntegrationType());
      const updatedCredentials = {
        ...credentials,
        accessToken: access_token,
        refreshToken: new_refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000).toISOString()
      };

      await integration.update({
        credentials: IntegrationService.encryptCredentials(updatedCredentials)
      });

      return access_token;
    } catch (error) {
      console.error('Xero refreshAccessToken error:', error.response?.data || error.message);
      throw new Error(`Failed to refresh access token: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  static async getAccessToken(tenantId) {
    try {
      const credentials = await this.getCredentials(tenantId);
      const { accessToken, tokenExpiresAt, tenantId: xeroTenantId } = credentials;

      // Check if token is expired or expires soon (within 5 minutes)
      if (tokenExpiresAt && new Date(tokenExpiresAt) > new Date(Date.now() + 5 * 60 * 1000)) {
        return { accessToken, tenantId: xeroTenantId };
      }

      // Token expired or about to expire, refresh it
      const newAccessToken = await this.refreshAccessToken(tenantId);
      const updatedCredentials = await this.getCredentials(tenantId);
      const updatedXeroTenantId = updatedCredentials.tenantId || updatedCredentials.xeroTenantId;
      return { accessToken: newAccessToken, tenantId: updatedXeroTenantId };
    } catch (error) {
      console.error('Xero getAccessToken error:', error);
      throw error;
    }
  }

  /**
   * Validate Xero credentials
   */
  static async validateCredentials(credentials) {
    try {
      const { accessToken, tenantId } = credentials;

      if (!accessToken || !tenantId) {
        return {
          success: false,
          message: 'Access token and Tenant ID are required'
        };
      }

      // Test credentials by making API call
      try {
        const response = await axios.get('https://api.xero.com/api.xro/2.0/Organisation', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Xero-tenant-id': tenantId,
            'Accept': 'application/json'
          }
        });
        
        if (response.status === 200) {
          return {
            success: true,
            message: 'Credentials validated successfully',
            organisationData: response.data.Organisations?.[0]
          };
        }
      } catch (apiError) {
        return {
          success: false,
          message: `Credential validation failed: ${apiError.response?.data?.Title || apiError.message}`
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
   * Create invoice in Xero
   */
  static async createInvoice(tenantId, invoiceData) {
    try {
      const { accessToken, tenantId: xeroTenantId } = await this.getAccessToken(tenantId);

      const url = 'https://api.xero.com/api.xro/2.0/Invoices';

      // Map invoice data to Xero format
      const xeroInvoice = {
        Type: 'ACCREC', // Accounts Receivable
        Contact: {
          ContactID: invoiceData.contactId || null,
          EmailAddress: invoiceData.customerEmail
        },
        Date: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
        DueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0],
        InvoiceNumber: invoiceData.invoiceNumber,
        LineItems: invoiceData.items.map(item => ({
          Description: item.description || item.name,
          Quantity: item.quantity,
          UnitAmount: parseFloat(item.unitPrice),
          LineAmount: parseFloat(item.amount),
          AccountCode: item.accountCode || '200' // Default sales account code
        })),
        Status: 'AUTHORISED'
      };

      const response = await axios.post(url, { Invoices: [xeroInvoice] }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Xero-tenant-id': xeroTenantId,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // Log API call
      await this.logApiCall(
        tenantId,
        null,
        'create_invoice',
        { invoiceNumber: invoiceData.invoiceNumber },
        'success',
        null,
        response.data?.Invoices?.[0]?.InvoiceID
      );

      return {
        success: true,
        invoiceId: response.data?.Invoices?.[0]?.InvoiceID,
        invoiceNumber: response.data?.Invoices?.[0]?.InvoiceNumber,
        data: response.data?.Invoices?.[0]
      };
    } catch (error) {
      console.error('Xero createInvoice error:', error.response?.data || error.message);
      
      // Log error
      await this.logApiCall(
        tenantId,
        null,
        'create_invoice',
        invoiceData,
        'error',
        error.response?.data?.Title || error.message
      );

      throw new Error(`Failed to create invoice: ${error.response?.data?.Title || error.message}`);
    }
  }
}

module.exports = XeroService;

