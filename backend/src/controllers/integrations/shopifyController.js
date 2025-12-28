const ShopifyService = require('../../services/integrations/shopifyService');
const IntegrationService = require('../../services/integrations/integrationService');
const AuditService = require('../../services/auditService');
const OrderController = require('../orderController');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Customer = require('../../models/Customer');

/**
 * Shopify Integration Controller
 */
class ShopifyController {
  /**
   * Connect/Configure Shopify integration (OAuth callback or manual)
   */
  static async connectShopify(req, res, next) {
    try {
      const { shopName, accessToken, webhookSecret } = req.body;
      const tenantId = req.tenantId;

      if (!shopName || !accessToken) {
        return res.status(400).json({ error: 'Shop name and access token are required' });
      }

      // Validate credentials
      const validationResult = await ShopifyService.validateCredentials({
        shopName,
        accessToken
      });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }

      // Save integration
      const credentials = { shopName, accessToken };
      if (webhookSecret) {
        credentials.webhookSecret = webhookSecret;
      }

      const integration = await IntegrationService.saveIntegration(
        tenantId,
        ShopifyService.getIntegrationType(),
        credentials,
        {
          shopData: validationResult.shopData
        },
        true // Verified if validation passed
      );

      // Register webhooks
      try {
        const baseUrl = process.env.APP_URL || 'http://localhost:5000';
        const webhookUrl = `${baseUrl}/api/integrations/shopify/webhook/${tenantId}`;

        // Register order.created webhook
        await ShopifyService.createWebhook(tenantId, 'orders/create', webhookUrl);
        
        // Register order.updated webhook
        await ShopifyService.createWebhook(tenantId, 'orders/updated', webhookUrl);
      } catch (webhookError) {
        console.error('Failed to register Shopify webhooks (non-critical):', webhookError);
        // Don't fail the connection if webhook registration fails
      }

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CONNECT_SHOPIFY',
        entity_type: 'Integration',
        entity_id: integration.id,
        new_values: {
          integration_type: 'shopify',
          verified: true,
          status: integration.status
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: 'Shopify integration connected and verified'
      });

      res.json({
        message: 'Shopify integration connected and verified successfully',
        verified: true,
        integration: {
          id: integration.id,
          type: integration.integration_type,
          status: integration.status,
          verified: integration.verified
        }
      });
    } catch (error) {
      console.error('[ShopifyController] Error in connectShopify:', error);
      next(error);
    }
  }

  /**
   * Sync Shopify order to local system
   */
  static async syncShopifyOrder(tenantId, shopifyOrder, userId = null) {
    try {
      // Map Shopify order to local order format
      const orderNumber = `SHOP-${shopifyOrder.order_number}`;

      // Check if order already exists
      const existingOrder = await Order.findOne({
        where: {
          tenant_id: tenantId,
          order_number: orderNumber
        }
      });

      if (existingOrder) {
        // Update existing order
        return existingOrder;
      }

      // Find or create customer
      let customer = null;
      if (shopifyOrder.customer) {
        const [foundCustomer] = await Customer.findOrCreate({
          where: {
            tenant_id: tenantId,
            email: shopifyOrder.customer.email
          },
          defaults: {
            tenant_id: tenantId,
            name: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`.trim(),
            email: shopifyOrder.customer.email,
            phone: shopifyOrder.customer.phone || null,
            address: shopifyOrder.shipping_address ? 
              `${shopifyOrder.shipping_address.address1}, ${shopifyOrder.shipping_address.city}` : null
          }
        });
        customer = foundCustomer;
      }

      // Calculate totals
      const totalAmount = parseFloat(shopifyOrder.total_price || 0);
      const taxAmount = parseFloat(shopifyOrder.total_tax || 0);

      // Create order
      const order = await Order.create({
        tenant_id: tenantId,
        order_number: orderNumber,
        customer_id: customer?.id || null,
        order_date: new Date(shopifyOrder.created_at),
        status: shopifyOrder.financial_status === 'paid' ? 'completed' : 'pending',
        total_amount: totalAmount,
        tax_amount: taxAmount,
        discount_amount: 0,
        payment_method: 'shopify',
        payment_status: shopifyOrder.financial_status === 'paid' ? 'paid' : 'pending',
        payment_reference: shopifyOrder.name, // Shopify order name (e.g., #1001)
        payment_gateway: 'shopify',
        notes: `Imported from Shopify order ${shopifyOrder.name}`,
        created_by: userId || null // System user if no user context
      });

      // Create order items
      for (const lineItem of shopifyOrder.line_items || []) {
        // Find product by SKU or create placeholder
        let product = await Product.findOne({
          where: {
            tenant_id: tenantId,
            sku: lineItem.sku
          }
        });

        if (!product) {
          // Create product if it doesn't exist
          product = await Product.create({
            tenant_id: tenantId,
            name: lineItem.name,
            sku: lineItem.sku || `SHOP-${lineItem.product_id}`,
            description: lineItem.title,
            price: parseFloat(lineItem.price),
            tax_rate: 0 // Set based on your tax settings
          });
        }

        // Create order item
        const OrderItem = require('../../models/OrderItem');
        await OrderItem.create({
          tenant_id: tenantId,
          order_id: order.id,
          product_id: product.id,
          quantity: parseInt(lineItem.quantity),
          unit_price: parseFloat(lineItem.price),
          subtotal: parseFloat(lineItem.price) * parseInt(lineItem.quantity),
          tax_rate: 0,
          tax_amount: 0
        });
      }

      // If order is paid, complete it and deduct inventory
      if (shopifyOrder.financial_status === 'paid' && order.status !== 'completed') {
        order.status = 'completed';
        await order.save();
        
        await OrderController._deductInventoryFromOrder(order, tenantId, order.created_by);
      }

      return order;
    } catch (error) {
      console.error('[ShopifyController] Error syncing Shopify order:', error);
      throw error;
    }
  }
}

module.exports = ShopifyController;

