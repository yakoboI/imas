import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
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
  IconButton,
  CircularProgress,
  Fade,
  Zoom,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  CheckCircle,
  ArrowBack,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import SEO from '../../components/SEO';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      toast.error('Invalid reset link');
    }
  }, [token]);

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');

    // Real-time validation
    if (touched[name]) {
      let error = '';
      if (name === 'password') {
        error = validatePassword(value);
      } else if (name === 'confirmPassword') {
        error = validateConfirmPassword(value, formData.password);
      }
      setValidationErrors({
        ...validationErrors,
        [name]: error,
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });

    let error = '';
    if (name === 'password') {
      error = validatePassword(value);
    } else if (name === 'confirmPassword') {
      error = validateConfirmPassword(value, formData.password);
    }

    setValidationErrors({
      ...validationErrors,
      [name]: error,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    // Mark all fields as touched
    const allTouched = {
      password: true,
      confirmPassword: true,
    };
    setTouched(allTouched);

    // Validate all fields
    const errors = {
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword, formData.password),
    };
    setValidationErrors(errors);

    // Check if form is valid
    if (errors.password || errors.confirmPassword) {
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, formData.password);
      setSuccess(true);
      toast.success('Password reset successfully! Redirecting to login...');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = 
    !validationErrors.password && 
    !validationErrors.confirmPassword && 
    formData.password && 
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  return (
    <>
      <SEO
        title="Reset Password - Set New Password"
        description="Reset your IMAS account password. Enter your new password to complete the reset process."
        keywords="reset password, new password, password reset, change password"
        url="/reset-password"
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
                        background: success
                          ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: success
                          ? '0 4px 20px rgba(46, 125, 50, 0.4)'
                          : '0 4px 20px rgba(102, 126, 234, 0.4)',
                      }}
                    >
                      {success ? (
                        <CheckCircle sx={{ fontSize: { xs: 28, sm: 32 }, color: 'white' }} />
                      ) : (
                        <LockIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: 'white' }} />
                      )}
                    </Box>
                    <Typography
                      component="h1"
                      variant="h4"
                      sx={{
                        fontSize: { xs: '1.5rem', sm: '2.125rem' },
                        fontWeight: 700,
                        background: success
                          ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: { xs: 0.5, sm: 1 },
                      }}
                    >
                      {success ? 'Password Reset!' : 'Reset Password'}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                      {success
                        ? 'Your password has been reset successfully. You will be redirected to login.'
                        : 'Enter your new password below.'}
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
                      Password has been reset successfully. You can now login with your new password.
                    </Alert>
                  )}

                  {!success && (
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: { xs: 0.5, sm: 1 } }}>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.password && !!validationErrors.password}
                        helperText={touched.password && validationErrors.password}
                        size={isMobile ? 'small' : 'medium'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon
                                sx={{ fontSize: { xs: 20, sm: 24 } }}
                                color={touched.password && validationErrors.password ? 'error' : 'action'}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                size="small"
                                sx={{ color: 'text.secondary' }}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
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
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirm New Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.confirmPassword && !!validationErrors.confirmPassword}
                        helperText={touched.confirmPassword && validationErrors.confirmPassword}
                        size={isMobile ? 'small' : 'medium'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon
                                sx={{ fontSize: { xs: 20, sm: 24 } }}
                                color={touched.confirmPassword && validationErrors.confirmPassword ? 'error' : 'action'}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                                size="small"
                                sx={{ color: 'text.secondary' }}
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
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
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                        disabled={loading || !isFormValid || !token}
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
                        {loading ? 'Resetting Password...' : 'Reset Password'}
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

export default ResetPassword;

