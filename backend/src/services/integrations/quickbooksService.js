const BaseIntegrationService = require('./baseIntegrationService');
const IntegrationService = require('./integrationService');
const axios = require('axios');

/**
 * QuickBooks Online Integration Service
 * Handles all QuickBooks Online accounting integration
 * 
 * QuickBooks API Documentation: https://developer.intuit.com/app/developer/qbo/docs
 */
class QuickBooksService extends BaseIntegrationService {
  static getIntegrationType() {
    return 'quickbooks';
  }

  // QuickBooks API endpoints
  static getApiEndpoints() {
    return {
      baseUrl: 'https://sandbox-quickbooks.api.intuit.com', // Use sandbox or production
      authUrl: 'https://appcenter.intuit.com/connect/oauth2',
      tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
    };
  }

  /**
   * Get QuickBooks credentials from integration record
   */
  static async getCredentials(tenantId) {
    const integration = await IntegrationService.getIntegration(tenantId, this.getIntegrationType());
    if (!integration) {
      throw new Error('QuickBooks integration not configured');
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
        throw new Error('Missing QuickBooks credentials');
      }

      const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const response = await axios.post(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }),
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Accept': 'application/json',
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
      console.error('QuickBooks refreshAccessToken error:', error.response?.data || error.message);
      throw new Error(`Failed to refresh access token: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  static async getAccessToken(tenantId) {
    try {
      const credentials = await this.getCredentials(tenantId);
      const { accessToken, tokenExpiresAt, realmId } = credentials;

      // Check if token is expired or expires soon (within 5 minutes)
      if (tokenExpiresAt && new Date(tokenExpiresAt) > new Date(Date.now() + 5 * 60 * 1000)) {
        return { accessToken, realmId };
      }

      // Token expired or about to expire, refresh it
      const newAccessToken = await this.refreshAccessToken(tenantId);
      const updatedCredentials = await this.getCredentials(tenantId);
      return { accessToken: newAccessToken, realmId: updatedCredentials.realmId };
    } catch (error) {
      console.error('QuickBooks getAccessToken error:', error);
      throw error;
    }
  }

  /**
   * Validate QuickBooks credentials
   */
  static async validateCredentials(credentials) {
    try {
      const { accessToken, realmId } = credentials;

      if (!accessToken || !realmId) {
        return {
          success: false,
          message: 'Access token and Realm ID are required'
        };
      }

      // Test credentials by making API call
      try {
        const response = await axios.get(`https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
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
          message: `Credential validation failed: ${apiError.response?.data?.fault?.error?.[0]?.message || apiError.message}`
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
   * Create invoice in QuickBooks
   */
  static async createInvoice(tenantId, invoiceData) {
    try {
      const { accessToken, realmId } = await this.getAccessToken(tenantId);

      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/invoice`;

      // Map invoice data to QuickBooks format
      const qbInvoice = {
        Line: invoiceData.items.map(item => ({
          DetailType: 'SalesItemLineDetail',
          Amount: parseFloat(item.amount),
          SalesItemLineDetail: {
            ItemRef: {
              value: item.itemId || '1', // Default item, should be configured
              name: item.name
            },
            Qty: item.quantity,
            UnitPrice: parseFloat(item.unitPrice)
          },
          Description: item.description
        })),
        CustomerRef: {
          value: invoiceData.customerId || '1' // Default customer, should be configured
        },
        BillEmail: {
          Address: invoiceData.customerEmail
        },
        DueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0],
        DocNumber: invoiceData.invoiceNumber
      };

      const response = await axios.post(url, qbInvoice, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
        response.data?.Invoice?.Id
      );

      return {
        success: true,
        invoiceId: response.data?.Invoice?.Id,
        data: response.data?.Invoice
      };
    } catch (error) {
      console.error('QuickBooks createInvoice error:', error.response?.data || error.message);
      
      // Log error
      await this.logApiCall(
        tenantId,
        null,
        'create_invoice',
        invoiceData,
        'error',
        error.response?.data?.fault?.error?.[0]?.message || error.message
      );

      throw new Error(`Failed to create invoice: ${error.response?.data?.fault?.error?.[0]?.message || error.message}`);
    }
  }
}

module.exports = QuickBooksService;

