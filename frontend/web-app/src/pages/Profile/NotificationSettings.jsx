import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import userService from '../../services/userService';
import { toast } from 'react-toastify';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isSubscribedToPushNotifications
} from '../../utils/pushNotifications';

function NotificationSettings() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: false,
    lowStockAlerts: true,
    orderUpdates: true,
    reportDigests: false,
  });
  const [loading, setLoading] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [checkingPush, setCheckingPush] = useState(true);

  useEffect(() => {
    loadPreferences();
    checkPushSubscription();
  }, []);

  const checkPushSubscription = async () => {
    try {
      const subscribed = await isSubscribedToPushNotifications();
      setPushSubscribed(subscribed);
    } catch (error) {
      console.error('Error checking push subscription:', error);
    } finally {
      setCheckingPush(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await userService.getNotificationPreferences();
      if (response && response.preferences) {
        setPreferences(prev => ({ ...prev, ...response.preferences }));
      }
    } catch (error) {
      // Silently handle errors - use default preferences
      // Suppress 404/500 errors as they're expected if backend isn't fully set up
      if (error?.response?.status !== 404 && error?.response?.status !== 500) {
        // Only log unexpected errors
        if (error?.message && !error.message.includes('403')) {
          console.error('Failed to load preferences:', error);
        }
      }
      // Keep default preferences on error - user can still use the form
    }
  };

  const handleChange = (name) => async (event) => {
    const checked = event.target.checked;
    
    // Handle push notifications separately
    if (name === 'pushNotifications') {
      if (checked && !pushSubscribed) {
        // User wants to enable push notifications
        try {
          await subscribeToPushNotifications();
          setPushSubscribed(true);
          setPreferences({
            ...preferences,
            [name]: true,
          });
          toast.success('Push notifications enabled');
        } catch (error) {
          console.error('Error subscribing to push:', error);
          toast.error('Failed to enable push notifications. Please check browser permissions.');
          // Don't update preference if subscription failed
          return;
        }
      } else if (!checked && pushSubscribed) {
        // User wants to disable push notifications
        try {
          await unsubscribeFromPushNotifications();
          setPushSubscribed(false);
          setPreferences({
            ...preferences,
            [name]: false,
          });
          toast.success('Push notifications disabled');
        } catch (error) {
          console.error('Error unsubscribing from push:', error);
          toast.error('Failed to disable push notifications');
        }
      }
    } else {
      // For other preferences, just update state
      setPreferences({
        ...preferences,
        [name]: checked,
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await userService.updateNotificationPreferences(preferences);
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
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
            Notification Settings
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 7 } }}>
          Configure your notification preferences and alerts
        </Typography>
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          Email Notifications
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={preferences.emailNotifications}
              onChange={handleChange('emailNotifications')}
            />
          }
          label="Enable email notifications"
        />

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          SMS Notifications
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={preferences.smsNotifications}
              onChange={handleChange('smsNotifications')}
            />
          }
          label="Enable SMS notifications"
        />

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Push Notifications
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={preferences.pushNotifications && pushSubscribed}
              onChange={handleChange('pushNotifications')}
              disabled={checkingPush}
            />
          }
          label="Enable push notifications"
        />
        {checkingPush && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
            Checking subscription status...
          </Typography>
        )}
        {!checkingPush && !pushSubscribed && preferences.pushNotifications && (
          <Typography variant="caption" color="warning.main" sx={{ ml: 4, display: 'block' }}>
            Browser permission required. Click the switch to enable.
          </Typography>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Alert Preferences
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={preferences.lowStockAlerts}
              onChange={handleChange('lowStockAlerts')}
            />
          }
          label="Low stock alerts"
        />
        <FormControlLabel
          control={
            <Switch
              checked={preferences.orderUpdates}
              onChange={handleChange('orderUpdates')}
            />
          }
          label="Order updates"
        />
        <FormControlLabel
          control={
            <Switch
              checked={preferences.reportDigests}
              onChange={handleChange('reportDigests')}
            />
          }
          label="Daily report digests"
        />

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          mt: 3 
        }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            size={isSmallScreen ? 'small' : 'medium'}
            fullWidth={isSmallScreen}
          >
            Save Preferences
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default NotificationSettings;

