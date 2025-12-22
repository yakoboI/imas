const { Op } = require('sequelize');
const { Order, OrderItem, Product, Customer, User } = require('../models/index');
const AuditService = require('../services/auditService');

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

      if (status) order.status = status;
      if (payment_status) order.payment_status = payment_status;
      if (payment_method !== undefined) order.payment_method = payment_method;
      if (notes !== undefined) order.notes = notes;

      await order.save();

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
      order.status = 'cancelled';
      await order.save();

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
      order.status = 'completed';
      if (order.payment_status === 'pending') {
        order.payment_status = 'paid';
      }
      await order.save();

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

