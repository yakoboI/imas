import React, { useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import authService from '../../services/authService';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const passwordError = useMemo(() => {
    if (!newPassword) return '';
    if (newPassword.length < 8) return 'Use at least 8 characters';
    return '';
  }, [newPassword]);

  const confirmError = useMemo(() => {
    if (!confirmPassword) return '';
    if (confirmPassword !== newPassword) return 'Passwords do not match';
    return '';
  }, [confirmPassword, newPassword]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!token) {
      setErrorMessage('Missing reset token. Please use the link from your email.');
      return;
    }
    if (!newPassword) {
      setErrorMessage('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Use at least 8 characters');
      return;
    }
    if (confirmPassword !== newPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authService.resetPassword(token, newPassword);
      setSuccessMessage(res?.message || 'Password reset successfully');
      // Give the user a moment to read the message, then go back to login.
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Unable to reset password. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Reset password
          </Typography>

          {!token && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This page needs a reset token. Please open the link from your email.
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={onSubmit} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="newPassword"
              label="New password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              disabled={submitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="confirmPassword"
              label="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!confirmError}
              helperText={confirmError}
              disabled={submitting}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              disabled={
                submitting ||
                !token ||
                !newPassword ||
                !confirmPassword ||
                !!passwordError ||
                !!confirmError
              }
            >
              {submitting ? 'Resetting...' : 'Reset password'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Back to sign in
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

