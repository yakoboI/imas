const ShopifyService = require('../../services/integrations/shopifyService');
const ShopifyController = require('./shopifyController');
const IntegrationService = require('../../services/integrations/integrationService');

/**
 * Shopify Webhook Controller
 * Handles webhook callbacks from Shopify
 */
class ShopifyWebhookController {
  /**
   * Handle Shopify webhook
   */
  static async handleWebhook(req, res, next) {
    try {
      const { tenantId } = req.params;
      const hmac = req.headers['x-shopify-hmac-sha256'];
      const topic = req.headers['x-shopify-topic'];
      const shop = req.headers['x-shopify-shop-domain'];

      // Verify webhook signature (if webhook secret is configured)
      const integration = await IntegrationService.getIntegration(tenantId, ShopifyService.getIntegrationType());
      if (integration && integration.credentials) {
        const credentials = IntegrationService.decryptCredentials(integration.credentials);
        if (credentials.webhookSecret && hmac) {
          const rawBody = JSON.stringify(req.body);
          const isValid = ShopifyService.verifyWebhookSignature(rawBody, hmac, credentials.webhookSecret);
          if (!isValid) {
            return res.status(401).json({ error: 'Invalid webhook signature' });
          }
        }
      }

      // Log webhook received
      await ShopifyService.logWebhook(
        tenantId,
        integration?.id || null,
        `shopify_${topic}`,
        req.body,
        'pending'
      );

      // Handle different webhook topics
      if (topic === 'orders/create' || topic === 'orders/updated') {
        const shopifyOrder = req.body;

        try {
          // Sync order to local system
          await ShopifyController.syncShopifyOrder(tenantId, shopifyOrder);

          // Log success
          await ShopifyService.logWebhook(
            tenantId,
            integration?.id || null,
            `shopify_${topic}`,
            req.body,
            'success',
            null,
            shopifyOrder.id?.toString(),
            'order',
            null
          );

          res.status(200).json({ received: true });
        } catch (syncError) {
          console.error('[ShopifyWebhookController] Error syncing order:', syncError);
          
          // Log error
          await ShopifyService.logWebhook(
            tenantId,
            integration?.id || null,
            `shopify_${topic}`,
            req.body,
            'error',
            syncError.message,
            shopifyOrder.id?.toString()
          );

          // Still return 200 to prevent retries
          res.status(200).json({ received: true, error: syncError.message });
        }
      } else {
        // Other webhook types - just acknowledge
        await ShopifyService.logWebhook(
          tenantId,
          integration?.id || null,
          `shopify_${topic}`,
          req.body,
          'success'
        );

        res.status(200).json({ received: true });
      }
    } catch (error) {
      console.error('[ShopifyWebhookController] Error in handleWebhook:', error);
      
      // Log error
      try {
        await ShopifyService.logWebhook(
          req.params.tenantId,
          null,
          'shopify_webhook_error',
          req.body,
          'error',
          error.message
        );
      } catch (logError) {
        console.error('Failed to log webhook error:', logError);
      }

      // Return 200 to prevent retries
      res.status(200).json({ received: true, error: error.message });
    }
  }
}

module.exports = ShopifyWebhookController;

