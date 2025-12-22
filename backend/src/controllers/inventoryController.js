const { Op } = require('sequelize');
const { Inventory, Product, Warehouse, StockMovement, Tenant } = require('../models/index');
const AuditService = require('../services/auditService');

class InventoryController {
  // Get all inventory items
  static async getAllInventory(req, res, next) {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const { page = 1, limit = 50, search, product_id, warehouse_id } = req.query;

      const where = { tenant_id: tenantId };

      if (product_id) {
        where.product_id = product_id;
      }

      if (warehouse_id) {
        where.warehouse_id = warehouse_id;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Inventory.findAndCountAll({
        where,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'unit'],
            required: false
          },
          {
            model: Warehouse,
            as: 'warehouse',
            attributes: ['id', 'name', 'location'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['last_updated', 'DESC']],
        distinct: true // Important for count with includes
      });

      // Filter by search term if provided
      let filteredRows = rows;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredRows = rows.filter(item => 
          item.product?.name?.toLowerCase().includes(searchLower) ||
          item.warehouse?.name?.toLowerCase().includes(searchLower) ||
          item.product?.sku?.toLowerCase().includes(searchLower)
        );
      }

      // Get tenant settings for low stock threshold
      const tenant = await Tenant.findByPk(tenantId);
      const defaultThreshold = 10;
      const lowStockThreshold = tenant?.settings?.lowStockThreshold ?? defaultThreshold;

      res.json({
        inventory: filteredRows,
        lowStockThreshold,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('[InventoryController] Error in getAllInventory:', error);
      console.error('[InventoryController] Error stack:', error.stack);
      console.error('[InventoryController] Error details:', {
        message: error.message,
        name: error.name,
        tenantId: req.tenantId
      });
      next(error);
    }
  }

  // Get inventory statistics
  static async getInventoryStats(req, res, next) {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      // Get tenant settings for low stock threshold
      const tenant = await Tenant.findByPk(tenantId);
      const defaultThreshold = 10;
      const lowStockThreshold = tenant?.settings?.lowStockThreshold ?? defaultThreshold;

      // Get total inventory items count
      const totalItems = await Inventory.count({
        where: { tenant_id: tenantId }
      });

      // Get low stock items count (quantity > 0 and < threshold)
      const lowStockItems = await Inventory.count({
        where: {
          tenant_id: tenantId,
          quantity: {
            [Op.gt]: 0,
            [Op.lt]: lowStockThreshold
          }
        }
      });

      // Get out of stock items count (quantity = 0)
      const outOfStockItems = await Inventory.count({
        where: {
          tenant_id: tenantId,
          quantity: 0
        }
      });

      res.json({
        stats: {
          totalItems,
          lowStockItems,
          outOfStockItems,
          lowStockThreshold
        }
      });
    } catch (error) {
      console.error('[InventoryController] Error in getInventoryStats:', error);
      next(error);
    }
  }

  // Get inventory by ID
  static async getInventoryById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const inventory = await Inventory.findOne({
        where: { id, tenant_id: tenantId },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'unit'],
            required: false
          },
          {
            model: Warehouse,
            as: 'warehouse',
            attributes: ['id', 'name', 'location'],
            required: false
          }
        ]
      });

      if (!inventory) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      res.json({ inventory });
    } catch (error) {
      next(error);
    }
  }

  // Adjust stock (create or update inventory)
  static async adjustStock(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { product_id, warehouse_id, quantity, adjustment_type, notes } = req.body;

      if (!product_id || !warehouse_id || quantity === undefined) {
        return res.status(400).json({ error: 'Product ID, Warehouse ID, and quantity are required' });
      }

      // Validate product exists
      const product = await Product.findOne({
        where: { id: product_id, tenant_id: tenantId }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Validate warehouse exists
      const warehouse = await Warehouse.findOne({
        where: { id: warehouse_id, tenant_id: tenantId }
      });

      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }

      // Find or create inventory record
      const [inventory, created] = await Inventory.findOrCreate({
        where: {
          tenant_id: tenantId,
          product_id: product_id,
          warehouse_id: warehouse_id
        },
        defaults: {
          tenant_id: tenantId,
          product_id: product_id,
          warehouse_id: warehouse_id,
          quantity: 0,
          last_updated: new Date()
        }
      });

      const oldQuantity = inventory.quantity;
      let newQuantity;

      // Calculate new quantity based on adjustment type
      if (adjustment_type === 'set') {
        // Set to specific quantity
        newQuantity = parseInt(quantity);
      } else if (adjustment_type === 'add') {
        // Add to current quantity
        newQuantity = oldQuantity + parseInt(quantity);
      } else if (adjustment_type === 'subtract') {
        // Subtract from current quantity
        newQuantity = Math.max(0, oldQuantity - parseInt(quantity));
      } else {
        // Default: set to quantity
        newQuantity = parseInt(quantity);
      }

      // Update inventory
      inventory.quantity = newQuantity;
      inventory.last_updated = new Date();
      await inventory.save();

      // Log stock movement
      const movementType = adjustment_type === 'add' ? 'in' : 
                          adjustment_type === 'subtract' ? 'out' : 
                          'adjustment';

      await StockMovement.create({
        tenant_id: tenantId,
        product_id: product_id,
        warehouse_id: warehouse_id,
        type: movementType,
        quantity: Math.abs(newQuantity - oldQuantity),
        reference_type: 'MANUAL_ADJUSTMENT',
        notes: notes || `Stock ${adjustment_type || 'adjusted'} from ${oldQuantity} to ${newQuantity}`,
        created_by: req.user.id
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'ADJUST_INVENTORY',
        entity_type: 'Inventory',
        entity_id: inventory.id,
        old_values: { quantity: oldQuantity },
        new_values: { quantity: newQuantity },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Inventory adjusted: ${product.name} in ${warehouse.name} from ${oldQuantity} to ${newQuantity}`
      });

      // Fetch updated inventory with relations
      const updatedInventory = await Inventory.findOne({
        where: { id: inventory.id },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'unit'],
            required: false
          },
          {
            model: Warehouse,
            as: 'warehouse',
            attributes: ['id', 'name', 'location'],
            required: false
          }
        ]
      });

      res.json({
        message: 'Stock adjusted successfully',
        inventory: updatedInventory
      });
    } catch (error) {
      console.error('[InventoryController] Error in adjustStock:', error);
      next(error);
    }
  }
}

module.exports = InventoryController;

