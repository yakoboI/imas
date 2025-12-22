import api from './api';

const customerService = {
  getAllCustomers: async (filters = {}) => {
    const response = await api.get('/customers', { params: filters });
    return response.data;
  },

  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data) => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id, data) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  searchCustomers: async (keyword) => {
    const response = await api.get('/customers/search', { params: { keyword } });
    return response.data;
  },
};

export default customerService;

