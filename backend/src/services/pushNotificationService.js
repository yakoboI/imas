const webpush = require('web-push');
const { PushSubscription } = require('../models');
require('dotenv').config();

class PushNotificationService {
  /**
   * Initialize VAPID keys
   */
  static initialize() {
    // Generate VAPID keys if not set (for development)
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      const vapidKeys = webpush.generateVAPIDKeys();
      process.env.VAPID_PUBLIC_KEY = vapidKeys.publicKey;
      process.env.VAPID_PRIVATE_KEY = vapidKeys.privateKey;
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@inventorysystem.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  /**
   * Subscribe user to push notifications
   */
  static async subscribe(userId, subscription) {
    try {
      // Check if subscription already exists
      const existing = await PushSubscription.findOne({
        where: {
          user_id: userId,
          endpoint: subscription.endpoint
        }
      });

      if (existing) {
        // Update existing subscription
        await existing.update({
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        });
        return existing;
      }

      // Create new subscription
      const pushSub = await PushSubscription.create({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      });

      return pushSub;
    } catch (error) {
      console.error('Error subscribing user to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  static async unsubscribe(userId, endpoint) {
    try {
      await PushSubscription.destroy({
        where: {
          user_id: userId,
          endpoint: endpoint
        }
      });
      return true;
    } catch (error) {
      console.error('Error unsubscribing user from push notifications:', error);
      throw error;
    }
  }

  /**
   * Send push notification to user
   */
  static async sendNotification(userId, notification) {
    try {
      const subscriptions = await PushSubscription.findAll({
        where: { user_id: userId }
      });

      if (subscriptions.length === 0) {
        return { sent: 0, total: 0 };
      }

      const results = await Promise.allSettled(
        subscriptions.map(sub => this._sendToSubscription(sub, notification))
      );

      const sent = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected');

      // Remove failed subscriptions (expired/invalid)
      for (const result of failed) {
        if (result.reason?.statusCode === 410 || result.reason?.statusCode === 404) {
          // Subscription expired or not found
          const sub = subscriptions.find(s => 
            result.reason.subscription?.endpoint === s.endpoint
          );
          if (sub) {
            await sub.destroy();
          }
        }
      }

      return {
        sent,
        total: subscriptions.length,
        failed: failed.length
      };
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to a specific subscription
   */
  static async _sendToSubscription(subscription, notification) {
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: '/icon-192x192.png', // Default icon
      badge: '/badge-72x72.png',
      data: notification.data || {},
      tag: notification.tag || 'default',
      requireInteraction: notification.requireInteraction || false
    });

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    try {
      await webpush.sendNotification(pushSubscription, payload);
      return { success: true, subscription: pushSubscription };
    } catch (error) {
      // Attach subscription info for cleanup
      error.subscription = pushSubscription;
      throw error;
    }
  }

  /**
   * Get VAPID public key (for frontend)
   */
  static getPublicKey() {
    if (!process.env.VAPID_PUBLIC_KEY) {
      this.initialize();
    }
    return process.env.VAPID_PUBLIC_KEY;
  }
}

// Initialize on module load
PushNotificationService.initialize();

module.exports = PushNotificationService;

