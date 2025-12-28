const PesapalService = require('../../services/integrations/pesapalService');
const IntegrationService = require('../../services/integrations/integrationService');
const AuditService = require('../../services/auditService');
const Order = require('../../models/Order');
const OrderController = require('../orderController');
const Tenant = require('../../models/Tenant');

/**
 * Pesapal Integration Controller
 */
class PesapalController {
  /**
   * Connect/Configure Pesapal integration
   */
  static async connectPesapal(req, res, next) {
    try {
      const { consumerKey, consumerSecret, environment } = req.body;
      const tenantId = req.tenantId;

      if (!consumerKey || !consumerSecret) {
        return res.status(400).json({ error: 'Consumer key and consumer secret are required' });
      }

      // Validate credentials
      const validationResult = await PesapalService.validateCredentials({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
        environment: environment || 'sandbox'
      });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }

      // Try to get access token to verify credentials work
      let verified = false;
      try {
        // Save integration first (temporarily)
        await IntegrationService.saveIntegration(
          tenantId,
          PesapalService.getIntegrationType(),
          {
            consumer_key: consumerKey,
            consumer_secret: consumerSecret,
            environment: environment || 'sandbox'
          },
          {},
          false
        );

        // Try to get access token to verify
        await PesapalService.getAccessToken(tenantId);
        verified = true;
      } catch (error) {
        console.error('Pesapal credential verification failed:', error);
        verified = false;
      }

      // Save integration with verified status
      const integration = await IntegrationService.saveIntegration(
        tenantId,
        PesapalService.getIntegrationType(),
        {
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
          environment: environment || 'sandbox'
        },
        {},
        verified
      );

      // Register IPN URL if credentials are verified
      if (verified) {
        try {
          // Construct IPN URL (webhook endpoint)
          const baseUrl = process.env.APP_URL || 'http://localhost:5000';
          const ipnUrl = `${baseUrl}/api/webhooks/pesapal/${tenantId}`;
          const ipnResponse = await PesapalService.registerIPN(tenantId, ipnUrl);
          
          // Store IPN ID in configuration
          if (ipnResponse?.ipn_id) {
            await integration.update({
              configuration: {
                ...(integration.configuration || {}),
                ipn_id: ipnResponse.ipn_id,
                ipn_url: ipnUrl
              }
            });
          }
        } catch (ipnError) {
          console.error('Failed to register IPN (non-critical):', ipnError);
          // Don't fail the connection if IPN registration fails
        }
      }

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CONNECT_PESAPAL',
        entity_type: 'Integration',
        entity_id: integration.id,
        new_values: {
          integration_type: 'pesapal',
          verified,
          status: integration.status
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Pesapal integration connected ${verified ? 'and verified' : 'but verification failed'}`
      });

      res.json({
        message: verified 
          ? 'Pesapal integration connected and verified successfully'
          : 'Pesapal integration connected, but credential verification failed',
        verified,
        integration: {
          id: integration.id,
          type: integration.integration_type,
          status: integration.status,
          verified: integration.verified
        }
      });
    } catch (error) {
      console.error('[PesapalController] Error in connectPesapal:', error);
      next(error);
    }
  }

  /**
   * Initiate payment request
   * Called when customer wants to pay via Pesapal
   */
  static async initiatePayment(req, res, next) {
    try {
      const { orderId } = req.body;
      const tenantId = req.tenantId;

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      // Check if Pesapal is active
      const isActive = await IntegrationService.isIntegrationActive(tenantId, PesapalService.getIntegrationType());
      if (!isActive) {
        return res.status(400).json({ error: 'Pesapal integration is not active. Please configure it first.' });
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
      const defaultCurrency = 'KES'; // Default for Pesapal (Kenya-based)
      const currency = (tenant?.settings?.currency || defaultCurrency).toUpperCase();

      // Construct callback URL
      const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
      const callbackUrl = `${baseUrl}/payment/callback`;

      // Submit payment request to Pesapal
      const paymentResponse = await PesapalService.submitPaymentRequest(tenantId, {
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
        payment_reference: paymentResponse.orderTrackingId,
        payment_gateway: 'pesapal'
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'INITIATE_PESAPAL_PAYMENT',
        entity_type: 'Order',
        entity_id: order.id,
        new_values: {
          payment_reference: paymentResponse.orderTrackingId,
          payment_gateway: 'pesapal'
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Pesapal payment initiated for order ${order.order_number}`
      });

      res.json({
        message: 'Payment request submitted successfully',
        redirectUrl: paymentResponse.redirectUrl,
        orderTrackingId: paymentResponse.orderTrackingId,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          paymentReference: paymentResponse.orderTrackingId
        }
      });
    } catch (error) {
      console.error('[PesapalController] Error in initiatePayment:', error);
      next(error);
    }
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(req, res, next) {
    try {
      const { orderTrackingId } = req.params;
      const tenantId = req.tenantId;

      if (!orderTrackingId) {
        return res.status(400).json({ error: 'Order tracking ID is required' });
      }

      const statusResponse = await PesapalService.getPaymentStatus(tenantId, orderTrackingId);

      res.json({
        success: true,
        status: statusResponse.status,
        paymentMethod: statusResponse.paymentMethod,
        data: statusResponse.data
      });
    } catch (error) {
      console.error('[PesapalController] Error in getPaymentStatus:', error);
      next(error);
    }
  }
}

module.exports = PesapalController;

