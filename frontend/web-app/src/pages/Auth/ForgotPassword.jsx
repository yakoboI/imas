import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  InputAdornment,
  CircularProgress,
  Fade,
  Zoom,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack,
  Send as SendIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import SEO from '../../components/SEO';

function ForgotPassword() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setError('');
    setValidationError('');
    
    if (value && !validateEmail(value)) {
      setValidationError('Please enter a valid email address');
    } else {
      setValidationError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      setSuccess(true);
      toast.success('Password reset link sent! Please check your email.');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Forgot Password - Reset Your Account"
        description="Reset your IMAS account password. Enter your email address and we'll send you a password reset link."
        keywords="forgot password, reset password, password recovery, account recovery"
        url="/forgot-password"
      />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 0, sm: 2 },
          py: { xs: 0, sm: 4 },
          pt: { xs: 2, sm: 4 },
        }}
      >
        <Container
          component="main"
          maxWidth="xs"
          sx={{
            position: 'relative',
            zIndex: 1,
            px: { xs: 1, sm: 3 },
            py: { xs: 0, sm: 4 },
            width: '100%',
            maxWidth: { xs: '100%', sm: '444px' }
          }}
        >
          <Fade in timeout={800}>
            <Box>
              <Zoom in timeout={600}>
                <Paper
                  elevation={24}
                  sx={{
                    p: { xs: 2, sm: 4 },
                    width: '100%',
                    borderRadius: { xs: 0, sm: 4 },
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: { xs: 'none', sm: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' },
                  }}
                >
                  <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 3 } }}>
                    <Box
                      sx={{
                        width: { xs: 56, sm: 64 },
                        height: { xs: 56, sm: 64 },
                        margin: '0 auto',
                        mb: { xs: 1.5, sm: 2 },
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                      }}
                    >
                      <EmailIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: 'white' }} />
                    </Box>
                    <Typography
                      component="h1"
                      variant="h4"
                      sx={{
                        fontSize: { xs: '1.5rem', sm: '2.125rem' },
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: { xs: 0.5, sm: 1 },
                      }}
                    >
                      Forgot Password?
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                      Enter your email address and we'll send you a link to reset your password.
                    </Typography>
                  </Box>

                  {error && (
                    <Alert
                      severity="error"
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                      }}
                    >
                      {error}
                    </Alert>
                  )}

                  {success && (
                    <Alert
                      severity="success"
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                      }}
                    >
                      If the email exists, a password reset link has been sent to your email address. Please check your inbox and follow the instructions.
                    </Alert>
                  )}

                  {!success && (
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: { xs: 0.5, sm: 1 } }}>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={handleChange}
                        error={!!validationError}
                        helperText={validationError}
                        size={isMobile ? 'small' : 'medium'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon
                                sx={{ fontSize: { xs: 20, sm: 24 } }}
                                color={validationError ? 'error' : 'action'}
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          mt: { xs: 1.5, sm: 2 },
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                            },
                            '&.Mui-focused': {
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                            },
                          },
                        }}
                      />
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        disabled={loading || !email || !!validationError}
                        sx={{
                          mt: { xs: 2, sm: 3 },
                          mb: { xs: 1.5, sm: 2 },
                          py: { xs: 1.25, sm: 1.5 },
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          fontWeight: 600,
                          textTransform: 'none',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                          },
                          '&:disabled': {
                            background: 'rgba(0, 0, 0, 0.12)',
                            color: 'rgba(0, 0, 0, 0.26)',
                          },
                        }}
                      >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </Button>
                    </Box>
                  )}

                  <Box sx={{ textAlign: 'center', mt: { xs: 1.5, sm: 2 } }}>
                    <Link
                      component={RouterLink}
                      to="/login"
                      sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                        fontWeight: 600,
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      <ArrowBack sx={{ fontSize: 16 }} />
                      Back to Login
                    </Link>
                  </Box>
                </Paper>
              </Zoom>
            </Box>
          </Fade>
        </Container>
      </Box>
    </>
  );
}

export default ForgotPassword;

