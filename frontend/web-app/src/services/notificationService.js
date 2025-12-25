import api from './api';

const notificationService = {
  /**
   * Get VAPID public key
   */
  getPublicKey: async () => {
    const response = await api.get('/notifications/push/public-key');
    return response.data.publicKey;
  },

  /**
   * Subscribe to push notifications
   */
  subscribePush: async (subscription) => {
    const response = await api.post('/notifications/push/subscribe', { subscription });
    return response.data;
  },

  /**
   * Unsubscribe from push notifications
   */
  unsubscribePush: async (endpoint) => {
    const response = await api.post('/notifications/push/unsubscribe', { endpoint });
    return response.data;
  },

  /**
   * Test low stock alert (development)
   */
  testLowStockAlert: async () => {
    const response = await api.post('/notifications/test/low-stock');
    return response.data;
  },

  /**
   * Test order update (development)
   */
  testOrderUpdate: async () => {
    const response = await api.post('/notifications/test/order-update');
    return response.data;
  },

  /**
   * Test daily digest (development)
   */
  testDailyDigest: async () => {
    const response = await api.post('/notifications/test/daily-digest');
    return response.data;
  }
};

export default notificationService;

