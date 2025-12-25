const Warehouse = require('../models/Warehouse');
const AuditService = require('../services/auditService');

class WarehouseController {
  // Get all warehouses
  static async getAllWarehouses(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { page = 1, limit = 50, search } = req.query;

      const where = { tenant_id: tenantId };
      if (search) {
        where[require('sequelize').Op.or] = [
          { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
          { address: { [require('sequelize').Op.iLike]: `%${search}%` } }
        ];
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Warehouse.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        warehouses: rows,
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

  // Get warehouse by ID
  static async getWarehouseById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const warehouse = await Warehouse.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }

      res.json({ warehouse });
    } catch (error) {
      next(error);
    }
  }

  // Create warehouse
  static async createWarehouse(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { name, location, address, manager_id } = req.body;
      const Tenant = require('../models/Tenant');

      if (!name) {
        return res.status(400).json({ error: 'Warehouse name is required' });
      }

      // Check tenant's warehouse limit
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const currentWarehouseCount = await Warehouse.count({ 
        where: { tenant_id: tenantId, status: 'active' } 
      });
      
      if (currentWarehouseCount >= tenant.max_warehouses) {
        return res.status(403).json({
          error: 'Warehouse limit reached',
          message: `This tenant is limited to ${tenant.max_warehouses} warehouse${tenant.max_warehouses === 1 ? '' : 's'}. Please upgrade your plan or deactivate existing warehouses.`
        });
      }

      const warehouse = await Warehouse.create({
        tenant_id: tenantId,
        name,
        location: location || null,
        address: address || null,
        manager_id: manager_id || null,
        status: 'active'
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CREATE_WAREHOUSE',
        entity_type: 'Warehouse',
        entity_id: warehouse.id,
        new_values: warehouse.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Warehouse "${name}" created`
      });

      res.status(201).json({
        message: 'Warehouse created successfully',
        warehouse
      });
    } catch (error) {
      next(error);
    }
  }

  // Update warehouse
  static async updateWarehouse(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const warehouse = await Warehouse.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }

      const oldValues = { ...warehouse.toJSON() };

      const allowedFields = ['name', 'location', 'address', 'manager_id', 'status'];
      const updateData = {};
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      await warehouse.update(updateData);

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'UPDATE_WAREHOUSE',
        entity_type: 'Warehouse',
        entity_id: id,
        old_values: oldValues,
        new_values: updateData,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Warehouse "${warehouse.name}" updated`
      });

      res.json({
        message: 'Warehouse updated successfully',
        warehouse
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete warehouse
  static async deleteWarehouse(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const warehouse = await Warehouse.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }

      await warehouse.destroy();

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'DELETE_WAREHOUSE',
        entity_type: 'Warehouse',
        entity_id: id,
        old_values: warehouse.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Warehouse "${warehouse.name}" deleted`
      });

      res.json({ message: 'Warehouse deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = WarehouseController;

