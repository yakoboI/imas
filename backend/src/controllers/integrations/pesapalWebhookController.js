const PesapalService = require('../../services/integrations/pesapalService');
const IntegrationService = require('../../services/integrations/integrationService');
const Order = require('../../models/Order');
const OrderController = require('../orderController');

/**
 * Pesapal Webhook Controller
 * Handles IPN (Instant Payment Notification) callbacks from Pesapal
 */
class PesapalWebhookController {
  /**
   * Handle Pesapal IPN callback
   * Pesapal sends GET request with orderTrackingId and orderMerchantReference
   */
  static async handleWebhook(req, res, next) {
    try {
      const { tenantId } = req.params;
      const { orderTrackingId, orderMerchantReference } = req.query;

      if (!orderTrackingId) {
        return res.status(400).json({ error: 'orderTrackingId is required' });
      }

      // Log webhook received
      await PesapalService.logWebhook(
        tenantId,
        null,
        'payment_callback',
        { orderTrackingId, orderMerchantReference },
        'pending'
      );

      // Find order by payment reference
      const order = await Order.findOne({
        where: {
          tenant_id: tenantId,
          payment_reference: orderTrackingId
        }
      });

      if (!order) {
        console.error(`Order not found for Pesapal payment reference: ${orderTrackingId}`);
        return res.status(404).json({ error: 'Order not found' });
      }

      // Get payment status from Pesapal
      const statusResponse = await PesapalService.getPaymentStatus(tenantId, orderTrackingId);

      // Map Pesapal status to our payment_status
      let paymentStatus = 'pending';
      const pesapalStatus = statusResponse.status?.toLowerCase() || '';

      if (pesapalStatus.includes('completed') || pesapalStatus.includes('paid')) {
        paymentStatus = 'paid';
      } else if (pesapalStatus.includes('failed') || pesapalStatus.includes('cancelled')) {
        paymentStatus = 'pending'; // Keep as pending if failed
      }

      // Update order payment status
      const oldPaymentStatus = order.payment_status;
      order.payment_status = paymentStatus;
      await order.save();

      // If payment is successful, complete the order (this triggers inventory deduction)
      if (paymentStatus === 'paid' && oldPaymentStatus !== 'paid') {
        try {
          // Check if order is not already completed
          if (order.status !== 'completed') {
            // Update order status to completed
            order.status = 'completed';
            await order.save();

            // Deduct inventory from order (using the same method OrderController uses)
            await OrderController._deductInventoryFromOrder(order, tenantId, order.created_by);
            
            console.log(`Order ${order.order_number} completed and inventory deducted after Pesapal payment`);
          }
        } catch (completionError) {
          console.error('Error completing order after Pesapal payment:', completionError);
          // Log but don't fail - order payment status is already updated
        }
      }

      // Log webhook success
      await PesapalService.logWebhook(
        tenantId,
        null,
        'payment_callback',
        { orderTrackingId, orderMerchantReference, status: statusResponse.status },
        'success',
        null,
        orderTrackingId,
        'order',
        order.id
      );

      // Pesapal expects a response
      res.json({
        success: true,
        message: 'Payment status updated'
      });
    } catch (error) {
      console.error('[PesapalWebhookController] Error in handleWebhook:', error);
      
      // Log webhook error
      try {
        await PesapalService.logWebhook(
          req.params.tenantId,
          null,
          'payment_callback',
          req.query,
          'error',
          error.message
        );
      } catch (logError) {
        console.error('Failed to log webhook error:', logError);
      }

      // Still return success to Pesapal (they'll retry if needed)
      res.status(500).json({
        success: false,
        message: 'Error processing webhook'
      });
    }
  }
}

module.exports = PesapalWebhookController;

