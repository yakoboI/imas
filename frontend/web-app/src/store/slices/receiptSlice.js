import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  receipts: [],
  selectedReceipt: null,
  loading: false,
  error: null,
};

const receiptSlice = createSlice({
  name: 'receipt',
  initialState,
  reducers: {
    setReceipts: (state, action) => {
      state.receipts = action.payload;
    },
    setSelectedReceipt: (state, action) => {
      state.selectedReceipt = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setReceipts, setSelectedReceipt, clearError } = receiptSlice.actions;
export default receiptSlice.reducer;

