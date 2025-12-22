import api from './api';

const receiptService = {
  listReceipts: async (filters = {}) => {
    const response = await api.get('/receipts', { params: filters });
    return response.data;
  },

  generateReceipt: async (orderId, options = {}) => {
    const response = await api.post('/receipts/generate', {
      orderId,
      ...options,
    });
    return response.data;
  },

  getReceipt: async (id) => {
    const response = await api.get(`/receipts/${id}`);
    return response.data;
  },

  downloadPDF: async (id) => {
    const response = await api.get(`/receipts/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  previewReceipt: async (id) => {
    const response = await api.get(`/receipts/${id}/preview`);
    return response.data;
  },

  emailReceipt: async (id, email) => {
    const response = await api.post(`/receipts/${id}/email`, { email });
    return response.data;
  },

  voidReceipt: async (id, reason) => {
    const response = await api.post(`/receipts/${id}/void`, { reason });
    return response.data;
  },
};

export default receiptService;

