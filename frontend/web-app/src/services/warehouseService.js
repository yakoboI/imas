import api from './api';

const warehouseService = {
  getAllWarehouses: async (filters = {}) => {
    const response = await api.get('/warehouses', { params: filters });
    return response.data;
  },

  getWarehouseById: async (id) => {
    const response = await api.get(`/warehouses/${id}`);
    return response.data;
  },

  createWarehouse: async (data) => {
    const response = await api.post('/warehouses', data);
    return response.data;
  },

  updateWarehouse: async (id, data) => {
    const response = await api.put(`/warehouses/${id}`, data);
    return response.data;
  },

  deleteWarehouse: async (id) => {
    const response = await api.delete(`/warehouses/${id}`);
    return response.data;
  },
};

export default warehouseService;

