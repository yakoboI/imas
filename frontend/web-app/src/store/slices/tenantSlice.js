import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tenant: JSON.parse(localStorage.getItem('tenant')) || null,
  settings: {},
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setTenant: (state, action) => {
      state.tenant = action.payload;
      localStorage.setItem('tenant', JSON.stringify(action.payload));
    },
    setSettings: (state, action) => {
      state.settings = action.payload;
    },
  },
});

export const { setTenant, setSettings } = tenantSlice.actions;
export default tenantSlice.reducer;

