import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit,
  Lock,
  Notifications,
  Person,
  LocationOn,
  Phone,
  Email,
  CalendarToday,
} from '@mui/icons-material';
import { fetchProfile } from '../../store/slices/userSlice';
import ProfileCard from '../../components/profile/ProfileCard';
import { toast } from 'react-toastify';

function ViewProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, loading, error } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    // Prevent duplicate fetches
    if (!profile && !loading && !fetchAttempted.current) {
      fetchAttempted.current = true;
      dispatch(fetchProfile()).catch((err) => {
        fetchAttempted.current = false; // Reset on error so retry is possible
        // Handle 429 (Too Many Requests) with user-friendly message
        if (err?.response?.status === 429) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else if (err?.response?.status !== 404) {
          console.error('Failed to fetch profile:', err);
        }
      });
    }
  }, [dispatch, profile, loading]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    const isRateLimit = error.includes('429') || error.includes('Too many requests');
    return (
      <Alert 
        severity="error" 
        sx={{ mt: 3 }}
        action={
          isRateLimit && (
            <Button color="inherit" size="small" onClick={() => {
              fetchAttempted.current = false;
              dispatch(fetchProfile());
            }}>
              Retry
            </Button>
          )
        }
      >
        {isRateLimit 
          ? 'Too many requests. Please wait a moment before trying again.'
          : `Failed to load profile: ${error}`
        }
      </Alert>
    );
  }

  // Use user from auth if profile not loaded yet
  const displayProfile = profile || user;

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">My Profile</Typography>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate('/profile/edit')}
        >
          Edit Profile
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <ProfileCard profile={displayProfile} />
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person /> Personal Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">First Name</Typography>
                <Typography variant="body1">{displayProfile?.first_name || displayProfile?.firstName || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Last Name</Typography>
                <Typography variant="body1">{displayProfile?.last_name || displayProfile?.lastName || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <Email sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  Email
                </Typography>
                <Typography variant="body1">{displayProfile?.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <Phone sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  Phone
                </Typography>
                <Typography variant="body1">{displayProfile?.phone || 'N/A'}</Typography>
              </Grid>
              {displayProfile?.date_of_birth && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <CalendarToday sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    Date of Birth
                  </Typography>
                  <Typography variant="body1">
                    {new Date(displayProfile.date_of_birth).toLocaleDateString()}
                  </Typography>
                </Grid>
              )}
              {displayProfile?.gender && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Gender</Typography>
                  <Typography variant="body1">{displayProfile.gender}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {displayProfile?.street_address && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn /> Address Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1">{displayProfile.street_address}</Typography>
              <Typography variant="body1">
                {displayProfile.city}, {displayProfile.state_province} {displayProfile.zip_postal_code}
              </Typography>
              <Typography variant="body1">{displayProfile.country}</Typography>
            </Paper>
          )}

          {displayProfile?.employee_id && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Employment Details <Chip label="Admin Only" size="small" color="primary" />
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                  <Typography variant="body1">{displayProfile.employee_id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{displayProfile.department || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Position</Typography>
                  <Typography variant="body1">{displayProfile.position || 'N/A'}</Typography>
                </Grid>
                {displayProfile?.employment_date && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Employment Date</Typography>
                    <Typography variant="body1">
                      {new Date(displayProfile.employment_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Lock />}
              onClick={() => navigate('/profile/password')}
            >
              Change Password
            </Button>
            <Button
              variant="outlined"
              startIcon={<Notifications />}
              onClick={() => navigate('/profile/notifications')}
            >
              Notification Settings
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ViewProfile;

