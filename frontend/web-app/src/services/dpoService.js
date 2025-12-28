import api from './api';

/**
 * DPO Pay Integration Service
 * Frontend service for interacting with DPO Pay integration endpoints
 */
const dpoService = {
  /**
   * Connect DPO Pay integration
   */
  connect: async (credentials) => {
    const response = await api.post('/integrations/dpo/connect', {
      companyToken: credentials.companyToken,
      serviceType: credentials.serviceType,
      environment: credentials.environment || 'sandbox'
    });
    return response.data;
  },

  /**
   * Initiate payment for an order
   */
  initiatePayment: async (orderId) => {
    const response = await api.post('/integrations/dpo/payment/initiate', {
      orderId
    });
    return response.data;
  },

  /**
   * Verify payment
   */
  verifyPayment: async (transactionRef) => {
    const response = await api.get(`/integrations/dpo/payment/verify`, {
      params: { transactionRef }
    });
    return response.data;
  }
};

export default dpoService;

