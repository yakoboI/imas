import api from './api';

const reportService = {
  getSalesReport: async (filters = {}) => {
    try {
      const response = await api.get('/reports/sales', { params: filters });
      return response.data || {};
    } catch (error) {
      console.error('[ReportService] Error fetching sales report:', error);
      throw error;
    }
  },

  getInventoryReport: async (filters = {}) => {
    try {
      const response = await api.get('/reports/inventory', { params: filters });
      return response.data || {};
    } catch (error) {
      console.error('[ReportService] Error fetching inventory report:', error);
      throw error;
    }
  },

  getOrdersReport: async (filters = {}) => {
    try {
      const response = await api.get('/reports/orders', { params: filters });
      return response.data || {};
    } catch (error) {
      console.error('[ReportService] Error fetching orders report:', error);
      throw error;
    }
  },

  getCustomersReport: async (filters = {}) => {
    try {
      const response = await api.get('/reports/customers', { params: filters });
      return response.data || {};
    } catch (error) {
      console.error('[ReportService] Error fetching customers report:', error);
      throw error;
    }
  },

  getProductsReport: async (filters = {}) => {
    try {
      const response = await api.get('/reports/products', { params: filters });
      return response.data || {};
    } catch (error) {
      console.error('[ReportService] Error fetching products report:', error);
      throw error;
    }
  },

  getComprehensiveReport: async (filters = {}) => {
    try {
      const response = await api.get('/reports/comprehensive', { params: filters });
      return response.data || {};
    } catch (error) {
      console.error('[ReportService] Error fetching comprehensive report:', error);
      throw error;
    }
  },
};

export default reportService;

