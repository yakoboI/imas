import api from './api';

const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  // Passkey login methods
  passkeyLogin: async (email) => {
    const passkeyService = (await import('./passkeyService')).default;
    
    // Start authentication
    const options = await passkeyService.startAuthentication(email);
    
    // Complete authentication
    const result = await passkeyService.completeAuthentication(email, options);
    
    // Store token and user info (same as password login)
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  },
};

export default authService;

