const PushNotificationService = require('../services/pushNotificationService');
const NotificationService = require('../services/notificationService');
const DailyDigestService = require('../services/dailyDigestService');
const { User } = require('../models');

class NotificationController {
  /**
   * Subscribe to push notifications
   */
  static async subscribePush(req, res, next) {
    try {
      const { subscription } = req.body;

      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: 'Invalid subscription object' });
      }

      await PushNotificationService.subscribe(req.user.id, subscription);

      res.json({
        message: 'Successfully subscribed to push notifications'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribePush(req, res, next) {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint is required' });
      }

      await PushNotificationService.unsubscribe(req.user.id, endpoint);

      res.json({
        message: 'Successfully unsubscribed from push notifications'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get VAPID public key for frontend
   */
  static async getPublicKey(req, res, next) {
    try {
      const publicKey = PushNotificationService.getPublicKey();
      res.json({ publicKey });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test low stock alert (development only)
   */
  static async testLowStockAlert(req, res, next) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Test endpoints disabled in production' });
      }

      const { Inventory, Product, Warehouse } = require('../models');
      const tenantId = req.tenantId;

      // Get first low stock item or create a test one
      const inventory = await Inventory.findOne({
        where: { tenant_id: tenantId },
        include: [
          { model: Product, as: 'product', required: true },
          { model: Warehouse, as: 'warehouse', required: true }
        ]
      });

      if (!inventory) {
        return res.status(404).json({ error: 'No inventory found for testing' });
      }

      const users = await User.findAll({
        where: { tenant_id: tenantId, status: 'active' },
        attributes: ['id']
      });

      const userIds = users.map(u => u.id);

      await NotificationService.sendLowStockAlert({
        product: inventory.product,
        inventory: inventory,
        warehouse: inventory.warehouse,
        userIds
      });

      res.json({
        message: 'Test low stock alert sent',
        userIds
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test order update notification (development only)
   */
  static async testOrderUpdate(req, res, next) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Test endpoints disabled in production' });
      }

      const { Order, Customer } = require('../models');
      const tenantId = req.tenantId;

      const order = await Order.findOne({
        where: { tenant_id: tenantId },
        include: [
          { model: Customer, as: 'customer', required: false }
        ]
      });

      if (!order) {
        return res.status(404).json({ error: 'No order found for testing' });
      }

      const users = await User.findAll({
        where: { tenant_id: tenantId, status: 'active' },
        attributes: ['id']
      });

      const userIds = users.map(u => u.id);

      await NotificationService.sendOrderUpdate({
        order,
        oldStatus: 'pending',
        newStatus: 'processing',
        userIds
      });

      res.json({
        message: 'Test order update notification sent',
        userIds
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test daily digest (development only)
   */
  static async testDailyDigest(req, res, next) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Test endpoints disabled in production' });
      }

      const tenantId = req.tenantId;
      const digest = await DailyDigestService.generateDailyDigest(req.user.id, tenantId);

      await NotificationService.sendDailyDigest({
        userId: req.user.id,
        reportData: digest
      });

      res.json({
        message: 'Test daily digest sent',
        digest
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;

