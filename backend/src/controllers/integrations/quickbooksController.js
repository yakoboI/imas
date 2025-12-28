const QuickBooksService = require('../../services/integrations/quickbooksService');
const IntegrationService = require('../../services/integrations/integrationService');
const AuditService = require('../../services/auditService');
const Receipt = require('../../models/Receipt');
const ReceiptItem = require('../../models/ReceiptItem');

/**
 * QuickBooks Integration Controller
 */
class QuickBooksController {
  /**
   * Connect/Configure QuickBooks integration
   */
  static async connectQuickBooks(req, res, next) {
    try {
      const { accessToken, refreshToken, realmId, clientId, clientSecret } = req.body;
      const tenantId = req.tenantId;

      if (!accessToken || !refreshToken || !realmId) {
        return res.status(400).json({ error: 'Access token, refresh token, and Realm ID are required' });
      }

      // Validate credentials
      const validationResult = await QuickBooksService.validateCredentials({
        accessToken,
        realmId
      });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }

      // Save integration
      const credentials = {
        accessToken,
        refreshToken,
        realmId
      };
      
      if (clientId && clientSecret) {
        credentials.clientId = clientId;
        credentials.clientSecret = clientSecret;
      }

      const integration = await IntegrationService.saveIntegration(
        tenantId,
        QuickBooksService.getIntegrationType(),
        credentials,
        {},
        true // Verified if validation passed
      );

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CONNECT_QUICKBOOKS',
        entity_type: 'Integration',
        entity_id: integration.id,
        new_values: {
          integration_type: 'quickbooks',
          verified: true,
          status: integration.status
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: 'QuickBooks integration connected and verified'
      });

      res.json({
        message: 'QuickBooks integration connected and verified successfully',
        verified: true,
        integration: {
          id: integration.id,
          type: integration.integration_type,
          status: integration.status,
          verified: integration.verified
        }
      });
    } catch (error) {
      console.error('[QuickBooksController] Error in connectQuickBooks:', error);
      next(error);
    }
  }

  /**
   * Sync receipt to QuickBooks as invoice
   */
  static async syncReceiptToQuickBooks(req, res, next) {
    try {
      const { receiptId } = req.params;
      const tenantId = req.tenantId;

      // Check if QuickBooks is active
      const isActive = await IntegrationService.isIntegrationActive(tenantId, QuickBooksService.getIntegrationType());
      if (!isActive) {
        return res.status(400).json({ error: 'QuickBooks integration is not active. Please configure it first.' });
      }

      // Get receipt with items
      const receipt = await Receipt.findOne({
        where: { id: receiptId, tenant_id: tenantId },
        include: [
          { model: ReceiptItem, as: 'items', include: [{ model: require('../../models/Product'), as: 'product' }] },
          { model: require('../../models/Customer'), as: 'customer' }
        ]
      });

      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      if (receipt.synced_to_accounting) {
        return res.status(400).json({ error: 'Receipt already synced to accounting software' });
      }

      // Map receipt to QuickBooks invoice format
      const invoiceData = {
        invoiceNumber: receipt.receipt_number,
        customerEmail: receipt.customer?.email || '',
        dueDate: receipt.issue_date.toISOString().split('T')[0],
        items: receipt.items.map(item => ({
          name: item.product?.name || 'Item',
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unit_price),
          amount: parseFloat(item.subtotal),
          description: item.product?.name || ''
        }))
      };

      // Create invoice in QuickBooks
      const qbResponse = await QuickBooksService.createInvoice(tenantId, invoiceData);

      // Update receipt with accounting sync info
      await receipt.update({
        synced_to_accounting: true,
        accounting_invoice_id: qbResponse.invoiceId,
        accounting_synced_at: new Date(),
        accounting_provider: 'quickbooks',
        accounting_sync_error: null
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'SYNC_RECEIPT_TO_QUICKBOOKS',
        entity_type: 'Receipt',
        entity_id: receipt.id,
        new_values: {
          accounting_invoice_id: qbResponse.invoiceId,
          synced_to_accounting: true
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Receipt ${receipt.receipt_number} synced to QuickBooks`
      });

      res.json({
        message: 'Receipt synced to QuickBooks successfully',
        receipt: {
          id: receipt.id,
          receiptNumber: receipt.receipt_number,
          accountingInvoiceId: qbResponse.invoiceId
        },
        quickbooksInvoice: qbResponse.data
      });
    } catch (error) {
      console.error('[QuickBooksController] Error in syncReceiptToQuickBooks:', error);
      
      // Update receipt with error
      try {
        const receipt = await Receipt.findOne({
          where: { id: req.params.receiptId, tenant_id: req.tenantId }
        });
        if (receipt) {
          await receipt.update({
            accounting_sync_error: error.message
          });
        }
      } catch (updateError) {
        console.error('Failed to update receipt with sync error:', updateError);
      }

      next(error);
    }
  }
}

module.exports = QuickBooksController;

