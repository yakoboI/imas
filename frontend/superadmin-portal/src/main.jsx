import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import App from './App';
import { store } from './store/store';
import theme from './theme';
import './index.css';

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  
  // Suppress 401 errors (handled by API interceptor)
  if (error?.response?.status === 401) {
    event.preventDefault();
    return;
  }
  
  // Suppress browser extension errors
  if (error && typeof error === 'object') {
    if ('code' in error && 'httpStatus' in error && 'httpError' in error) {
      if (error.httpError === false && error.httpStatus === 200) {
        event.preventDefault();
        return;
      }
    }
    
    if (error.name && 'code' in error && 'httpStatus' in error && Object.keys(error).length <= 6) {
      event.preventDefault();
      return;
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
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
    </Provider>
  </React.StrictMode>
);

