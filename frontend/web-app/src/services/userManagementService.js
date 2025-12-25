import api from './api';

const userManagementService = {
  getTenantInfo: async () => {
    const response = await api.get('/users/tenant-info');
    return response.data;
  },

  getAllUsers: async (filters = {}) => {
    const response = await api.get('/users', { params: filters });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (data) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  resetUserPassword: async (id, newPassword) => {
    const response = await api.put(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },
};

export default userManagementService;

