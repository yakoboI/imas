import axios from 'axios';

// Normalize API base URL - remove trailing slashes to prevent double slashes
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Remove trailing slash if present
  return envUrl.replace(/\/+$/, '');
};

const API_BASE_URL = getBaseURL();

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
    // Handle 401 Unauthorized - redirect to login (silently)
    if (error.response?.status === 401) {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      // Return a rejected promise but don't log 401 errors
      return Promise.reject(error);
    }

    // Log error details for debugging (only in development, and not for 401s)
    if (import.meta.env.DEV && error.response?.status !== 401) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 503 Service Unavailable - Maintenance mode
    if (error.response?.status === 503) {
      const message = error.response?.data?.message || 'The system is currently under maintenance.';
      console.warn('Maintenance mode:', message);
    }

    // Handle network errors and other failures
    if (!error.response) {
      console.error('Network error or server unreachable:', {
        url: error.config?.url,
        message: error.message,
      });
    }

    // Always reject to allow components to handle errors
    return Promise.reject(error);
  }
);

export default api;

