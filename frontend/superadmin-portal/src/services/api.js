import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('superadmin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin');
      window.location.href = '/login';
    }
    if (error.response?.status === 503) {
      // Service Unavailable - Maintenance mode
      // SuperAdmin should still be able to access, but show message if needed
      const message = error.response?.data?.message || 'The system is currently under maintenance.';
      console.warn('Maintenance mode:', message);
    }
    return Promise.reject(error);
  }
);

export default api;

