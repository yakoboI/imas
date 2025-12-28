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
    // Normalize email: ensure it's a string and trim/lowercase
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required and must be a string');
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email cannot be empty');
    }

    const passkeyService = (await import('./passkeyService')).default;
    
    // Start authentication (will normalize again internally, but use normalized here for consistency)
    const options = await passkeyService.startAuthentication(normalizedEmail);
    
    // Complete authentication (will normalize again internally, but use normalized here for consistency)
    const result = await passkeyService.completeAuthentication(normalizedEmail, options);
    
    // Store token and user info (same as password login)
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  },
};

export default authService;

