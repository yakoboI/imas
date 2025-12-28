import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Fade,
  Zoom,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Fingerprint as FingerprintIcon,
} from '@mui/icons-material';
import { login, passkeyLogin, clearError } from '../../store/slices/authSlice';
import SEO from '../../components/SEO';
import passkeyService from '../../services/passkeyService';
import authService from '../../services/authService';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [hasPasskeys, setHasPasskeys] = useState(null); // null = not checked yet, true/false = checked
  const [checkingPasskeys, setCheckingPasskeys] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Check passkey support
  useEffect(() => {
    const supported = passkeyService.isSupported();
    setPasskeySupported(supported);
  }, []);

  // Check if user has passkeys when email changes
  useEffect(() => {
    // Reset state when email is cleared
    if (!formData.email || !validateEmail(formData.email)) {
      setHasPasskeys(null);
      setCheckingPasskeys(false);
      return;
    }

    if (!passkeySupported) {
      setHasPasskeys(null);
      return;
    }

    let cancelled = false;

    const checkUserPasskeys = async () => {
      // Double-check conditions after debounce
      if (!formData.email || !validateEmail(formData.email) || !passkeySupported) {
        if (!cancelled) {
          setHasPasskeys(null);
        }
        return;
      }

      if (!cancelled) {
        setCheckingPasskeys(true);
      }

      try {
        const hasKeys = await passkeyService.checkPasskeys(formData.email.trim().toLowerCase());
        if (!cancelled) {
          setHasPasskeys(hasKeys);
        }
      } catch (error) {
        // On error, don't assume no passkeys - just don't show the message
        if (!cancelled) {
          setHasPasskeys(null);
        }
      } finally {
        if (!cancelled) {
          setCheckingPasskeys(false);
        }
      }
    };

    // Debounce the check
    const timer = setTimeout(checkUserPasskeys, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.email, passkeySupported]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'email':
        if (!value) {
          error = 'Email is required';
        } else if (!validateEmail(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData({
      ...formData,
      [name]: fieldValue,
    });

    // Real-time validation
    if (touched[name]) {
      const error = validateField(name, fieldValue);
      setValidationErrors({
        ...validationErrors,
        [name]: error,
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, value);
    setValidationErrors({
      ...validationErrors,
      [name]: error,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = {
      email: true,
      password: true,
    };
    setTouched(allTouched);

    // Validate all fields
    const errors = {
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
    };
    setValidationErrors(errors);

    // Check if form is valid
    if (!errors.email && !errors.password) {
      dispatch(login(formData));
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handlePasskeyLogin = async () => {
    if (!formData.email || !validateEmail(formData.email)) {
      setValidationErrors({
        ...validationErrors,
        email: 'Please enter a valid email address'
      });
      return;
    }

    setPasskeyLoading(true);
    dispatch(clearError());

    try {
      // Use the passkeyLogin thunk to properly handle state updates
      await dispatch(passkeyLogin(formData.email)).unwrap();
      // Navigate will happen automatically via useEffect when isAuthenticated becomes true
    } catch (error) {
      // Error is already handled by the thunk and stored in state.error
      // Just ensure loading state is reset
    } finally {
      setPasskeyLoading(false);
    }
  };

  const isFormValid = !validationErrors.email && !validationErrors.password && formData.email && formData.password;

  return (
    <>
      <SEO
        title="Login - Sign In"
        description="Sign in to your IMAS inventory management account. Access your dashboard, manage inventory, track orders, and streamline your business operations."
        keywords="login, sign in, inventory management login, business software login, access account"
        url="/login"
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
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'float 20s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
            '50%': { transform: 'translate(-50px, -50px) rotate(180deg)' },
          },
        },
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
                    <LoginIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: 'white' }} />
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
                    Welcome Back
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    Sign in to your Inventory System account
                  </Typography>
                </Box>

                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        alignItems: 'center',
                      },
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: { xs: 0.5, sm: 1 } }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && !!validationErrors.email}
                    helperText={touched.email && validationErrors.email}
                    size={isMobile ? 'small' : 'medium'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon 
                            sx={{ fontSize: { xs: 20, sm: 24 } }}
                            color={touched.email && validationErrors.email ? 'error' : 'action'} 
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
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
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
                            onClick={handleTogglePasswordVisibility}
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
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'flex-start', sm: 'center' }, 
                    mt: { xs: 1.5, sm: 2 },
                    gap: { xs: 1, sm: 0 }
                  }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleChange}
                          color="primary"
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">Remember me</Typography>}
                    />
                    <Link
                      component={RouterLink}
                      to="/forgot-password"
                      variant="body2"
                      sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                        fontWeight: 500,
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>
                  
                  {/* Passkey Login Button */}
                  {checkingPasskeys && formData.email && !validationErrors.email && (
                    <Box sx={{ textAlign: 'center', my: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Checking for passkeys...
                      </Typography>
                    </Box>
                  )}
                  
                  {passkeySupported && hasPasskeys === true && !validationErrors.email && formData.email && !checkingPasskeys && (
                    <>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        my: 2,
                        '&::before, &::after': {
                          content: '""',
                          flex: 1,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        },
                        '&::before': { mr: 1 },
                        '&::after': { ml: 1 },
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                          OR
                        </Typography>
                      </Box>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handlePasskeyLogin}
                        disabled={passkeyLoading || checkingPasskeys || !formData.email || !!validationErrors.email}
                        startIcon={passkeyLoading ? <CircularProgress size={20} /> : <FingerprintIcon />}
                        sx={{
                          mt: { xs: 1, sm: 1 },
                          mb: { xs: 1.5, sm: 2 },
                          py: { xs: 1.25, sm: 1.5 },
                          borderRadius: 2,
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          fontWeight: 600,
                          textTransform: 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            backgroundColor: 'primary.light',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                          },
                          '&:disabled': {
                            borderColor: 'rgba(0, 0, 0, 0.12)',
                            color: 'rgba(0, 0, 0, 0.26)',
                          },
                        }}
                      >
                        {passkeyLoading ? 'Authenticating...' : 'Login with Passkey'}
                      </Button>
                    </>
                  )}
                  
                  {passkeySupported && hasPasskeys === false && formData.email && !validationErrors.email && !checkingPasskeys && (
                    <Box sx={{ textAlign: 'center', my: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        💡 No passkeys registered. After logging in, go to Profile → Security & Settings → Manage Passkeys to set one up.
                      </Typography>
                    </Box>
                  )}
                  
                  {!passkeySupported && (
                    <Box sx={{ textAlign: 'center', my: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        Passkeys not supported in this browser
                      </Typography>
                    </Box>
                  )}
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                    disabled={loading || passkeyLoading || !isFormValid}
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
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  <Box sx={{ textAlign: 'center', mt: { xs: 1.5, sm: 2 } }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                      Don't have an account?{' '}
                      <Link
                        component={RouterLink}
                        to="/register"
                        sx={{
                          textDecoration: 'none',
                          color: 'primary.main',
                          fontWeight: 600,
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Sign Up
                      </Link>
                    </Typography>
                  </Box>
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

export default Login;

