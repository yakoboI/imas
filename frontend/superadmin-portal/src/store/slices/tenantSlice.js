import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tenants: [],
  selectedTenant: null,
  loading: false,
  error: null,
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setTenants: (state, action) => {
      state.tenants = action.payload;
    },
    setSelectedTenant: (state, action) => {
      state.selectedTenant = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setTenants, setSelectedTenant, clearError } = tenantSlice.actions;
export default tenantSlice.reducer;

