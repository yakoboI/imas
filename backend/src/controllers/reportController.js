const { Op, fn, col, literal } = require('sequelize');
const { Order, OrderItem, Receipt, ReceiptItem, Product, Customer, Inventory, Category } = require('../models/index');
const { sequelize } = require('../config/database');

class ReportController {
  // Get sales report
  static async getSalesReport(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { startDate, endDate } = req.query;

      const where = { tenant_id: tenantId, status: 'active' };
      const receiptWhere = { tenant_id: tenantId, status: 'active' };

      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter[Op.gte] = new Date(startDate);
        if (endDate) dateFilter[Op.lte] = new Date(endDate);
        receiptWhere.issue_date = dateFilter;
        where.order_date = dateFilter;
      }

      // Total revenue
      const totalRevenue = await Receipt.findAll({
        where: receiptWhere,
        attributes: [[fn('SUM', col('total_amount')), 'total']],
        raw: true
      });

      // Revenue by date (daily)
      const revenueByDate = await Receipt.findAll({
        where: receiptWhere,
        attributes: [
          [fn('DATE', col('issue_date')), 'date'],
          [fn('SUM', col('total_amount')), 'revenue'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: [fn('DATE', col('issue_date'))],
        order: [[fn('DATE', col('issue_date')), 'ASC']],
        raw: true
      });

      // Top products by revenue
      const replacements = { tenantId };
      let dateFilter = '';
      if (startDate) {
        replacements.startDate = startDate;
        dateFilter += ' AND r.issue_date >= :startDate';
      }
      if (endDate) {
        replacements.endDate = endDate;
        dateFilter += ' AND r.issue_date <= :endDate';
      }
      
      const topProductsRaw = await sequelize.query(
        `SELECT 
          ri.product_id,
          p.name as product_name,
          p.sku,
          SUM(ri.subtotal) as revenue,
          SUM(ri.quantity) as quantity
        FROM receipt_items ri
        INNER JOIN receipts r ON ri.receipt_id = r.id
        LEFT JOIN products p ON ri.product_id = p.id
        WHERE r.tenant_id = :tenantId 
          AND r.status = 'active'${dateFilter}
        GROUP BY ri.product_id, p.name, p.sku
        ORDER BY revenue DESC
        LIMIT 10`,
        {
          replacements,
          type: sequelize.QueryTypes.SELECT
        }
      );

      // Top customers by revenue (for sales report)
      const topCustomersRaw = await sequelize.query(
        `SELECT 
          r.customer_id,
          c.name as customer_name,
          c.email,
          SUM(r.total_amount) as revenue,
          COUNT(r.id) as order_count
        FROM receipts r
        LEFT JOIN customers c ON r.customer_id = c.id
        WHERE r.tenant_id = :tenantId 
          AND r.status = 'active'${dateFilter}
        GROUP BY r.customer_id, c.name, c.email
        ORDER BY revenue DESC
        LIMIT 10`,
        {
          replacements,
          type: sequelize.QueryTypes.SELECT
        }
      );

      // Payment method breakdown
      const paymentMethods = await Receipt.findAll({
        where: receiptWhere,
        attributes: [
          'payment_method',
          [fn('SUM', col('total_amount')), 'revenue'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['payment_method'],
        raw: true
      });

      res.json({
        totalRevenue: parseFloat(totalRevenue[0]?.total || 0),
        revenueByDate: revenueByDate.map(r => ({
          date: r.date,
          revenue: parseFloat(r.revenue || 0),
          count: parseInt(r.count || 0)
        })),
        topProducts: topProductsRaw.map(p => ({
          productId: p.product_id,
          productName: p.product_name || 'Unknown',
          sku: p.sku || 'N/A',
          revenue: parseFloat(p.revenue || 0),
          quantity: parseInt(p.quantity || 0)
        })),
        topCustomers: topCustomersRaw.map(c => ({
          customerId: c.customer_id,
          customerName: c.customer_name || 'Walk-in Customer',
          email: c.email || 'N/A',
          revenue: parseFloat(c.revenue || 0),
          orderCount: parseInt(c.order_count || 0)
        })),
        paymentMethods: paymentMethods.map(pm => ({
          method: pm.payment_method || 'Unknown',
          revenue: parseFloat(pm.revenue || 0),
          count: parseInt(pm.count || 0)
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  // Get inventory report
  static async getInventoryReport(req, res, next) {
    try {
      const tenantId = req.tenantId;

      // Total stock value
      const stockValue = await Inventory.findAll({
        include: [
          {
            model: Product,
            as: 'product',
            where: { tenant_id: tenantId, status: 'active' },
            attributes: ['id', 'name', 'sku', 'cost_price', 'selling_price']
          }
        ],
        where: { tenant_id: tenantId },
        attributes: [
          [fn('SUM', literal('quantity * "product"."cost_price"')), 'total_value']
        ],
        raw: true
      });

      // Low stock items
      const lowStockRaw = await sequelize.query(
        `SELECT 
          i.id,
          i.product_id,
          i.quantity,
          i.reorder_level,
          p.name as product_name,
          p.sku,
          p.cost_price,
          p.selling_price
        FROM inventory i
        INNER JOIN products p ON i.product_id = p.id
        WHERE i.tenant_id = :tenantId 
          AND p.tenant_id = :tenantId
          AND p.status = 'active'
          AND i.quantity < i.reorder_level
        ORDER BY i.quantity ASC
        LIMIT 20`,
        {
          replacements: { tenantId },
          type: sequelize.QueryTypes.SELECT
        }
      );

      // Stock by category
      const stockByCategoryRaw = await sequelize.query(
        `SELECT 
          c.id as category_id,
          c.name as category_name,
          SUM(i.quantity) as total_quantity,
          SUM(i.quantity * p.cost_price) as total_value
        FROM inventory i
        INNER JOIN products p ON i.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE i.tenant_id = :tenantId 
          AND p.tenant_id = :tenantId
          AND p.status = 'active'
        GROUP BY c.id, c.name
        ORDER BY total_value DESC`,
        {
          replacements: { tenantId },
          type: sequelize.QueryTypes.SELECT
        }
      );

      // Out of stock items
      const outOfStockRaw = await sequelize.query(
        `SELECT 
          i.product_id,
          p.name as product_name,
          p.sku
        FROM inventory i
        INNER JOIN products p ON i.product_id = p.id
        WHERE i.tenant_id = :tenantId 
          AND p.tenant_id = :tenantId
          AND p.status = 'active'
          AND i.quantity = 0
        LIMIT 20`,
        {
          replacements: { tenantId },
          type: sequelize.QueryTypes.SELECT
        }
      );

      res.json({
        totalStockValue: parseFloat(stockValue[0]?.total_value || 0),
        lowStockItems: lowStockRaw.map(item => ({
          productId: item.product_id,
          productName: item.product_name || 'Unknown',
          sku: item.sku || 'N/A',
          quantity: parseInt(item.quantity || 0),
          reorderLevel: parseInt(item.reorder_level || 0),
          costPrice: parseFloat(item.cost_price || 0),
          sellingPrice: parseFloat(item.selling_price || 0)
        })),
        stockByCategory: stockByCategoryRaw.map(item => ({
          categoryId: item.category_id,
          categoryName: item.category_name || 'Uncategorized',
          totalQuantity: parseInt(item.total_quantity || 0),
          totalValue: parseFloat(item.total_value || 0)
        })),
        outOfStockItems: outOfStockRaw.map(item => ({
          productId: item.product_id,
          productName: item.product_name || 'Unknown',
          sku: item.sku || 'N/A'
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  // Get orders report
  static async getOrdersReport(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { startDate, endDate } = req.query;

      const where = { tenant_id: tenantId };
      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter[Op.gte] = new Date(startDate);
        if (endDate) dateFilter[Op.lte] = new Date(endDate);
        where.order_date = dateFilter;
      }

      // Orders by status
      const ordersByStatus = await Order.findAll({
        where,
        attributes: [
          'status',
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('total_amount')), 'revenue']
        ],
        group: ['status'],
        raw: true
      });

      // Orders by payment method
      const ordersByPayment = await Order.findAll({
        where,
        attributes: [
          'payment_method',
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('total_amount')), 'revenue']
        ],
        group: ['payment_method'],
        raw: true
      });

      // Orders by date (daily)
      const ordersByDate = await Order.findAll({
        where,
        attributes: [
          [fn('DATE', col('order_date')), 'date'],
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('total_amount')), 'revenue']
        ],
        group: [fn('DATE', col('order_date'))],
        order: [[fn('DATE', col('order_date')), 'ASC']],
        raw: true
      });

      // Average order value
      const avgOrderValue = await Order.findAll({
        where,
        attributes: [[fn('AVG', col('total_amount')), 'average']],
        raw: true
      });

      res.json({
        ordersByStatus: ordersByStatus.map(o => ({
          status: o.status || 'Unknown',
          count: parseInt(o.count || 0),
          revenue: parseFloat(o.revenue || 0)
        })),
        ordersByPayment: ordersByPayment.map(o => ({
          method: o.payment_method || 'Unknown',
          count: parseInt(o.count || 0),
          revenue: parseFloat(o.revenue || 0)
        })),
        ordersByDate: ordersByDate.map(o => ({
          date: o.date,
          count: parseInt(o.count || 0),
          revenue: parseFloat(o.revenue || 0)
        })),
        averageOrderValue: parseFloat(avgOrderValue[0]?.average || 0)
      });
    } catch (error) {
      next(error);
    }
  }

  // Get customers report
  static async getCustomersReport(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { startDate, endDate } = req.query;

      const receiptWhere = { tenant_id: tenantId, status: 'active' };
      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter[Op.gte] = new Date(startDate);
        if (endDate) dateFilter[Op.lte] = new Date(endDate);
        receiptWhere.issue_date = dateFilter;
      }

      // Customer statistics
      const totalCustomers = await Customer.count({
        where: { tenant_id: tenantId }
      });

      // Top customers by revenue (for customers report)
      const replacementsCustomers = { tenantId };
      let dateFilterCustomers = '';
      if (startDate) {
        replacementsCustomers.startDate = startDate;
        dateFilterCustomers += ' AND r.issue_date >= :startDate';
      }
      if (endDate) {
        replacementsCustomers.endDate = endDate;
        dateFilterCustomers += ' AND r.issue_date <= :endDate';
      }
      
      const topCustomersRaw = await sequelize.query(
        `SELECT 
          r.customer_id,
          c.name as customer_name,
          c.email,
          c.phone,
          SUM(r.total_amount) as total_revenue,
          COUNT(r.id) as order_count,
          MAX(r.issue_date) as last_order_date
        FROM receipts r
        LEFT JOIN customers c ON r.customer_id = c.id
        WHERE r.tenant_id = :tenantId 
          AND r.status = 'active'${dateFilterCustomers}
        GROUP BY r.customer_id, c.name, c.email, c.phone
        ORDER BY total_revenue DESC
        LIMIT 20`,
        {
          replacements: replacementsCustomers,
          type: sequelize.QueryTypes.SELECT
        }
      );

      // New customers by date
      const newCustomersByDate = await Customer.findAll({
        where: { tenant_id: tenantId },
        attributes: [
          [fn('DATE', col('created_at')), 'date'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: [fn('DATE', col('created_at'))],
        order: [[fn('DATE', col('created_at')), 'ASC']],
        raw: true
      });

      res.json({
        totalCustomers,
        topCustomers: topCustomersRaw.map(c => ({
          customerId: c.customer_id,
          customerName: c.customer_name || 'Walk-in Customer',
          email: c.email || 'N/A',
          phone: c.phone || 'N/A',
          totalRevenue: parseFloat(c.total_revenue || 0),
          orderCount: parseInt(c.order_count || 0),
          lastOrderDate: c.last_order_date
        })),
        newCustomersByDate: newCustomersByDate.map(c => ({
          date: c.date,
          count: parseInt(c.count || 0)
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  // Get products report
  static async getProductsReport(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { startDate, endDate } = req.query;

      const receiptWhere = { tenant_id: tenantId, status: 'active' };
      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter[Op.gte] = new Date(startDate);
        if (endDate) dateFilter[Op.lte] = new Date(endDate);
        receiptWhere.issue_date = dateFilter;
      }

      // Best selling products
      const replacementsProducts = { tenantId };
      let dateFilterProducts = '';
      if (startDate) {
        replacementsProducts.startDate = startDate;
        dateFilterProducts += ' AND r.issue_date >= :startDate';
      }
      if (endDate) {
        replacementsProducts.endDate = endDate;
        dateFilterProducts += ' AND r.issue_date <= :endDate';
      }
      
      const bestSellersRaw = await sequelize.query(
        `SELECT 
          ri.product_id,
          p.name as product_name,
          p.sku,
          c.name as category_name,
          SUM(ri.quantity) as total_quantity,
          SUM(ri.subtotal) as total_revenue,
          p.selling_price,
          p.cost_price
        FROM receipt_items ri
        INNER JOIN receipts r ON ri.receipt_id = r.id
        LEFT JOIN products p ON ri.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE r.tenant_id = :tenantId 
          AND r.status = 'active'${dateFilterProducts}
        GROUP BY ri.product_id, p.name, p.sku, c.name, p.selling_price, p.cost_price
        ORDER BY total_quantity DESC
        LIMIT 20`,
        {
          replacements: replacementsProducts,
          type: sequelize.QueryTypes.SELECT
        }
      );

      // Products by category
      const productsByCategoryRaw = await sequelize.query(
        `SELECT 
          c.id as category_id,
          c.name as category_name,
          COUNT(p.id) as count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.tenant_id = :tenantId 
          AND p.status = 'active'
        GROUP BY c.id, c.name
        ORDER BY count DESC`,
        {
          replacements: { tenantId },
          type: sequelize.QueryTypes.SELECT
        }
      );

      // Slow moving products (products with no sales)
      const allProducts = await Product.findAll({
        where: { tenant_id: tenantId, status: 'active' },
        attributes: ['id', 'name', 'sku']
      });

      const soldProductIds = await ReceiptItem.findAll({
        include: [
          {
            model: Receipt,
            as: 'receipt',
            where: receiptWhere,
            attributes: []
          }
        ],
        attributes: ['product_id'],
        group: ['product_id'],
        raw: true
      });

      const soldIds = new Set(soldProductIds.map(p => p.product_id));
      const slowMoving = allProducts.filter(p => !soldIds.has(p.id)).slice(0, 20);

      res.json({
        bestSellers: bestSellersRaw.map(p => ({
          productId: p.product_id,
          productName: p.product_name || 'Unknown',
          sku: p.sku || 'N/A',
          category: p.category_name || 'Uncategorized',
          totalQuantity: parseInt(p.total_quantity || 0),
          totalRevenue: parseFloat(p.total_revenue || 0),
          sellingPrice: parseFloat(p.selling_price || 0),
          costPrice: parseFloat(p.cost_price || 0)
        })),
        productsByCategory: productsByCategoryRaw.map(p => ({
          categoryId: p.category_id,
          categoryName: p.category_name || 'Uncategorized',
          count: parseInt(p.count || 0)
        })),
        slowMovingProducts: slowMoving.map(p => ({
          productId: p.id,
          productName: p.name,
          sku: p.sku || 'N/A'
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  // Get comprehensive report (all analytics)
  static async getComprehensiveReport(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { startDate, endDate } = req.query;

      // Get all reports in parallel
      const [sales, inventory, orders, customers, products] = await Promise.all([
        this.getSalesReportData(tenantId, startDate, endDate),
        this.getInventoryReportData(tenantId),
        this.getOrdersReportData(tenantId, startDate, endDate),
        this.getCustomersReportData(tenantId, startDate, endDate),
        this.getProductsReportData(tenantId, startDate, endDate)
      ]);

      res.json({
        sales,
        inventory,
        orders,
        customers,
        products,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper methods (extracted for reuse)
  static async getSalesReportData(tenantId, startDate, endDate) {
    const receiptWhere = { tenant_id: tenantId, status: 'active' };
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter[Op.gte] = new Date(startDate);
      if (endDate) dateFilter[Op.lte] = new Date(endDate);
      receiptWhere.issue_date = dateFilter;
    }

    const totalRevenue = await Receipt.findAll({
      where: receiptWhere,
      attributes: [[fn('SUM', col('total_amount')), 'total']],
      raw: true
    });

    return {
      totalRevenue: parseFloat(totalRevenue[0]?.total || 0)
    };
  }

  static async getInventoryReportData(tenantId) {
    const stockValue = await Inventory.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          where: { tenant_id: tenantId, status: 'active' },
          attributes: []
        }
      ],
      where: { tenant_id: tenantId },
      attributes: [
        [fn('SUM', literal('quantity * "product"."cost_price"')), 'total_value']
      ],
      raw: true
    });

    return {
      totalStockValue: parseFloat(stockValue[0]?.total_value || 0)
    };
  }

  static async getOrdersReportData(tenantId, startDate, endDate) {
    const where = { tenant_id: tenantId };
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter[Op.gte] = new Date(startDate);
      if (endDate) dateFilter[Op.lte] = new Date(endDate);
      where.order_date = dateFilter;
    }

    const totalOrders = await Order.count({ where });
    return { totalOrders };
  }

  static async getCustomersReportData(tenantId, startDate, endDate) {
    const where = { tenant_id: tenantId };
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter[Op.gte] = new Date(startDate);
      if (endDate) dateFilter[Op.lte] = new Date(endDate);
      where.created_at = dateFilter;
    }

    const totalCustomers = await Customer.count({ where });
    return { totalCustomers };
  }

  static async getProductsReportData(tenantId, startDate, endDate) {
    const where = { tenant_id: tenantId, status: 'active' };
    const totalProducts = await Product.count({ where });
    return { totalProducts };
  }
}

module.exports = ReportController;

