import api from './api';

/**
 * Pesapal Integration Service
 * Frontend service for interacting with Pesapal integration endpoints
 */
const pesapalService = {
  /**
   * Connect Pesapal integration
   */
  connect: async (credentials) => {
    const response = await api.post('/integrations/pesapal/connect', {
      consumerKey: credentials.consumerKey,
      consumerSecret: credentials.consumerSecret,
      environment: credentials.environment || 'sandbox'
    });
    return response.data;
  },

  /**
   * Initiate payment for an order
   */
  initiatePayment: async (orderId) => {
    const response = await api.post('/integrations/pesapal/payment/initiate', {
      orderId
    });
    return response.data;
  },

  /**
   * Get payment status
   */
  getPaymentStatus: async (orderTrackingId) => {
    const response = await api.get(`/integrations/pesapal/payment/status/${orderTrackingId}`);
    return response.data;
  }
};

export default pesapalService;

