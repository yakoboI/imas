import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
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
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { login, clearError } from '../../store/slices/authSlice';

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

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

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
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, fieldValue);
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

  const isFormValid = !validationErrors.email && !validationErrors.password && formData.email && formData.password;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 50%, #6a1b9a 100%)',
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
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 8s ease-in-out infinite',
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
                  boxShadow: { xs: 'none', sm: '0 8px 32px 0 rgba(156, 39, 176, 0.37)' },
                }}
              >
                {/* Header Section */}
                <Box
                  sx={{
                    textAlign: 'center',
                    mb: { xs: 1.5, sm: 2 },
                    p: { xs: 1, sm: 1.25 },
                    borderRadius: { xs: 2, sm: 3 },
                    background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-50%',
                      right: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                      animation: 'rotate 10s linear infinite',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 45, sm: 60 },
                      height: { xs: 45, sm: 60 },
                      margin: '0 auto',
                      mb: { xs: 0.5, sm: 1 },
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <AdminIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'white' }} />
                  </Box>
                  <Typography
                    component="h1"
                    variant="h4"
                    sx={{
                      fontSize: { xs: '1.5rem', sm: '1.875rem' },
                      fontWeight: 700,
                      mb: 0.25,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    👑 SuperAdmin Portal
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      opacity: 0.9,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    Platform Administration
                  </Typography>
                </Box>

                <Typography
                  component="h2"
                  variant="h5"
                  align="center"
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1.25rem', sm: '1.75rem' },
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: { xs: 2, sm: 3 },
                  }}
                >
                  Sign In
                </Typography>

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
                          boxShadow: '0 4px 12px rgba(156, 39, 176, 0.15)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
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
                          boxShadow: '0 4px 12px rgba(156, 39, 176, 0.15)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
                        },
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mt: { xs: 1.5, sm: 2 } }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleChange}
                          size="small"
                          sx={{
                            color: 'primary.main',
                            '&.Mui-checked': {
                              color: 'primary.main',
                            },
                          }}
                        />
                      }
                      label={<Typography variant="body2">Remember me</Typography>}
                    />
                  </Box>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                    disabled={loading || !isFormValid}
                    sx={{
                      mt: { xs: 2, sm: 3 },
                      mb: { xs: 1.5, sm: 2 },
                      py: { xs: 1.25, sm: 1.5 },
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 15px rgba(156, 39, 176, 0.4)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(156, 39, 176, 0.5)',
                      },
                      '&:disabled': {
                        background: 'rgba(0, 0, 0, 0.12)',
                        color: 'rgba(0, 0, 0, 0.26)',
                      },
                    }}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </Box>
              </Paper>
            </Zoom>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

export default Login;

