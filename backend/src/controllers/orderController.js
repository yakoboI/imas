const { Op } = require('sequelize');
const { Order, OrderItem, Product, Customer, User, Inventory, Warehouse, StockMovement, Receipt } = require('../models/index');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const ReceiptService = require('../services/receiptService');

class OrderController {
  // Get all orders
  static async getAllOrders(req, res, next) {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const { page = 1, limit = 50, search, status, customer_id } = req.query;

      const where = { tenant_id: tenantId };

      if (status) {
        where.status = status;
      }

      if (customer_id) {
        where.customer_id = customer_id;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Order.findAndCountAll({
        where,
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email', 'phone'],
            required: false
          },
          {
            model: OrderItem,
            as: 'items',
            attributes: ['id', 'quantity', 'unit_price', 'subtotal'],
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku'],
                required: false
              }
            ],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['order_date', 'DESC']],
        distinct: true
      });

      // Filter by search term if provided
      let filteredRows = rows;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredRows = rows.filter(order => 
          order.order_number?.toLowerCase().includes(searchLower) ||
          order.customer?.name?.toLowerCase().includes(searchLower) ||
          order.customer?.email?.toLowerCase().includes(searchLower)
        );
      }

      res.json({
        orders: filteredRows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('[OrderController] Error in getAllOrders:', error);
      console.error('[OrderController] Error stack:', error.stack);
      next(error);
    }
  }

  // Get order by ID
  static async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const order = await Order.findOne({
        where: { id, tenant_id: tenantId },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email', 'phone', 'address', 'city', 'country', 'tax_id'],
            required: false
          },
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku', 'price', 'unit'],
                required: false
              }
            ],
            required: false
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'first_name', 'last_name', 'email'],
            required: false
          }
        ]
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ order });
    } catch (error) {
      next(error);
    }
  }

  // Generate unique order number
  static generateOrderNumber(tenantId) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  // Create order
  static async createOrder(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { customer_id, items, payment_method, notes } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must have at least one item' });
      }

      // Generate unique order number
      let orderNumber = OrderController.generateOrderNumber(tenantId);
      let exists = await Order.findOne({ where: { order_number: orderNumber } });
      while (exists) {
        orderNumber = OrderController.generateOrderNumber(tenantId);
        exists = await Order.findOne({ where: { order_number: orderNumber } });
      }

      // Calculate totals
      let totalAmount = 0;
      let taxAmount = 0;
      let discountAmount = 0;

      // Validate and calculate item totals
      const orderItems = [];
      for (const item of items) {
        if (!item.product_id || !item.quantity) {
          return res.status(400).json({ error: 'Each item must have product_id and quantity' });
        }

        const product = await Product.findOne({
          where: { id: item.product_id, tenant_id: tenantId }
        });

        if (!product) {
          return res.status(404).json({ error: `Product ${item.product_id} not found` });
        }

        const quantity = parseInt(item.quantity);
        const unitPrice = parseFloat(item.unit_price || product.price || 0);
        const itemTaxRate = parseFloat(item.tax_rate || product.tax_rate || 0);
        const itemDiscount = parseFloat(item.discount || 0);

        const subtotal = quantity * unitPrice;
        const itemDiscountAmount = subtotal * (itemDiscount / 100);
        const itemSubtotalAfterDiscount = subtotal - itemDiscountAmount;
        const itemTax = itemSubtotalAfterDiscount * (itemTaxRate / 100);

        totalAmount += itemSubtotalAfterDiscount;
        taxAmount += itemTax;
        discountAmount += itemDiscountAmount;

        orderItems.push({
          tenant_id: tenantId,
          product_id: item.product_id,
          quantity,
          unit_price: unitPrice,
          subtotal: itemSubtotalAfterDiscount + itemTax,
          tax_rate: itemTaxRate,
          tax_amount: itemTax,
          discount: itemDiscount,
          notes: item.notes || null
        });
      }

      const finalTotal = totalAmount + taxAmount;

      // Create order
      const order = await Order.create({
        tenant_id: tenantId,
        order_number: orderNumber,
        customer_id: customer_id || null,
        order_date: new Date(),
        status: 'pending',
        total_amount: finalTotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        payment_method: payment_method || null,
        payment_status: 'pending',
        notes: notes || null,
        created_by: req.user.id
      });

      // Create order items
      for (const item of orderItems) {
        await OrderItem.create({
          ...item,
          order_id: order.id
        });
      }

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CREATE_ORDER',
        entity_type: 'Order',
        entity_id: order.id,
        new_values: order.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Order ${orderNumber} created`
      });

      // Fetch order with relations
      const createdOrder = await Order.findOne({
        where: { id: order.id },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email'],
            required: false
          },
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku'],
                required: false
              }
            ],
            required: false
          }
        ]
      });

      // Send notification for new order (non-blocking)
      OrderController._sendOrderUpdateNotification(createdOrder, null, 'pending', tenantId, [req.user.id]).catch(err => {
        console.error('Error sending order creation notification:', err);
      });

      res.status(201).json({
        message: 'Order created successfully',
        order: createdOrder
      });
    } catch (error) {
      console.error('[OrderController] Error in createOrder:', error);
      console.error('[OrderController] Error stack:', error.stack);
      next(error);
    }
  }

  // Helper method to get default warehouse for tenant
  static async _getDefaultWarehouse(tenantId) {
    const warehouse = await Warehouse.findOne({
      where: {
        tenant_id: tenantId,
        status: 'active'
      },
      order: [['created_at', 'ASC']] // Get first created warehouse
    });

    if (!warehouse) {
      throw new Error('No active warehouse found for tenant. Please create a warehouse first.');
    }

    return warehouse;
  }

  // Helper method to deduct inventory when order is completed
  static async _deductInventoryFromOrder(order, tenantId, userId) {
    try {
      // Check if inventory was already deducted for this order
      const existingMovements = await StockMovement.findOne({
        where: {
          tenant_id: tenantId,
          reference_id: order.id,
          reference_type: 'ORDER',
          type: 'out'
        }
      });

      if (existingMovements) {
        return; // Already deducted, skip
      }

      // Get default warehouse
      const warehouse = await OrderController._getDefaultWarehouse(tenantId);

      // Get order items with products
      const orderItems = await OrderItem.findAll({
        where: { order_id: order.id, tenant_id: tenantId },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku']
          }
        ]
      });

      // Deduct inventory for each order item
      for (const item of orderItems) {
        // Find or create inventory record
        const [inventory, created] = await Inventory.findOrCreate({
          where: {
            tenant_id: tenantId,
            product_id: item.product_id,
            warehouse_id: warehouse.id
          },
          defaults: {
            tenant_id: tenantId,
            product_id: item.product_id,
            warehouse_id: warehouse.id,
            quantity: 0,
            last_updated: new Date()
          }
        });

        const oldQuantity = inventory.quantity;
        const quantityToDeduct = parseInt(item.quantity);

        // Check if enough stock is available
        if (oldQuantity < quantityToDeduct) {
          // Continue anyway - allow negative inventory or handle as needed
        }

        // Deduct quantity
        const newQuantity = Math.max(0, oldQuantity - quantityToDeduct);
        inventory.quantity = newQuantity;
        inventory.last_updated = new Date();
        await inventory.save();

        // Create stock movement record
        await StockMovement.create({
          tenant_id: tenantId,
          product_id: item.product_id,
          warehouse_id: warehouse.id,
          type: 'out',
          quantity: quantityToDeduct,
          reference_id: order.id,
          reference_type: 'ORDER',
          notes: `Stock deducted for order ${order.order_number} - Product: ${item.product?.name || item.product_id}, Quantity: ${quantityToDeduct}`,
          created_by: userId
        });
      }
    } catch (error) {
      console.error('[OrderController] Error deducting inventory:', error);
      // Don't throw - log error but don't fail the order completion
      // In production, you might want to handle this differently
    }
  }

  // Helper method to void receipts associated with an order
  static async _voidReceiptsForOrder(order, tenantId, userId, reason) {
    try {
      // Find all active receipts for this order
      const receipts = await Receipt.findAll({
        where: {
          tenant_id: tenantId,
          order_id: order.id,
          status: 'active'
        }
      });

      // Void each receipt
      for (const receipt of receipts) {
        try {
          await ReceiptService.voidReceipt(receipt.id, tenantId, userId, reason || `Order ${order.order_number} was ${order.status}`);
        } catch (error) {
          console.error(`[OrderController] Error voiding receipt ${receipt.receipt_number}:`, error);
          // Continue with other receipts even if one fails
        }
      }
    } catch (error) {
      console.error('[OrderController] Error voiding receipts for order:', error);
      // Don't throw - log error but don't fail the order cancellation
    }
  }

  // Helper method to restore inventory when order is cancelled
  static async _restoreInventoryFromOrder(order, tenantId, userId) {
    try {
      // Only restore if order was previously completed
      // Check if there are stock movements for this order
      const stockMovements = await StockMovement.findAll({
        where: {
          tenant_id: tenantId,
          reference_id: order.id,
          reference_type: 'ORDER',
          type: 'out'
        }
      });

      if (stockMovements.length === 0) {
        // No stock was deducted, nothing to restore
        return;
      }

      // Get order items
      const orderItems = await OrderItem.findAll({
        where: { order_id: order.id, tenant_id: tenantId },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku']
          }
        ]
      });

      // Restore inventory for each order item
      for (const item of orderItems) {
        // Find the stock movement for this product
        const movement = stockMovements.find(m => m.product_id === item.product_id);
        if (!movement) continue;

        // Find inventory record
        const inventory = await Inventory.findOne({
          where: {
            tenant_id: tenantId,
            product_id: item.product_id,
            warehouse_id: movement.warehouse_id
          }
        });

        if (inventory) {
          const oldQuantity = inventory.quantity;
          const quantityToRestore = parseInt(item.quantity);
          const newQuantity = oldQuantity + quantityToRestore;

          inventory.quantity = newQuantity;
          inventory.last_updated = new Date();
          await inventory.save();

          // Create stock movement record for return
          await StockMovement.create({
            tenant_id: tenantId,
            product_id: item.product_id,
            warehouse_id: movement.warehouse_id,
            type: 'return',
            quantity: quantityToRestore,
            reference_id: order.id,
            reference_type: 'ORDER_CANCELLATION',
            notes: `Stock restored for cancelled order ${order.order_number} - Product: ${item.product?.name || item.product_id}, Quantity: ${quantityToRestore}`,
            created_by: userId
          });
        }
      }
    } catch (error) {
      console.error('[OrderController] Error restoring inventory:', error);
      // Don't throw - log error but don't fail the order cancellation
    }
  }

  // Helper method to send order update notifications
  static async _sendOrderUpdateNotification(order, oldStatus, newStatus, tenantId, specificUserIds = null) {
    try {
      // Get users to notify
      let userIds = specificUserIds;
      
      if (!userIds) {
        // Get all active users with order updates enabled
        const users = await User.findAll({
          where: {
            tenant_id: tenantId,
            status: 'active'
          },
          attributes: ['id']
        });

        // Filter users with orderUpdates enabled
        userIds = users
          .filter(user => {
            const prefs = user.notification_preferences || {};
            return prefs.orderUpdates === true;
          })
          .map(user => user.id);

        // Always include order creator
        if (order.created_by && !userIds.includes(order.created_by)) {
          userIds.push(order.created_by);
        }
      }

      if (userIds.length === 0) {
        return; // No users to notify
      }

      // Send notifications
      await NotificationService.sendOrderUpdate({
        order,
        oldStatus: oldStatus || 'new',
        newStatus,
        userIds
      });
    } catch (error) {
      console.error('Error in _sendOrderUpdateNotification:', error);
      // Don't throw - this is a background operation
    }
  }

  // Update order
  static async updateOrder(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const { status, payment_status, payment_method, notes } = req.body;

      const order = await Order.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const oldValues = order.toJSON();
      const oldStatus = order.status;

      if (status) order.status = status;
      if (payment_status) order.payment_status = payment_status;
      if (payment_method !== undefined) order.payment_method = payment_method;
      if (notes !== undefined) order.notes = notes;

      await order.save();

      // Handle inventory changes based on status transitions
      if (status && status !== oldStatus) {
        // If order is being completed, deduct inventory
        if (status === 'completed' && oldStatus !== 'completed') {
          await OrderController._deductInventoryFromOrder(order, tenantId, req.user.id);
        }
        // If order is being cancelled or refunded and was previously completed, restore inventory
        else if ((status === 'cancelled' || status === 'refunded') && oldStatus === 'completed') {
          await OrderController._restoreInventoryFromOrder(order, tenantId, req.user.id);
          // Void receipts when order is cancelled or refunded
          await OrderController._voidReceiptsForOrder(order, tenantId, req.user.id, `Order ${order.order_number} status changed to ${status}`);
        }
        // If order status changes from completed to something else (not cancelled/refunded), restore inventory
        else if (oldStatus === 'completed' && status !== 'completed' && status !== 'cancelled' && status !== 'refunded') {
          await OrderController._restoreInventoryFromOrder(order, tenantId, req.user.id);
          // Void receipts when order status changes from completed
          await OrderController._voidReceiptsForOrder(order, tenantId, req.user.id, `Order ${order.order_number} status changed from completed to ${status}`);
        }
      }

      // Reload order with customer for notifications
      await order.reload({
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'UPDATE_ORDER',
        entity_type: 'Order',
        entity_id: id,
        old_values: oldValues,
        new_values: order.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Order ${order.order_number} updated`
      });

      // Send notification if status changed (non-blocking)
      if (status && status !== oldStatus) {
        OrderController._sendOrderUpdateNotification(order, oldStatus, status, tenantId).catch(err => {
          console.error('Error sending order update notification:', err);
          // Don't fail the request if notification fails
        });
      }

      res.json({
        message: 'Order updated successfully',
        order
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel order
  static async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const order = await Order.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status === 'cancelled') {
        return res.status(400).json({ error: 'Order is already cancelled' });
      }

      const oldValues = order.toJSON();
      const oldStatus = order.status;
      order.status = 'cancelled';
      await order.save();

      // Restore inventory if order was previously completed
      if (oldStatus === 'completed') {
        await OrderController._restoreInventoryFromOrder(order, tenantId, req.user.id);
      }

      // Void any receipts associated with this order
      await OrderController._voidReceiptsForOrder(order, tenantId, req.user.id, `Order ${order.order_number} was cancelled`);

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CANCEL_ORDER',
        entity_type: 'Order',
        entity_id: id,
        old_values: oldValues,
        new_values: order.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Order ${order.order_number} cancelled`
      });

      res.json({
        message: 'Order cancelled successfully',
        order
      });
    } catch (error) {
      next(error);
    }
  }

  // Get orders by product ID
  static async getOrdersByProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const tenantId = req.tenantId;
      const { limit = 10 } = req.query;

      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      // Get orders that contain this product
      const orders = await Order.findAll({
        where: { tenant_id: tenantId, status: 'completed' },
        include: [
          {
            model: OrderItem,
            as: 'items',
            where: { product_id: productId },
            attributes: ['quantity', 'unit_price'],
            required: true
          },
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name'],
            required: false
          }
        ],
        order: [['order_date', 'DESC']],
        limit: parseInt(limit),
        distinct: true
      });

      // Format response with order numbers and dates
      const orderHistory = orders.map(order => ({
        order_number: order.order_number,
        order_date: order.order_date,
        customer_name: order.customer?.name || 'Walk-in',
        quantity: order.items[0]?.quantity || 0,
        unit_price: order.items[0]?.unit_price || 0
      }));

      res.json({
        product_id: productId,
        orders: orderHistory,
        count: orderHistory.length
      });
    } catch (error) {
      console.error('[OrderController] Error in getOrdersByProduct:', error);
      next(error);
    }
  }

  // Complete order
  static async completeOrder(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const order = await Order.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status === 'completed') {
        return res.status(400).json({ error: 'Order is already completed' });
      }

      const oldValues = order.toJSON();
      const oldStatus = order.status;
      order.status = 'completed';
      if (order.payment_status === 'pending') {
        order.payment_status = 'paid';
      }
      await order.save();

      // Deduct inventory from store
      await OrderController._deductInventoryFromOrder(order, tenantId, req.user.id);

      // Reload order with customer for notifications
      await order.reload({
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'COMPLETE_ORDER',
        entity_type: 'Order',
        entity_id: id,
        old_values: oldValues,
        new_values: order.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Order ${order.order_number} completed`
      });

      // Send notification (non-blocking)
      OrderController._sendOrderUpdateNotification(order, oldStatus, 'completed', tenantId).catch(err => {
        console.error('Error sending order update notification:', err);
        // Don't fail the request if notification fails
      });

      res.json({
        message: 'Order completed successfully',
        order
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;

