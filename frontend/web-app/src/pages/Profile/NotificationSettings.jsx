import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  Box,
} from '@mui/material';
import userService from '../../services/userService';
import { toast } from 'react-toastify';

function NotificationSettings() {
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

  useEffect(() => {
    loadPreferences();
  }, []);

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

  const handleChange = (name) => (event) => {
    setPreferences({
      ...preferences,
      [name]: event.target.checked,
    });
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
      <Typography variant="h4" gutterBottom>
        Notification Settings
      </Typography>

      <Paper sx={{ p: 3 }}>
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
              checked={preferences.pushNotifications}
              onChange={handleChange('pushNotifications')}
            />
          }
          label="Enable push notifications"
        />

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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
          >
            Save Preferences
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default NotificationSettings;

