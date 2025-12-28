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
  useMediaQuery,
  useTheme,
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
  ArrowBack,
  Fingerprint,
  History,
} from '@mui/icons-material';
import { fetchProfile } from '../../store/slices/userSlice';
import ProfileCard from '../../components/profile/ProfileCard';
import ActivityFeed from '../../components/ActivityFeed';
import { toast } from 'react-toastify';

function ViewProfile() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, loading, error } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    // Fetch profile when component mounts or when navigating back
    const loadProfile = () => {
      fetchAttempted.current = true;
      dispatch(fetchProfile()).catch((err) => {
        fetchAttempted.current = false; // Reset on error so retry is possible
        // Handle 429 (Too Many Requests) with user-friendly message
        if (err?.response?.status === 429) {
          toast.error('Too many requests. Please wait a moment and try again.');
        }
      });
    };

    // Load profile on mount
    if (!profile && !loading) {
      loadProfile();
    }

    // Refresh when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading) {
        loadProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
      <Box sx={{ 
        mb: { xs: 2, sm: 3 }, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' },
              fontWeight: { xs: 600, sm: 400 }
            }}
          >
            My Profile
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            View and manage your personal information
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate('/app/profile/edit')}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Edit Profile
        </Button>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} sm={12} md={4}>
          <ProfileCard profile={displayProfile} />
        </Grid>
        <Grid item xs={12} sm={12} md={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              <Person sx={{ fontSize: { xs: 18, sm: 24 } }} /> Personal Information
            </Typography>
            <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                >
                  First Name
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {displayProfile?.first_name || displayProfile?.firstName || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                >
                  Last Name
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {displayProfile?.last_name || displayProfile?.lastName || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                >
                  <Email sx={{ fontSize: { xs: 14, sm: 16 }, verticalAlign: 'middle', mr: 0.5 }} />
                  Email
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {displayProfile?.email || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                >
                  <Phone sx={{ fontSize: { xs: 14, sm: 16 }, verticalAlign: 'middle', mr: 0.5 }} />
                  Phone
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {displayProfile?.phone || 'N/A'}
                </Typography>
              </Grid>
              {displayProfile?.date_of_birth && (
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                  >
                    <CalendarToday sx={{ fontSize: { xs: 14, sm: 16 }, verticalAlign: 'middle', mr: 0.5 }} />
                    Date of Birth
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    {new Date(displayProfile.date_of_birth).toLocaleDateString()}
                  </Typography>
                </Grid>
              )}
              {displayProfile?.gender && (
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                  >
                    Gender
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    {displayProfile.gender}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {displayProfile?.street_address && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                <LocationOn sx={{ fontSize: { xs: 18, sm: 24 } }} /> Address Information
              </Typography>
              <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
              <Typography 
                variant="body1"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}
              >
                {displayProfile.street_address}
              </Typography>
              <Typography 
                variant="body1"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}
              >
                {displayProfile.city}, {displayProfile.state_province} {displayProfile.zip_postal_code}
              </Typography>
              <Typography 
                variant="body1"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {displayProfile.country}
              </Typography>
            </Paper>
          )}

          {displayProfile?.employee_id && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Employment Details <Chip 
                  label="Admin Only" 
                  size="small" 
                  color="primary"
                  sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                />
              </Typography>
              <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                  >
                    Employee ID
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    {displayProfile.employee_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                  >
                    Department
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    {displayProfile.department || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                  >
                    Position
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    {displayProfile.position || 'N/A'}
                  </Typography>
                </Grid>
                {displayProfile?.employment_date && (
                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                    >
                      Employment Date
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      {new Date(displayProfile.employment_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* User Activity Feed */}
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, mt: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              <History sx={{ fontSize: { xs: 18, sm: 24 } }} /> Activity Feed
            </Typography>
            <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
            <ActivityFeed limit={10} userId={displayProfile?.id} />
          </Paper>

          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                mb: 2
              }}
            >
              <Fingerprint sx={{ fontSize: { xs: 18, sm: 24 } }} /> Security & Settings
            </Typography>
            <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Lock sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                  onClick={() => navigate('/app/profile/password')}
                  size={isSmallScreen ? 'small' : 'medium'}
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}
                >
                  Change Password
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Notifications sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                  onClick={() => navigate('/app/profile/notifications')}
                  size={isSmallScreen ? 'small' : 'medium'}
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}
                >
                  Notification Settings
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Fingerprint sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                  onClick={() => navigate('/app/profile/passkeys')}
                  size={isSmallScreen ? 'small' : 'medium'}
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}
                >
                  Manage Passkeys
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ViewProfile;

