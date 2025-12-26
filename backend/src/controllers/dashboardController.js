const { Op, literal, fn, col } = require('sequelize');
const { Product, Order, Receipt, Customer, Inventory, Tenant } = require('../models/index');
const { sequelize } = require('../config/database');

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

      // Get total receipts (count all non-voided receipts)
      const totalReceipts = await Receipt.count({
        where: {
          tenant_id: tenantId,
          status: { [Op.notIn]: ['voided', 'cancelled'] }
        }
      });

      // Calculate total revenue from receipts (include all non-voided receipts)
      const revenueResult = await Receipt.findAll({
        where: {
          tenant_id: tenantId,
          status: { [Op.notIn]: ['voided', 'cancelled'] }
        },
        attributes: [
          [fn('SUM', col('total_amount')), 'total_revenue']
        ],
        raw: true
      });

      const receiptRevenue = revenueResult[0]?.total_revenue 
        ? parseFloat(revenueResult[0].total_revenue) 
        : 0;

      // Also include completed orders without receipts (sales that haven't generated receipts yet)
      const ordersWithoutReceiptsRevenue = await sequelize.query(
        `SELECT COALESCE(SUM(o.total_amount), 0) as total
         FROM orders o
         LEFT JOIN receipts r ON o.id = r.order_id AND (r.status IS NULL OR (r.status != 'voided' AND r.status != 'cancelled'))
         WHERE o.tenant_id = :tenantId
           AND o.status = 'completed'
           AND r.id IS NULL`,
        {
          replacements: { tenantId },
          type: sequelize.QueryTypes.SELECT
        }
      );

      const orderRevenue = parseFloat(ordersWithoutReceiptsRevenue[0]?.total || 0);
      const totalRevenue = receiptRevenue + orderRevenue;

      // Get tenant settings for low stock threshold
      const tenant = await Tenant.findByPk(tenantId);
      const defaultThreshold = 10;
      const lowStockThreshold = tenant?.settings?.lowStockThreshold ?? defaultThreshold;

      // Get low stock products count (products with stock below threshold)
      // Using raw query for better performance
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
         LEFT JOIN receipts r ON o.id = r.order_id AND (r.status IS NULL OR (r.status != 'voided' AND r.status != 'cancelled'))
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

      // Get today's revenue from receipts (all non-voided)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const todayRevenueResult = await Receipt.findAll({
        where: {
          tenant_id: tenantId,
          status: { [Op.notIn]: ['voided', 'cancelled'] },
          issue_date: {
            [Op.between]: [today, todayEnd]
          }
        },
        attributes: [
          [fn('SUM', col('total_amount')), 'today_revenue']
        ],
        raw: true
      });

      const todayReceiptRevenue = todayRevenueResult[0]?.today_revenue 
        ? parseFloat(todayRevenueResult[0].today_revenue) 
        : 0;

      // Also include today's completed orders without receipts
      const todayOrdersRevenue = await sequelize.query(
        `SELECT COALESCE(SUM(o.total_amount), 0) as total
         FROM orders o
         LEFT JOIN receipts r ON o.id = r.order_id AND (r.status IS NULL OR (r.status != 'voided' AND r.status != 'cancelled'))
         WHERE o.tenant_id = :tenantId
           AND o.status = 'completed'
           AND o.order_date >= :todayStart
           AND o.order_date <= :todayEnd
           AND r.id IS NULL`,
        {
          replacements: { 
            tenantId, 
            todayStart: today.toISOString(),
            todayEnd: todayEnd.toISOString()
          },
          type: sequelize.QueryTypes.SELECT
        }
      );

      const todayOrderRevenue = parseFloat(todayOrdersRevenue[0]?.total || 0);
      const todayRevenue = todayReceiptRevenue + todayOrderRevenue;

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

  // Get chart data for dashboard
  static async getChartData(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const { period = '30' } = req.query; // Default to last 30 days
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // Revenue by date (last N days) - include all non-voided receipts
      const revenueByDate = await Receipt.findAll({
        where: {
          tenant_id: tenantId,
          status: { [Op.notIn]: ['voided', 'cancelled'] },
          issue_date: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          [fn('DATE', col('issue_date')), 'date'],
          [fn('SUM', col('total_amount')), 'revenue'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: [fn('DATE', col('issue_date'))],
        order: [[fn('DATE', col('issue_date')), 'ASC']],
        raw: true
      });

      // Orders by date (last N days)
      const ordersByDate = await Order.findAll({
        where: {
          tenant_id: tenantId,
          order_date: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          [fn('DATE', col('order_date')), 'date'],
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('total_amount')), 'revenue']
        ],
        group: [fn('DATE', col('order_date'))],
        order: [[fn('DATE', col('order_date')), 'ASC']],
        raw: true
      });

      // Orders by status
      const ordersByStatus = await Order.findAll({
        where: {
          tenant_id: tenantId,
          order_date: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          'status',
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('total_amount')), 'revenue']
        ],
        group: ['status'],
        raw: true
      });

      // Payment methods distribution - include all non-voided receipts
      // Use COALESCE to handle null payment_method values
      const paymentMethods = await sequelize.query(
        `SELECT 
          COALESCE(payment_method, 'not_specified') as payment_method,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM receipts
        WHERE tenant_id = :tenantId
          AND status NOT IN ('voided', 'cancelled')
          AND issue_date >= :startDate
        GROUP BY payment_method
        ORDER BY count DESC`,
        {
          replacements: { tenantId, startDate: startDate.toISOString() },
          type: sequelize.QueryTypes.SELECT
        }
      );

      res.json({
        revenueByDate: revenueByDate || [],
        ordersByDate: ordersByDate || [],
        ordersByStatus: ordersByStatus || [],
        paymentMethods: paymentMethods || [],
      });
    } catch (error) {
      console.error('[DashboardController] Error getting chart data:', error);
      next(error);
    }
  }
}

module.exports = DashboardController;

