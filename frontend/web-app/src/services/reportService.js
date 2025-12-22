import api from './api';

const reportService = {
  getSalesReport: async (filters = {}) => {
    const response = await api.get('/reports/sales', { params: filters });
    return response.data;
  },

  getInventoryReport: async (filters = {}) => {
    const response = await api.get('/reports/inventory', { params: filters });
    return response.data;
  },

  getOrdersReport: async (filters = {}) => {
    const response = await api.get('/reports/orders', { params: filters });
    return response.data;
  },

  getCustomersReport: async (filters = {}) => {
    const response = await api.get('/reports/customers', { params: filters });
    return response.data;
  },

  getProductsReport: async (filters = {}) => {
    const response = await api.get('/reports/products', { params: filters });
    return response.data;
  },

  getComprehensiveReport: async (filters = {}) => {
    const response = await api.get('/reports/comprehensive', { params: filters });
    return response.data;
  },
};

export default reportService;

