const { Order, Inventory, Product, Warehouse, User, Tenant } = require('../models');
const NotificationService = require('./notificationService');
const { Op, fn, col, literal } = require('sequelize');

class DailyDigestService {
  /**
   * Generate daily digest report for a user
   */
  static async generateDailyDigest(userId, tenantId, date = null) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Get sales summary
      const sales = await this._getSalesSummary(tenantId, startOfDay, endOfDay);

      // Get orders summary
      const orders = await this._getOrdersSummary(tenantId, startOfDay, endOfDay);

      // Get low stock items
      const lowStockItems = await this._getLowStockItems(tenantId);

      // Get pending tasks
      const pendingTasks = await this._getPendingTasks(tenantId);

      return {
        sales,
        orders,
        lowStockItems,
        pendingTasks
      };
    } catch (error) {
      console.error('Error generating daily digest:', error);
      throw error;
    }
  }

  /**
   * Send daily digest to all users who have it enabled
   */
  static async sendDailyDigestsToAllUsers() {
    try {
      const users = await User.findAll({
        where: {
          status: 'active'
        },
        attributes: ['id', 'tenant_id', 'notification_preferences']
      });

      const results = [];

      for (const user of users) {
        try {
          const prefs = user.notification_preferences || {};
          if (prefs.reportDigests !== true) {
            continue; // Skip users who don't want daily digests
          }

          const digest = await this.generateDailyDigest(user.id, user.tenant_id);
          
          await NotificationService.sendDailyDigest({
            userId: user.id,
            reportData: digest
          });

          results.push({
            userId: user.id,
            success: true
          });
        } catch (error) {
          console.error(`Error sending digest to user ${user.id}:`, error);
          results.push({
            userId: user.id,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending daily digests:', error);
      throw error;
    }
  }

  // Private helper methods
  static async _getSalesSummary(tenantId, startDate, endDate) {
    const orders = await Order.findAll({
      where: {
        tenant_id: tenantId,
        order_date: {
          [Op.between]: [startDate, endDate]
        },
        status: {
          [Op.in]: ['completed', 'processing']
        }
      },
      attributes: [
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('total_amount')), 'total'],
        [fn('SUM', col('tax_amount')), 'tax']
      ],
      raw: true
    });

    const result = orders[0] || { count: 0, total: 0, tax: 0 };
    return {
      count: parseInt(result.count) || 0,
      total: parseFloat(result.total) || 0,
      tax: parseFloat(result.tax) || 0
    };
  }

  static async _getOrdersSummary(tenantId, startDate, endDate) {
    const orders = await Order.findAll({
      where: {
        tenant_id: tenantId,
        order_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['status'],
      raw: true
    });

    const summary = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    return summary;
  }

  static async _getLowStockItems(tenantId) {
    const inventories = await Inventory.findAll({
      where: {
        tenant_id: tenantId
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku'],
          required: true
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name'],
          required: true
        }
      ],
      attributes: ['id', 'quantity', 'reorder_level']
    });

    const lowStock = inventories
      .filter(inv => inv.quantity <= inv.reorder_level)
      .map(inv => ({
        id: inv.product.id,
        name: inv.product.name,
        sku: inv.product.sku,
        quantity: inv.quantity,
        reorderLevel: inv.reorder_level,
        warehouse: inv.warehouse.name
      }));

    return lowStock;
  }

  static async _getPendingTasks(tenantId) {
    const tasks = [];

    // Count pending orders
    const pendingOrders = await Order.count({
      where: {
        tenant_id: tenantId,
        status: 'pending'
      }
    });

    if (pendingOrders > 0) {
      tasks.push(`${pendingOrders} pending order${pendingOrders > 1 ? 's' : ''} to process`);
    }

    // Count low stock items
    const lowStockCount = await Inventory.count({
      where: {
        tenant_id: tenantId
      },
      include: [
        {
          model: Product,
          as: 'product',
          required: true
        }
      ],
      having: literal('quantity <= reorder_level')
    });

    if (lowStockCount > 0) {
      tasks.push(`${lowStockCount} product${lowStockCount > 1 ? 's' : ''} need restocking`);
    }

    return tasks;
  }
}

module.exports = DailyDigestService;

