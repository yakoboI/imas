import api from './api';

const tenantSettingsService = {
  getSettings: async () => {
    const response = await api.get('/tenant-settings');
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await api.put('/tenant-settings', settings);
    return response.data;
  },
};

export default tenantSettingsService;

