import api from './api';

const superAdminService = {
  login: async (credentials) => {
    const response = await api.post('/superadmin/login', credentials);
    return response.data;
  },

  logout: async () => {
    await api.post('/superadmin/logout');
  },

  // Tenant Management
  getAllTenants: async (filters = {}) => {
    const response = await api.get('/superadmin/tenants', { params: filters });
    return response.data;
  },

  getTenantById: async (id) => {
    const response = await api.get(`/superadmin/tenants/${id}`);
    return response.data;
  },

  createTenant: async (data) => {
    const response = await api.post('/superadmin/tenants', data);
    return response.data;
  },

  updateTenant: async (id, data) => {
    const response = await api.put(`/superadmin/tenants/${id}`, data);
    return response.data;
  },

  deleteTenant: async (id) => {
    const response = await api.delete(`/superadmin/tenants/${id}`);
    return response.data;
  },

  suspendTenant: async (id) => {
    const response = await api.put(`/superadmin/tenants/${id}/suspend`);
    return response.data;
  },

  activateTenant: async (id) => {
    const response = await api.put(`/superadmin/tenants/${id}/activate`);
    return response.data;
  },

  getTenantStats: async (id) => {
    const response = await api.get(`/superadmin/tenants/${id}/stats`);
    return response.data;
  },

  // User Management
  getAllUsers: async (filters = {}) => {
    const response = await api.get('/superadmin/users', { params: filters });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/superadmin/users/${id}`);
    return response.data;
  },

  resetUserPassword: async (id, newPassword) => {
    const response = await api.put(`/superadmin/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  deactivateUser: async (id) => {
    const response = await api.put(`/superadmin/users/${id}/deactivate`);
    return response.data;
  },

  // Audit Logs
  getGlobalAuditLogs: async (filters = {}) => {
    const response = await api.get('/superadmin/audit-logs', { params: filters });
    return response.data;
  },

  getTenantAuditLogs: async (tenantId, filters = {}) => {
    const response = await api.get(`/superadmin/audit-logs/tenant/${tenantId}`, { params: filters });
    return response.data;
  },

  searchAuditLogs: async (keyword) => {
    const response = await api.get('/superadmin/audit-logs/search', { params: { keyword } });
    return response.data;
  },

  exportAuditLogs: async (filters = {}) => {
    const response = await api.post('/superadmin/audit-logs/export', filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  getSystemLogs: async (filters = {}) => {
    const response = await api.get('/superadmin/system-logs', { params: filters });
    return response.data;
  },

  archiveSystemLogs: async (data) => {
    const response = await api.post('/superadmin/system-logs/archive', data);
    return response.data;
  },

  // Analytics
  getAnalyticsOverview: async () => {
    const response = await api.get('/superadmin/analytics/overview');
    return response.data;
  },

  getRevenueReports: async (filters = {}) => {
    const response = await api.get('/superadmin/analytics/revenue', { params: filters });
    return response.data;
  },

  getUsageStatistics: async (filters = {}) => {
    const response = await api.get('/superadmin/analytics/usage', { params: filters });
    return response.data;
  },

  getTenantGrowth: async (filters = {}) => {
    const response = await api.get('/superadmin/analytics/tenants/growth', { params: filters });
    return response.data;
  },

  // System
  getSystemHealth: async () => {
    const response = await api.get('/superadmin/system/health');
    return response.data;
  },

  triggerBackup: async () => {
    const response = await api.post('/superadmin/system/backup');
    return response.data;
  },

  getSystemSettings: async () => {
    const response = await api.get('/superadmin/system/settings');
    return response.data;
  },

  updateSystemSettings: async (settings) => {
    const response = await api.put('/superadmin/system/settings', settings);
    return response.data;
  },

  // Profile
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.put('/superadmin/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default superAdminService;

