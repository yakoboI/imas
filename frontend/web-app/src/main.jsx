import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import App from './App';
import { store } from './store/store';
import theme from './theme';
import './index.css';

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Suppress known errors (404, 500, network errors, etc.) to reduce console noise
  const error = event.reason;
  
  // First, check for browser extension errors with specific pattern
  // Pattern: {name: 'i', httpError: false, httpStatus: 200, code: 403, ...}
  if (error && typeof error === 'object') {
    // Check for browser extension error pattern early
    if ('code' in error && 'httpStatus' in error && 'httpError' in error) {
      // Browser extension errors typically have httpError: false, httpStatus: 200, code: 403
      if (error.httpError === false && error.httpStatus === 200) {
        event.preventDefault();
        return;
      }
    }
    
    // Suppress errors with minimal properties (browser extension pattern)
    if (error.name && 'code' in error && 'httpStatus' in error && Object.keys(error).length <= 6) {
      event.preventDefault();
      return;
    }
  }
  
  // Suppress browser extension errors (content.js errors)
  if (error?.message) {
    const message = error.message.toLowerCase();
    if (message.includes('could not establish connection') ||
        message.includes('receiving end does not exist') ||
        error.stack?.includes('content.js')) {
      event.preventDefault();
      return;
    }
  }
  
  // Handle axios errors
  if (error?.response) {
    const status = error.response.status;
    // Suppress 404, 500, and 0 (network) errors
    if (status === 404 || status === 500 || status === 0) {
      event.preventDefault();
      return;
    }
  }
  
  // Handle AxiosError objects (check for isAxiosError property)
  if (error?.isAxiosError && error?.response?.status === 404) {
    event.preventDefault();
    return;
  }
  
  // Suppress generic promise rejections from browser extensions
  if (error && typeof error === 'object' && !error.message && !error.stack) {
    // Likely a browser extension error (just an empty object)
    const stack = new Error().stack || '';
    if (stack.includes('content.js') || stack.includes('extension')) {
      event.preventDefault();
      return;
    }
  }
  
  // Suppress common expected errors
  if (error?.message) {
    const message = error.message.toLowerCase();
    if (message.includes('failed to fetch') || 
        message.includes('network error') ||
        message.includes('aborted') ||
        message.includes('cancelled')) {
      event.preventDefault();
      return;
    }
  }
  
  // Log unexpected errors only
  console.error('Unhandled promise rejection:', error);
});

// Suppress browser extension errors in console
const originalError = console.error;
console.error = (...args) => {
  const errorString = args.join(' ');
  
  // Suppress content.js extension errors (browser extensions)
  if (errorString.includes('content.js') || 
      errorString.includes('Could not establish connection') ||
      errorString.includes('Receiving end does not exist') ||
      errorString.includes('Extension context invalidated')) {
    return;
  }
  
  // Suppress expected 404 errors from receipt PDF endpoints
  // These are handled gracefully by the UI with user-friendly messages
  if ((errorString.includes('Print error:') || errorString.includes('Download error:')) &&
      args.length > 1) {
    const error = args[1];
    // Check if it's an AxiosError with 404 status
    if (error?.response?.status === 404 || 
        error?.isAxiosError && error?.response?.status === 404) {
      return; // Suppress expected 404 errors
    }
  }
  
  // Suppress generic "Uncaught (in promise) Object" errors from browser extensions
  if (errorString.includes('Uncaught (in promise)') && 
      (errorString.includes('receipts:1') || 
       errorString.includes('sales:1') || 
       errorString.includes('content.js'))) {
    return;
  }
  
  // Suppress errors from receipts and sales pages (404s are expected and handled)
  if ((errorString.includes('receipts:1') || errorString.includes('sales:1')) && 
      errorString.includes('Uncaught')) {
    return;
  }
  
  // Suppress axios 404 errors that are logged directly
  if (errorString.includes('GET http') && 
      errorString.includes('/api/receipts') && 
      errorString.includes('404')) {
    return;
  }
  
  // Suppress expected receipt generation errors (these are handled by UI)
  if ((errorString.includes('Failed to generate receipt') || 
       errorString.includes('Failed to regenerate receipt') ||
       errorString.includes('Print error:') ||
       errorString.includes('Download error:')) &&
      args.length > 1) {
    const error = args[1];
    // Suppress 500 errors from receipt generation (they're handled gracefully)
    if (error?.response?.status === 500 || 
        error?.isAxiosError && error?.response?.status === 500) {
      // Only suppress if it's a receipt-related error
      if (error?.config?.url?.includes('/receipts')) {
        return;
      }
    }
  }
  
  // Suppress browser extension errors with specific pattern
  if (args.length > 0 && typeof args[0] === 'object') {
    const error = args[0];
    if (error && typeof error === 'object' && 'code' in error && 'httpStatus' in error) {
      if (error.httpStatus === 200 && (error.code === 403 || error.code === 400)) {
        return;
      }
    }
  }
  
  originalError.apply(console, args);
};

// CRITICAL: Prevent any redirects on initial load if we're on the landing page
// This ensures the landing page always shows, even with invalid tokens
const currentPath = window.location.pathname;
const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

if (publicPaths.includes(currentPath)) {
  // We're on a public path - clear any invalid tokens but don't redirect
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // If we have a token but no user, or if token seems invalid, clear it
  // But don't redirect - let the page load normally
  if (token && !user) {
    console.log('[Main] Clearing invalid token (no user data)');
    localStorage.removeItem('token');
  }
}

console.log('[Main] Initializing app, current path:', currentPath);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    </Provider>
  </React.StrictMode>
);

