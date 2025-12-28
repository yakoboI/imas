import api from './api';

const traIntegrationService = {
  getConfiguration: async () => {
    const response = await api.get('/tra-integration');
    return response.data;
  },

  configureIntegration: async (formData) => {
    const response = await api.post('/tra-integration/configure', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  verifyCredentials: async () => {
    const response = await api.post('/tra-integration/verify');
    return response.data;
  },

  removeIntegration: async () => {
    const response = await api.delete('/tra-integration');
    return response.data;
  },
};

export default traIntegrationService;

