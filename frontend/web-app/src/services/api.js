import axios from 'axios';
import { toast } from 'react-toastify';

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
    // Don't add token for public endpoints or if we're on a public page
    const currentPath = window.location.pathname;
    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
    
    // Only add token if we're NOT on a public page
    // This prevents invalid tokens from being sent on public pages
    if (!publicPaths.includes(currentPath)) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
      // Unauthorized - clear token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Get current path
      const currentPath = window.location.pathname;
      
      // Define public paths that should NEVER redirect
      const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
      
      // CRITICAL: Never redirect from public pages
      // Check if we're on a public path FIRST - if so, NEVER redirect
      const isPublicPath = publicPaths.includes(currentPath);
      
      if (isPublicPath) {
        // We're on a public page - do NOT redirect, just clear tokens
        console.log(`[API Interceptor] 401 on public page "${currentPath}" - clearing tokens, NOT redirecting`);
        return Promise.reject(error);
      }
      
      // Only redirect if we're on a protected route (not a public page)
      const isProtectedRoute = currentPath.startsWith('/app') || currentPath === '/dashboard';
      
      if (isProtectedRoute) {
        console.log(`[API Interceptor] 401 on protected route "${currentPath}" - redirecting to login`);
        window.location.href = '/login';
      } else {
        // Unknown/other path - don't redirect, just clear tokens
        console.log(`[API Interceptor] 401 on unknown path "${currentPath}" - clearing tokens, NOT redirecting`);
      }
      
      return Promise.reject(error);
    }
    if (error.response?.status === 503) {
      // Service Unavailable - Maintenance mode
      const message = error.response?.data?.message || 'The system is currently under maintenance. Please try again later.';
      // Show maintenance message to user using toast
      if (window.location.pathname !== '/login') {
        // Only show if not already on login page
        toast.error(message, {
          autoClose: 10000, // Show for 10 seconds
          position: 'top-center',
        });
      }
    }
    // Suppress 404 errors for unimplemented routes (expected during development)
    // They will be handled by individual services/components
    if (error.response?.status === 404) {
      // Don't log 404s to console to reduce noise
      // The error will still be passed to the component for handling
    }
    return Promise.reject(error);
  }
);

export default api;

