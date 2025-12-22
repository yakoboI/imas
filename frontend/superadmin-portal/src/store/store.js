import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import tenantSlice from './slices/tenantSlice';
import userSlice from './slices/userSlice';
import auditSlice from './slices/auditSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    tenant: tenantSlice,
    user: userSlice,
    audit: auditSlice,
  },
});

