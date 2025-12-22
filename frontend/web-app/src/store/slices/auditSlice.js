import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  logs: [],
  loading: false,
  error: null,
};

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    setLogs: (state, action) => {
      state.logs = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setLogs, clearError } = auditSlice.actions;
export default auditSlice.reducer;

