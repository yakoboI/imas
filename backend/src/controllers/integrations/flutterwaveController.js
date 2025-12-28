const FlutterwaveService = require('../../services/integrations/flutterwaveService');
const IntegrationService = require('../../services/integrations/integrationService');
const AuditService = require('../../services/auditService');
const Order = require('../../models/Order');
const Tenant = require('../../models/Tenant');

/**
 * Flutterwave Integration Controller
 */
class FlutterwaveController {
  /**
   * Connect/Configure Flutterwave integration
   */
  static async connectFlutterwave(req, res, next) {
    try {
      const { publicKey, secretKey, secretHash } = req.body;
      const tenantId = req.tenantId;

      if (!publicKey || !secretKey) {
        return res.status(400).json({ error: 'Public key and secret key are required' });
      }

      // Validate credentials
      const validationResult = await FlutterwaveService.validateCredentials({
        publicKey,
        secretKey
      });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }

      // Save integration
      const credentials = { publicKey, secretKey };
      if (secretHash) {
        credentials.secretHash = secretHash; // For webhook verification
      }

      const integration = await IntegrationService.saveIntegration(
        tenantId,
        FlutterwaveService.getIntegrationType(),
        credentials,
        {},
        true // Verified if validation passed
      );

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CONNECT_FLUTTERWAVE',
        entity_type: 'Integration',
        entity_id: integration.id,
        new_values: {
          integration_type: 'flutterwave',
          verified: true,
          status: integration.status
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: 'Flutterwave integration connected and verified'
      });

      res.json({
        message: 'Flutterwave integration connected and verified successfully',
        verified: true,
        integration: {
          id: integration.id,
          type: integration.integration_type,
          status: integration.status,
          verified: integration.verified
        }
      });
    } catch (error) {
      console.error('[FlutterwaveController] Error in connectFlutterwave:', error);
      next(error);
    }
  }

  /**
   * Initiate payment request
   */
  static async initiatePayment(req, res, next) {
    try {
      const { orderId } = req.body;
      const tenantId = req.tenantId;

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      // Check if Flutterwave is active
      const isActive = await IntegrationService.isIntegrationActive(tenantId, FlutterwaveService.getIntegrationType());
      if (!isActive) {
        return res.status(400).json({ error: 'Flutterwave integration is not active. Please configure it first.' });
      }

      // Get order
      const order = await Order.findOne({
        where: { id: orderId, tenant_id: tenantId },
        include: [{ model: require('../../models/Customer'), as: 'customer' }]
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.payment_status === 'paid') {
        return res.status(400).json({ error: 'Order is already paid' });
      }

      // Get tenant currency from settings
      const tenant = await Tenant.findByPk(tenantId);
      const defaultCurrency = 'KES'; // Default for Flutterwave (Africa-focused)
      const currency = (tenant?.settings?.currency || defaultCurrency).toUpperCase();

      // Construct callback URL
      const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
      const callbackUrl = `${baseUrl}/payment/callback`;

      // Initialize payment with Flutterwave
      const paymentResponse = await FlutterwaveService.initializePayment(tenantId, {
        orderId: order.id,
        orderNumber: order.order_number,
        amount: parseFloat(order.total_amount),
        currency: currency,
        customerEmail: order.customer?.email || '',
        customerPhone: order.customer?.phone || '',
        customerName: order.customer?.name || 'Customer',
        description: `Payment for order ${order.order_number}`,
        callbackUrl
      });

      // Update order with payment reference
      await order.update({
        payment_reference: paymentResponse.txRef,
        payment_gateway: 'flutterwave'
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'INITIATE_FLUTTERWAVE_PAYMENT',
        entity_type: 'Order',
        entity_id: order.id,
        new_values: {
          payment_reference: paymentResponse.txRef,
          payment_gateway: 'flutterwave'
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Flutterwave payment initiated for order ${order.order_number}`
      });

      res.json({
        message: 'Payment request submitted successfully',
        paymentLink: paymentResponse.paymentLink,
        txRef: paymentResponse.txRef,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          paymentReference: paymentResponse.txRef
        }
      });
    } catch (error) {
      console.error('[FlutterwaveController] Error in initiatePayment:', error);
      next(error);
    }
  }

  /**
   * Verify payment status
   */
  static async verifyPayment(req, res, next) {
    try {
      const { transactionId } = req.params;
      const tenantId = req.tenantId;

      if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID is required' });
      }

      const verificationResponse = await FlutterwaveService.verifyPayment(tenantId, transactionId);

      res.json({
        success: true,
        status: verificationResponse.status,
        amount: verificationResponse.amount,
        currency: verificationResponse.currency,
        txRef: verificationResponse.txRef,
        data: verificationResponse.data
      });
    } catch (error) {
      console.error('[FlutterwaveController] Error in verifyPayment:', error);
      next(error);
    }
  }
}

module.exports = FlutterwaveController;

