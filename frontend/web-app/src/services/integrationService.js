import api from './api';

/**
 * Unified Integration Service
 * Frontend service for managing all integrations
 */
const integrationService = {
  /**
   * Get all available integrations with metadata
   */
  getAvailableIntegrations: async () => {
    const response = await api.get('/integrations/available');
    return response.data;
  },

  /**
   * Get all integrations for current tenant
   */
  getIntegrations: async () => {
    const response = await api.get('/integrations');
    return response.data;
  },

  /**
   * Get specific integration
   */
  getIntegration: async (type) => {
    const response = await api.get(`/integrations/${type}`);
    return response.data;
  },

  /**
   * Get integration status
   */
  getIntegrationStatus: async (type) => {
    const response = await api.get(`/integrations/${type}/status`);
    return response.data;
  },

  /**
   * Connect/Configure integration (generic)
   */
  connectIntegration: async (type, data) => {
    const response = await api.post(`/integrations/${type}/connect`, data);
    return response.data;
  },

  /**
   * Disconnect integration
   */
  disconnectIntegration: async (type) => {
    const response = await api.delete(`/integrations/${type}`);
    return response.data;
  },

  /**
   * Get integration logs
   */
  getIntegrationLogs: async (type = 'all', filters = {}) => {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    if (filters.status) params.append('status', filters.status);
    if (filters.direction) params.append('direction', filters.direction);
    if (filters.eventType) params.append('eventType', filters.eventType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const url = type === 'all' 
      ? `/integrations/logs/all?${params.toString()}`
      : `/integrations/${type}/logs?${params.toString()}`;
    
    const response = await api.get(url);
    return response.data;
  },
};

export default integrationService;

