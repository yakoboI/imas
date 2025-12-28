import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { updateProfile, fetchProfile } from '../../store/slices/userSlice';
import { toast } from 'react-toastify';
import { CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

function EditProfile() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, loading } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    street_address: '',
    city: '',
    state_province: '',
    zip_postal_code: '',
    country: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });
  const [error, setError] = useState(null);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    // Load profile if not already loaded - prevent duplicate fetches
    if (!profile && !loading && !fetchAttempted.current) {
      fetchAttempted.current = true;
      dispatch(fetchProfile()).catch((err) => {
        fetchAttempted.current = false; // Reset on error
        // Handle 429 (Too Many Requests)
        if (err?.response?.status === 429) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else if (err?.response?.status !== 404) {
          console.error('Failed to fetch profile:', err);
        }
      });
    }
  }, [dispatch, profile, loading]);

  useEffect(() => {
    const sourceData = profile || user;
    if (sourceData) {
      setFormData({
        first_name: sourceData.first_name || sourceData.firstName || '',
        last_name: sourceData.last_name || sourceData.lastName || '',
        phone: sourceData.phone || '',
        date_of_birth: sourceData.date_of_birth
          ? new Date(sourceData.date_of_birth).toISOString().split('T')[0]
          : '',
        gender: sourceData.gender || '',
        street_address: sourceData.street_address || '',
        city: sourceData.city || '',
        state_province: sourceData.state_province || '',
        zip_postal_code: sourceData.zip_postal_code || '',
        country: sourceData.country || '',
        emergency_contact_name: sourceData.emergency_contact_name || '',
        emergency_contact_phone: sourceData.emergency_contact_phone || '',
        emergency_contact_relationship: sourceData.emergency_contact_relationship || '',
      });
    }
  }, [profile, user]);

  if (loading && !profile && !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully');
      navigate('/app/profile');
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          mb: 1
        }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/app/profile')}
            size={isSmallScreen ? 'small' : 'medium'}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Edit Profile
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 7 } }}>
          Update your personal information and contact details
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Personal Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                SelectProps={{ native: true }}
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </TextField>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            Address Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="street_address"
                value={formData.street_address}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State/Province"
                name="state_province"
                value={formData.state_province}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ZIP/Postal Code"
                name="zip_postal_code"
                value={formData.zip_postal_code}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            Emergency Contact
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Relationship"
                name="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2, 
            justifyContent: 'flex-end', 
            mt: 3 
          }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/profile')}
              fullWidth={isSmallScreen}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              fullWidth={isSmallScreen}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Save Changes
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default EditProfile;

