const DpoService = require('../../services/integrations/dpoService');
const IntegrationService = require('../../services/integrations/integrationService');
const AuditService = require('../../services/auditService');
const Order = require('../../models/Order');
const Tenant = require('../../models/Tenant');

/**
 * DPO Pay Integration Controller
 */
class DpoController {
  /**
   * Connect/Configure DPO Pay integration
   */
  static async connectDpo(req, res, next) {
    try {
      const { companyToken, serviceType, environment } = req.body;
      const tenantId = req.tenantId;

      if (!companyToken || !serviceType) {
        return res.status(400).json({ error: 'Company token and service type are required' });
      }

      // Validate credentials
      const validationResult = await DpoService.validateCredentials({
        companyToken,
        serviceType,
        environment: environment || 'sandbox'
      });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }

      // Save integration
      const integration = await IntegrationService.saveIntegration(
        tenantId,
        DpoService.getIntegrationType(),
        {
          companyToken,
          serviceType,
          environment: environment || 'sandbox'
        },
        {},
        true // Verified if validation passed
      );

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CONNECT_DPO',
        entity_type: 'Integration',
        entity_id: integration.id,
        new_values: {
          integration_type: 'dpo',
          verified: true,
          status: integration.status
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: 'DPO Pay integration connected and verified'
      });

      res.json({
        message: 'DPO Pay integration connected and verified successfully',
        verified: true,
        integration: {
          id: integration.id,
          type: integration.integration_type,
          status: integration.status,
          verified: integration.verified
        }
      });
    } catch (error) {
      console.error('[DpoController] Error in connectDpo:', error);
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

      // Check if DPO is active
      const isActive = await IntegrationService.isIntegrationActive(tenantId, DpoService.getIntegrationType());
      if (!isActive) {
        return res.status(400).json({ error: 'DPO Pay integration is not active. Please configure it first.' });
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
      const defaultCurrency = 'KES'; // Default for DPO (Africa-focused)
      const currency = (tenant?.settings?.currency || defaultCurrency).toUpperCase();

      // Construct callback URL
      const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
      const callbackUrl = `${baseUrl}/payment/callback?orderId=${order.id}`;

      // Create payment token with DPO
      const paymentResponse = await DpoService.createPaymentToken(tenantId, {
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
        payment_reference: paymentResponse.transRef,
        payment_gateway: 'dpo'
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'INITIATE_DPO_PAYMENT',
        entity_type: 'Order',
        entity_id: order.id,
        new_values: {
          payment_reference: paymentResponse.transRef,
          payment_gateway: 'dpo'
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `DPO Pay payment initiated for order ${order.order_number}`
      });

      res.json({
        message: 'Payment request submitted successfully',
        redirectUrl: paymentResponse.redirectUrl,
        transRef: paymentResponse.transRef,
        transToken: paymentResponse.transToken,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          paymentReference: paymentResponse.transRef
        }
      });
    } catch (error) {
      console.error('[DpoController] Error in initiatePayment:', error);
      next(error);
    }
  }

  /**
   * Verify payment status (called from callback)
   */
  static async verifyPayment(req, res, next) {
    try {
      const { transToken } = req.query;
      const tenantId = req.tenantId;

      if (!transToken) {
        return res.status(400).json({ error: 'Transaction token is required' });
      }

      const verificationResponse = await DpoService.verifyPaymentToken(tenantId, transToken);

      // Find order and update payment status
      const order = await Order.findOne({
        where: {
          tenant_id: tenantId,
          payment_reference: verificationResponse.transRef
        }
      });

      if (order && verificationResponse.status === '3') { // DPO status 3 = successful
        const oldPaymentStatus = order.payment_status;
        order.payment_status = 'paid';
        await order.save();

        // If payment is successful, complete the order
        if (oldPaymentStatus !== 'paid' && order.status !== 'completed') {
          order.status = 'completed';
          await order.save();

          const OrderController = require('../orderController');
          await OrderController._deductInventoryFromOrder(order, tenantId, order.created_by);
        }
      }

      res.json({
        success: true,
        status: verificationResponse.status,
        amount: verificationResponse.amount,
        currency: verificationResponse.currency,
        transRef: verificationResponse.transRef,
        order: order ? {
          id: order.id,
          orderNumber: order.order_number,
          paymentStatus: order.payment_status
        } : null
      });
    } catch (error) {
      console.error('[DpoController] Error in verifyPayment:', error);
      next(error);
    }
  }
}

module.exports = DpoController;

