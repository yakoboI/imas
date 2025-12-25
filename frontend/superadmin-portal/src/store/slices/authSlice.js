import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import superAdminService from '../../services/superAdminService';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await superAdminService.login(credentials);
      localStorage.setItem('superadmin_token', response.token);
      localStorage.setItem('superadmin', JSON.stringify(response.superadmin));
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    // Call backend logout endpoint to log the action
    try {
      await superAdminService.logout();
    } catch (error) {
      // Don't fail if backend call fails - still clear local storage
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error';
      console.error('Failed to call logout endpoint:', errorMessage);
    }
  } catch (error) {
    // Continue with logout even if API call fails
    const errorMessage = error?.message || 'Unknown error';
    console.error('Logout error:', errorMessage);
  } finally {
    // Always clear local storage
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin');
  }
  return null;
});

const initialState = {
  superadmin: JSON.parse(localStorage.getItem('superadmin')) || null,
  token: localStorage.getItem('superadmin_token') || null,
  isAuthenticated: !!localStorage.getItem('superadmin_token'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.superadmin = action.payload.superadmin;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.superadmin = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

