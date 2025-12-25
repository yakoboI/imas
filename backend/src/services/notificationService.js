const EmailService = require('./emailService');
const SMSService = require('./smsService');
const PushNotificationService = require('./pushNotificationService');
const { User } = require('../models');

class NotificationService {
  /**
   * Send notification through all enabled channels
   * @param {Object} options
   * @param {string|Array} options.userIds - User ID(s) to notify
   * @param {string} options.type - Notification type: 'low_stock', 'order_update', 'daily_digest'
   * @param {Object} options.data - Notification data
   * @param {boolean} options.forceEmail - Force email even if user disabled it
   */
  static async sendNotification({ userIds, type, data, forceEmail = false }) {
    const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
    const results = [];

    for (const userId of userIdArray) {
      try {
        const user = await User.findByPk(userId);
        if (!user) {
          continue;
        }

        const preferences = user.notification_preferences || {};
        const result = {
          userId,
          email: { sent: false, error: null },
          sms: { sent: false, error: null },
          push: { sent: false, error: null }
        };

        // Send Email
        if (forceEmail || preferences.emailNotifications) {
          try {
            await this._sendEmail(user, type, data);
            result.email.sent = true;
          } catch (error) {
            result.email.error = error.message;
            console.error(`Failed to send email to ${user.email}:`, error);
          }
        }

        // Send SMS
        if (preferences.smsNotifications && user.phone) {
          try {
            await this._sendSMS(user, type, data);
            result.sms.sent = true;
          } catch (error) {
            result.sms.error = error.message;
            console.error(`Failed to send SMS to ${user.phone}:`, error);
          }
        }

        // Send Push Notification
        if (preferences.pushNotifications) {
          try {
            await this._sendPush(user, type, data);
            result.push.sent = true;
          } catch (error) {
            result.push.error = error.message;
            console.error(`Failed to send push to user ${userId}:`, error);
          }
        }

        results.push(result);
      } catch (error) {
        console.error(`Error processing notification for user ${userId}:`, error);
        results.push({
          userId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Send low stock alert
   */
  static async sendLowStockAlert({ product, inventory, warehouse, userIds }) {
    const data = {
      productName: product.name,
      currentQuantity: inventory.quantity,
      reorderLevel: inventory.reorder_level,
      warehouseName: warehouse.name,
      productId: product.id,
      warehouseId: warehouse.id
    };

    return await this.sendNotification({
      userIds,
      type: 'low_stock',
      data
    });
  }

  /**
   * Send order update notification
   */
  static async sendOrderUpdate({ order, oldStatus, newStatus, userIds }) {
    const data = {
      orderNumber: order.order_number,
      oldStatus,
      newStatus,
      orderId: order.id,
      totalAmount: order.total_amount,
      customerName: order.customer?.name || 'N/A'
    };

    return await this.sendNotification({
      userIds,
      type: 'order_update',
      data,
      forceEmail: false
    });
  }

  /**
   * Send daily digest
   */
  static async sendDailyDigest({ userId, reportData }) {
    const data = {
      date: new Date().toISOString().split('T')[0],
      sales: reportData.sales || {},
      orders: reportData.orders || {},
      lowStockItems: reportData.lowStockItems || [],
      pendingTasks: reportData.pendingTasks || []
    };

    return await this.sendNotification({
      userIds: [userId],
      type: 'daily_digest',
      data
    });
  }

  // Private methods
  static async _sendEmail(user, type, data) {
    const templates = {
      low_stock: {
        subject: `Low Stock Alert: ${data.productName}`,
        html: `
          <h2>Low Stock Alert</h2>
          <p>Hello ${user.first_name || 'User'},</p>
          <p>The following product is running low on stock:</p>
          <ul>
            <li><strong>Product:</strong> ${data.productName}</li>
            <li><strong>Current Quantity:</strong> ${data.currentQuantity}</li>
            <li><strong>Reorder Level:</strong> ${data.reorderLevel}</li>
            <li><strong>Warehouse:</strong> ${data.warehouseName}</li>
          </ul>
          <p>Please consider restocking this item soon.</p>
        `
      },
      order_update: {
        subject: `Order ${data.orderNumber} Status Update`,
        html: `
          <h2>Order Status Update</h2>
          <p>Hello ${user.first_name || 'User'},</p>
          <p>Order <strong>${data.orderNumber}</strong> status has been updated:</p>
          <ul>
            <li><strong>Previous Status:</strong> ${data.oldStatus}</li>
            <li><strong>New Status:</strong> ${data.newStatus}</li>
            <li><strong>Total Amount:</strong> ${data.totalAmount}</li>
            <li><strong>Customer:</strong> ${data.customerName}</li>
          </ul>
        `
      },
      daily_digest: {
        subject: `Daily Report Digest - ${data.date}`,
        html: `
          <h2>Daily Report Digest</h2>
          <p>Hello ${user.first_name || 'User'},</p>
          <p>Here's your daily summary for ${data.date}:</p>
          <h3>Sales Summary</h3>
          <ul>
            <li>Total Sales: ${data.sales.total || 0}</li>
            <li>Orders Processed: ${data.orders.count || 0}</li>
          </ul>
          <h3>Low Stock Items</h3>
          <ul>
            ${data.lowStockItems.length > 0 
              ? data.lowStockItems.map(item => `<li>${item.name} - ${item.quantity} remaining</li>`).join('')
              : '<li>No low stock items</li>'
            }
          </ul>
          <h3>Pending Tasks</h3>
          <ul>
            ${data.pendingTasks.length > 0
              ? data.pendingTasks.map(task => `<li>${task}</li>`).join('')
              : '<li>No pending tasks</li>'
            }
          </ul>
        `
      }
    };

    const template = templates[type];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    return await EmailService.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html
    });
  }

  static async _sendSMS(user, type, data) {
    const messages = {
      low_stock: `Low Stock Alert: ${data.productName} has ${data.currentQuantity} units remaining (Reorder: ${data.reorderLevel}) in ${data.warehouseName}.`,
      order_update: `Order ${data.orderNumber} status changed from ${data.oldStatus} to ${data.newStatus}.`,
      daily_digest: `Daily Digest ${data.date}: ${data.sales.total || 0} in sales, ${data.orders.count || 0} orders, ${data.lowStockItems.length} low stock items.`
    };

    const message = messages[type];
    if (!message) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    return await SMSService.sendSMS({
      to: user.phone,
      message
    });
  }

  static async _sendPush(user, type, data) {
    const notifications = {
      low_stock: {
        title: 'Low Stock Alert',
        body: `${data.productName} is running low (${data.currentQuantity} remaining)`,
        data: {
          type: 'low_stock',
          productId: data.productId,
          warehouseId: data.warehouseId
        }
      },
      order_update: {
        title: 'Order Status Update',
        body: `Order ${data.orderNumber} is now ${data.newStatus}`,
        data: {
          type: 'order_update',
          orderId: data.orderId
        }
      },
      daily_digest: {
        title: 'Daily Report Digest',
        body: `${data.orders.count || 0} orders processed today`,
        data: {
          type: 'daily_digest',
          date: data.date
        }
      }
    };

    const notification = notifications[type];
    if (!notification) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    return await PushNotificationService.sendNotification(user.id, notification);
  }
}

module.exports = NotificationService;

