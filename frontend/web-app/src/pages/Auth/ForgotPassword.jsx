import React, { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const emailError = useMemo(() => {
    if (!email) return '';
    if (!emailRegex.test(email.trim())) return 'Enter a valid email address';
    return '';
  }, [email]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage('Email is required');
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setErrorMessage('Enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authService.forgotPassword(trimmed);
      setSuccessMessage(
        res?.message || 'If the email exists, a password reset link has been sent'
      );
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Unable to send reset link. Please try again.';
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
            Forgot your password?
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Enter your email and we’ll send a reset link.
          </Typography>

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
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              disabled={submitting}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              disabled={submitting || !email.trim() || !!emailError}
            >
              {submitting ? 'Sending...' : 'Send reset link'}
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

