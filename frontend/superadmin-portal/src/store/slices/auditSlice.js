import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  logs: [],
  systemLogs: [],
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
    setSystemLogs: (state, action) => {
      state.systemLogs = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setLogs, setSystemLogs, clearError } = auditSlice.actions;
export default auditSlice.reducer;

