import api from './api';

const orderService = {
  getAllOrders: async (filters = {}) => {
    const response = await api.get('/orders', { params: filters });
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (data) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  updateOrder: async (id, data) => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  cancelOrder: async (id) => {
    const response = await api.put(`/orders/${id}/cancel`);
    return response.data;
  },

  completeOrder: async (id) => {
    const response = await api.put(`/orders/${id}/complete`);
    return response.data;
  },
};

export default orderService;

