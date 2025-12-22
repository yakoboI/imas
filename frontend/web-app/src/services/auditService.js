import api from './api';

const auditService = {
  getAuditLogs: async (filters = {}) => {
    const response = await api.get('/audit/logs', { params: filters });
    return response.data;
  },

  getAuditLogById: async (id) => {
    const response = await api.get(`/audit/logs/${id}`);
    return response.data;
  },

  getEntityHistory: async (type, id) => {
    const response = await api.get(`/audit/logs/entity/${type}/${id}`);
    return response.data;
  },

  getUserActivity: async (userId) => {
    const response = await api.get(`/audit/logs/user/${userId}`);
    return response.data;
  },

  searchAuditLogs: async (keyword) => {
    const response = await api.get('/audit/logs/search', { params: { keyword } });
    return response.data;
  },

  exportAuditLogs: async (filters = {}) => {
    const response = await api.post('/audit/logs/export', filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  getAuditStats: async (filters = {}) => {
    const response = await api.get('/audit/stats', { params: filters });
    return response.data;
  },
};

export default auditService;

