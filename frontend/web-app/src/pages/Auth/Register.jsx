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
  Grid,
} from '@mui/material';
import { toast } from 'react-toastify';
import { register, clearError } from '../../store/slices/authSlice';
import SEO from '../../components/SEO';

function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    tenantName: '',
    subdomain: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      dispatch(clearError());
      setRegistrationSuccess(false);
      return;
    }
    setRegistrationSuccess(false); // Clear previous success state
    try {
      const result = await dispatch(register(formData));
      // Check if the action was fulfilled (successful)
      if (result.type === 'auth/register/fulfilled') {
        setRegistrationSuccess(true);
        toast.success('Account created successfully! Redirecting to login...');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (result.type === 'auth/register/rejected') {
        // Error is already set in the reducer
        setRegistrationSuccess(false);
      }
    } catch (err) {
      // Error is handled by the reducer
      console.error('Registration error:', err);
      setRegistrationSuccess(false);
    }
  };

  // Clear error when component unmounts or form changes
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  console.log('Register component rendering...');

  return (
    <>
      <SEO
        title="Create Account - Sign Up"
        description="Create your free account and start managing your inventory efficiently with IMAS."
        keywords="sign up, create account, register, inventory management signup, free trial, business management software"
        url="/register"
      />
      <Container component="main" maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Box
        sx={{
          marginTop: { xs: 2, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Create Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          {registrationSuccess && (
            <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
              Account created successfully! Redirecting to login page...
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
                  helperText={
                    formData.password !== formData.confirmPassword && formData.confirmPassword !== ''
                      ? 'Passwords do not match'
                      : ''
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="tenantName"
                  label="Company Name"
                  value={formData.tenantName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="subdomain"
                  label="Subdomain"
                  value={formData.subdomain}
                  onChange={handleChange}
                  helperText="Enter your unique subdomain identifier (e.g., yourcompany). This will be used to identify your organization."
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
    </>
  );
}

export default Register;

