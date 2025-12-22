import api from './api';

const inventoryService = {
  getAllInventory: async (filters = {}) => {
    const response = await api.get('/inventory', { params: filters });
    return response.data;
  },

  getInventoryById: async (id) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  updateStock: async (id, data) => {
    const response = await api.put(`/inventory/${id}/stock`, data);
    return response.data;
  },

  getStockMovements: async (filters = {}) => {
    const response = await api.get('/inventory/movements', { params: filters });
    return response.data;
  },

  adjustStock: async (data) => {
    const response = await api.post('/inventory/adjust', data);
    return response.data;
  },

  getInventoryStats: async () => {
    const response = await api.get('/inventory/stats');
    return response.data;
  },
};

export default inventoryService;

