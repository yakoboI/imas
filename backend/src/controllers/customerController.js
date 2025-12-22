const Customer = require('../models/Customer');
const Order = require('../models/Order');
const AuditService = require('../services/auditService');
const { sequelize, Sequelize } = require('../config/database');
const { Op } = require('sequelize');

class CustomerController {
  // Get all customers
  static async getAllCustomers(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { page = 1, limit = 50, search } = req.query;

      const where = { tenant_id: tenantId };
      if (search) {
        where[require('sequelize').Op.or] = [
          { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
          { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
          { phone: { [require('sequelize').Op.iLike]: `%${search}%` } }
        ];
      }

      const offset = (page - 1) * limit;

      // Get customers
      const { count, rows } = await Customer.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      // Get order counts for all customers in this page
      const customerIds = rows.map(c => c.id);
      const orderCounts = await Order.findAll({
        where: {
          customer_id: { [Op.in]: customerIds },
          tenant_id: tenantId
        },
        attributes: [
          'customer_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['customer_id'],
        raw: true
      });

      // Create a map of customer_id -> order_count
      const orderCountMap = {};
      orderCounts.forEach(item => {
        orderCountMap[item.customer_id] = parseInt(item.count) || 0;
      });

      // Add order counts to customers
      const customersWithOrderCount = rows.map(customer => {
        const customerData = customer.toJSON();
        customerData.total_orders = orderCountMap[customer.id] || 0;
        return customerData;
      });

      res.json({
        customers: customersWithOrderCount,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get customer by ID
  static async getCustomerById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const customer = await Customer.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json({ customer });
    } catch (error) {
      next(error);
    }
  }

  // Create customer
  static async createCustomer(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { name, email, phone, address, city, state_province, zip_postal_code, country, tax_id } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Customer name is required' });
      }

      const customer = await Customer.create({
        tenant_id: tenantId,
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        country: country || null,
        tax_id: tax_id || null,
        status: 'active'
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CREATE_CUSTOMER',
        entity_type: 'Customer',
        entity_id: customer.id,
        new_values: customer.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Customer "${name}" created`
      });

      res.status(201).json({
        message: 'Customer created successfully',
        customer
      });
    } catch (error) {
      next(error);
    }
  }

  // Update customer
  static async updateCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const customer = await Customer.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const oldValues = { ...customer.toJSON() };

      const allowedFields = ['name', 'email', 'phone', 'address', 'city', 'country', 'tax_id', 'status'];
      const updateData = {};
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      await customer.update(updateData);

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'UPDATE_CUSTOMER',
        entity_type: 'Customer',
        entity_id: id,
        old_values: oldValues,
        new_values: updateData,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Customer "${customer.name}" updated`
      });

      res.json({
        message: 'Customer updated successfully',
        customer
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete customer
  static async deleteCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const customer = await Customer.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      await customer.destroy();

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'DELETE_CUSTOMER',
        entity_type: 'Customer',
        entity_id: id,
        old_values: customer.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Customer "${customer.name}" deleted`
      });

      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CustomerController;

