const FlutterwaveService = require('../../services/integrations/flutterwaveService');
const Order = require('../../models/Order');
const OrderController = require('../orderController');

/**
 * Flutterwave Webhook Controller
 * Handles webhook callbacks from Flutterwave
 */
class FlutterwaveWebhookController {
  /**
   * Handle Flutterwave webhook
   * Flutterwave sends POST request with payment event data
   */
  static async handleWebhook(req, res, next) {
    try {
      const { tenantId } = req.params;
      const signature = req.headers['verif-hash'];
      const payload = req.body;

      // Verify webhook signature
      const credentials = await FlutterwaveService.getCredentials(tenantId);
      if (credentials.secretHash && signature) {
        const isValid = FlutterwaveService.verifyWebhookSignature(payload, signature, credentials.secretHash);
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid webhook signature' });
        }
      }

      // Log webhook received
      await FlutterwaveService.logWebhook(
        tenantId,
        null,
        'payment_webhook',
        payload,
        'pending'
      );

      const { event, data } = payload;

      // Handle different event types
      if (event === 'charge.completed' || event === 'charge.successful') {
        const txRef = data?.tx_ref;
        const transactionId = data?.id;
        const status = data?.status;
        const amount = data?.amount;

        if (!txRef) {
          console.error('Flutterwave webhook missing tx_ref');
          return res.status(400).json({ error: 'Missing tx_ref in webhook payload' });
        }

        // Find order by payment reference
        const order = await Order.findOne({
          where: {
            tenant_id: tenantId,
            payment_reference: txRef
          }
        });

        if (!order) {
          console.error(`Order not found for Flutterwave tx_ref: ${txRef}`);
          return res.status(404).json({ error: 'Order not found' });
        }

        // Verify payment status
        let paymentStatus = 'pending';
        if (status === 'successful') {
          paymentStatus = 'paid';
        }

        // Update order payment status
        const oldPaymentStatus = order.payment_status;
        order.payment_status = paymentStatus;
        await order.save();

        // If payment is successful, complete the order (this triggers inventory deduction)
        if (paymentStatus === 'paid' && oldPaymentStatus !== 'paid') {
          try {
            if (order.status !== 'completed') {
              order.status = 'completed';
              await order.save();

              // Deduct inventory from order
              await OrderController._deductInventoryFromOrder(order, tenantId, order.created_by);
              
              console.log(`Order ${order.order_number} completed and inventory deducted after Flutterwave payment`);
            }
          } catch (completionError) {
            console.error('Error completing order after Flutterwave payment:', completionError);
          }
        }

        // Log webhook success
        await FlutterwaveService.logWebhook(
          tenantId,
          null,
          'payment_webhook',
          payload,
          'success',
          null,
          transactionId,
          'order',
          order.id
        );

        // Flutterwave expects a 200 response
        res.status(200).json({ status: 'success' });
      } else {
        // For other event types, just log and acknowledge
        await FlutterwaveService.logWebhook(
          tenantId,
          null,
          'payment_webhook',
          payload,
          'success',
          null,
          data?.id
        );

        res.status(200).json({ status: 'received' });
      }
    } catch (error) {
      console.error('[FlutterwaveWebhookController] Error in handleWebhook:', error);
      
      // Log webhook error
      try {
        await FlutterwaveService.logWebhook(
          req.params.tenantId,
          null,
          'payment_webhook',
          req.body,
          'error',
          error.message
        );
      } catch (logError) {
        console.error('Failed to log webhook error:', logError);
      }

      // Return 200 to prevent retries for non-critical errors
      res.status(200).json({ status: 'error', message: error.message });
    }
  }
}

module.exports = FlutterwaveWebhookController;

