import api from './api';

/**
 * Flutterwave Integration Service
 * Frontend service for interacting with Flutterwave integration endpoints
 */
const flutterwaveService = {
  /**
   * Connect Flutterwave integration
   */
  connect: async (credentials) => {
    const response = await api.post('/integrations/flutterwave/connect', {
      publicKey: credentials.publicKey,
      secretKey: credentials.secretKey,
      environment: credentials.environment || 'sandbox'
    });
    return response.data;
  },

  /**
   * Initiate payment for an order
   */
  initiatePayment: async (orderId) => {
    const response = await api.post('/integrations/flutterwave/payment/initiate', {
      orderId
    });
    return response.data;
  },

  /**
   * Get payment status
   */
  getPaymentStatus: async (transactionRef) => {
    const response = await api.get(`/integrations/flutterwave/payment/status/${transactionRef}`);
    return response.data;
  }
};

export default flutterwaveService;

