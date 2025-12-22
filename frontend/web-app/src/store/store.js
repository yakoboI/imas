import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import productSlice from './slices/productSlice';
import orderSlice from './slices/orderSlice';
import receiptSlice from './slices/receiptSlice';
import auditSlice from './slices/auditSlice';
import tenantSlice from './slices/tenantSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    product: productSlice,
    order: orderSlice,
    receipt: receiptSlice,
    audit: auditSlice,
    tenant: tenantSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

