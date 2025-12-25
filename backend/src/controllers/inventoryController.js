const { Op } = require('sequelize');
const { Inventory, Product, Warehouse, StockMovement, Tenant, User } = require('../models/index');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');

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

      // Validate quantity is a valid number
      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum)) {
        return res.status(400).json({ error: 'Quantity must be a valid number' });
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
        newQuantity = quantityNum;
      } else if (adjustment_type === 'add') {
        // Add to current quantity
        newQuantity = oldQuantity + quantityNum;
      } else if (adjustment_type === 'subtract') {
        // Subtract from current quantity
        newQuantity = Math.max(0, oldQuantity - quantityNum);
      } else {
        // Default: set to quantity
        newQuantity = quantityNum;
      }

      // Ensure newQuantity is a valid integer
      newQuantity = Math.floor(newQuantity);
      if (newQuantity < 0) {
        newQuantity = 0;
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
      let updatedInventory;
      try {
        updatedInventory = await Inventory.findOne({
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
      } catch (err) {
        console.error('Error fetching updated inventory:', err);
        // If fetch fails, use the inventory we just updated
        updatedInventory = inventory;
      }

      // Check for low stock alert (non-blocking) - only if quantity is low
      if (updatedInventory) {
        const reorderLevel = updatedInventory.reorder_level || 10;
        if (newQuantity > 0 && newQuantity <= reorderLevel) {
          InventoryController._checkAndSendLowStockAlert(updatedInventory, tenantId).catch(err => {
            console.error('Error sending low stock alert:', err);
            // Don't fail the request if notification fails
          });
        }
      }

      res.json({
        message: 'Stock adjusted successfully',
        inventory: updatedInventory || inventory
      });
    } catch (error) {
      console.error('[InventoryController] Error in adjustStock:', error);
      next(error);
    }
  }

  // Helper method to check and send low stock alerts
  static async _checkAndSendLowStockAlert(inventory, tenantId) {
    try {
      // Check if alert was already sent today (prevent spam)
      let AlertTracking;
      try {
        AlertTracking = require('../models/AlertTracking');
      } catch (err) {
        // AlertTracking model might not exist, continue without it
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let alertTracking = null;
      if (AlertTracking) {
        try {
          alertTracking = await AlertTracking.findOne({
            where: {
              tenant_id: tenantId,
              inventory_id: inventory.id
            }
          });

          // If alert was sent today, skip
          if (alertTracking && alertTracking.last_alert_sent) {
            const lastAlertDate = new Date(alertTracking.last_alert_sent);
            lastAlertDate.setHours(0, 0, 0, 0);
            if (lastAlertDate.getTime() === today.getTime()) {
              return; // Already sent today
            }
          }
        } catch (err) {
          // Continue without tracking
        }
      }

      // Get users with low stock alerts enabled
      const users = await User.findAll({
        where: {
          tenant_id: tenantId,
          status: 'active'
        },
        attributes: ['id', 'notification_preferences']
      });

      // Filter users with lowStockAlerts enabled
      const userIds = users
        .filter(user => {
          const prefs = user.notification_preferences || {};
          return prefs.lowStockAlerts === true;
        })
        .map(user => user.id);

      if (userIds.length === 0) {
        return; // No users want low stock alerts
      }

      // Send notifications (non-blocking, don't fail if service unavailable)
      if (NotificationService && NotificationService.sendLowStockAlert) {
        await NotificationService.sendLowStockAlert({
          product: inventory.product,
          inventory: inventory,
          warehouse: inventory.warehouse,
          userIds
        }).catch(err => {
          console.error('Error sending low stock notification:', err);
          // Don't throw - notification failure shouldn't break the adjustment
        });
      }

      // Update alert tracking (if model exists)
      if (AlertTracking && alertTracking) {
        try {
          alertTracking.last_alert_sent = new Date();
          alertTracking.alert_count += 1;
          await alertTracking.save();
        } catch (err) {
          // Error updating alert tracking - continue silently
        }
      } else if (AlertTracking) {
        try {
          await AlertTracking.create({
            tenant_id: tenantId,
            inventory_id: inventory.id,
            last_alert_sent: new Date(),
            alert_count: 1
          });
        } catch (err) {
          // Error creating alert tracking - continue silently
        }
      }
    } catch (error) {
      console.error('Error in _checkAndSendLowStockAlert:', error);
      // Don't throw - this is a background operation and shouldn't break stock adjustment
    }
  }
}

module.exports = InventoryController;

