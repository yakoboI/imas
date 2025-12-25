const { Op, literal, fn, col } = require('sequelize');
const { Product, Order, Receipt, Customer, Inventory, Tenant } = require('../models/index');

class DashboardController {
  // Get dashboard statistics
  static async getDashboardStats(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      // Get total products
      const totalProducts = await Product.count({
        where: { tenant_id: tenantId }
      });

      // Get total quantity (sum of all inventory quantities across all warehouses)
      const totalQuantityResult = await Inventory.findAll({
        where: { tenant_id: tenantId },
        attributes: [
          [fn('SUM', col('quantity')), 'total_quantity']
        ],
        raw: true
      });
      
      const totalQuantity = totalQuantityResult[0]?.total_quantity 
        ? parseInt(totalQuantityResult[0].total_quantity) 
        : 0;

      // Get total orders
      const totalOrders = await Order.count({
        where: { tenant_id: tenantId }
      });

      // Get total receipts (count from Receipt model)
      const totalReceipts = await Receipt.count({
        where: { tenant_id: tenantId }
      });

      // Calculate total revenue from receipts (more accurate than orders)
      const revenueResult = await Receipt.findAll({
        where: {
          tenant_id: tenantId
        },
        attributes: [
          [fn('SUM', col('total_amount')), 'total_revenue']
        ],
        raw: true
      });

      const totalRevenue = revenueResult[0]?.total_revenue 
        ? parseFloat(revenueResult[0].total_revenue) 
        : 0;

      // Get tenant settings for low stock threshold
      const tenant = await Tenant.findByPk(tenantId);
      const defaultThreshold = 10;
      const lowStockThreshold = tenant?.settings?.lowStockThreshold ?? defaultThreshold;

      // Get low stock products count (products with stock below threshold)
      // Using raw query for better performance
      const { sequelize } = require('../config/database');
      const lowStockResult = await sequelize.query(
        `SELECT COUNT(DISTINCT i.product_id) as count
         FROM inventory i
         INNER JOIN products p ON i.product_id = p.id
         WHERE i.tenant_id = :tenantId
         AND p.tenant_id = :tenantId
         AND p.status = 'active'
         AND i.quantity > 0
         AND i.quantity < :threshold`,
        {
          replacements: { tenantId, threshold: lowStockThreshold },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      const lowStockProducts = lowStockResult[0]?.count 
        ? parseInt(lowStockResult[0].count, 10) 
        : 0;

      // Get pending orders count
      const pendingOrders = await Order.count({
        where: {
          tenant_id: tenantId,
          status: 'pending'
        }
      });

      // Get completed orders without receipts (sales that need receipts)
      const ordersWithoutReceiptsResult = await sequelize.query(
        `SELECT COUNT(DISTINCT o.id) as count
         FROM orders o
         LEFT JOIN receipts r ON o.id = r.order_id AND r.status = 'active'
         WHERE o.tenant_id = :tenantId
         AND o.status = 'completed'
         AND r.id IS NULL`,
        {
          replacements: { tenantId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      const ordersWithoutReceipts = ordersWithoutReceiptsResult[0]?.count 
        ? parseInt(ordersWithoutReceiptsResult[0].count, 10) 
        : 0;

      // Get total customers
      const totalCustomers = await Customer.count({
        where: { tenant_id: tenantId }
      });

      // Get today's revenue from receipts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRevenueResult = await Receipt.findAll({
        where: {
          tenant_id: tenantId,
          issue_date: {
            [Op.gte]: today
          }
        },
        attributes: [
          [fn('SUM', col('total_amount')), 'today_revenue']
        ],
        raw: true
      });

      const todayRevenue = todayRevenueResult[0]?.today_revenue 
        ? parseFloat(todayRevenueResult[0].today_revenue) 
        : 0;

      res.json({
        stats: {
          totalProducts,
          totalQuantity,
          totalOrders,
          totalReceipts,
          totalRevenue: totalRevenue.toFixed(2),
          totalCustomers,
          pendingOrders,
          ordersWithoutReceipts,
          lowStockProducts,
          todayRevenue: todayRevenue.toFixed(2)
        }
      });
    } catch (error) {
      console.error('[DashboardController] Error getting dashboard stats:', error);
      next(error);
    }
  }
}

module.exports = DashboardController;

