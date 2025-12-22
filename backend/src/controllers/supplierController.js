const Supplier = require('../models/Supplier');
const AuditService = require('../services/auditService');

class SupplierController {
  // Get all suppliers
  static async getAllSuppliers(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { page = 1, limit = 50, search } = req.query;

      const where = { tenant_id: tenantId };
      if (search) {
        where[require('sequelize').Op.or] = [
          { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
          { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
          { contact_person: { [require('sequelize').Op.iLike]: `%${search}%` } }
        ];
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Supplier.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        suppliers: rows,
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

  // Get supplier by ID
  static async getSupplierById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const supplier = await Supplier.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      res.json({ supplier });
    } catch (error) {
      next(error);
    }
  }

  // Create supplier
  static async createSupplier(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { name, contact_person, email, phone, address, city, state_province, zip_postal_code, country } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Supplier name is required' });
      }

      const supplier = await Supplier.create({
        tenant_id: tenantId,
        name,
        contact_person: contact_person || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        status: 'active'
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CREATE_SUPPLIER',
        entity_type: 'Supplier',
        entity_id: supplier.id,
        new_values: supplier.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Supplier "${name}" created`
      });

      res.status(201).json({
        message: 'Supplier created successfully',
        supplier
      });
    } catch (error) {
      next(error);
    }
  }

  // Update supplier
  static async updateSupplier(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const supplier = await Supplier.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      const oldValues = { ...supplier.toJSON() };

      const allowedFields = ['name', 'contact_person', 'email', 'phone', 'address', 'status'];
      const updateData = {};
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      await supplier.update(updateData);

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'UPDATE_SUPPLIER',
        entity_type: 'Supplier',
        entity_id: id,
        old_values: oldValues,
        new_values: updateData,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Supplier "${supplier.name}" updated`
      });

      res.json({
        message: 'Supplier updated successfully',
        supplier
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete supplier
  static async deleteSupplier(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const supplier = await Supplier.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      await supplier.destroy();

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'DELETE_SUPPLIER',
        entity_type: 'Supplier',
        entity_id: id,
        old_values: supplier.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Supplier "${supplier.name}" deleted`
      });

      res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SupplierController;

