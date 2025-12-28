import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Save, Backup } from '@mui/icons-material';
import superAdminService from '../../services/superAdminService';
import { toast } from 'react-toastify';

function SystemSettings() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [settings, setSettings] = useState({});
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadHealth();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await superAdminService.getSystemSettings();
      setSettings(response.settings || {});
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadHealth = async () => {
    try {
      const response = await superAdminService.getSystemHealth();
      setHealth(response);
    } catch (error) {
      console.error('Failed to load system health');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await superAdminService.updateSystemSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      await superAdminService.triggerBackup();
      toast.success('Backup triggered successfully');
    } catch (error) {
      toast.error('Failed to trigger backup');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        gap: { xs: 2, sm: 0 }
      }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            System Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Configure platform-wide settings and preferences
          </Typography>
        </Box>
      </Box>

      {health && (
        <Alert
          severity={health.status === 'ok' ? 'success' : 'error'}
          sx={{ mb: 3 }}
        >
          System Status: {health.status === 'ok' ? 'Healthy' : 'Unhealthy'} | Database: {health.database}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              General Settings
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="System Name"
                value={settings.systemName || ''}
                onChange={(e) =>
                  setSettings({ ...settings, systemName: e.target.value })
                }
                sx={{ mb: 3 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.maintenanceMode || false}
                    onChange={(e) =>
                      setSettings({ ...settings, maintenanceMode: e.target.checked })
                    }
                  />
                }
                label="Maintenance Mode"
                sx={{ mb: 3, display: 'block' }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allowNewRegistrations !== false}
                    onChange={(e) =>
                      setSettings({ ...settings, allowNewRegistrations: e.target.checked })
                    }
                  />
                }
                label="Allow New Tenant Registrations"
                sx={{ mb: 3, display: 'block' }}
              />
              
              <TextField
                fullWidth
                type="number"
                label="Max Tenants"
                value={settings.maxTenants || 1000}
                onChange={(e) =>
                  setSettings({ ...settings, maxTenants: parseInt(e.target.value) || 1000 })
                }
                inputProps={{ min: 1 }}
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                type="number"
                label="Session Timeout (seconds)"
                value={settings.sessionTimeout || 3600}
                onChange={(e) =>
                  setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 3600 })
                }
                inputProps={{ min: 60 }}
                helperText="How long user sessions remain active (in seconds)"
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                select
                label="Backup Frequency"
                value={settings.backupFrequency || 'daily'}
                onChange={(e) =>
                  setSettings({ ...settings, backupFrequency: e.target.value })
                }
                SelectProps={{
                  native: true,
                }}
                sx={{ mb: 3 }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </TextField>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications !== false}
                    onChange={(e) =>
                      setSettings({ ...settings, emailNotifications: e.target.checked })
                    }
                  />
                }
                label="Email Notifications"
                sx={{ mb: 3, display: 'block' }}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving}
              size={isSmallScreen ? 'small' : 'medium'}
              fullWidth={isSmallScreen}
              sx={{ mt: 2 }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Paper>

          {/* Social Media Links Section */}
          <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Social Media Links
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage social media links displayed on the landing page
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="WhatsApp Number 1"
                value={settings.socialMedia?.whatsapp1 || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialMedia: {
                      ...(settings.socialMedia || {}),
                      whatsapp1: e.target.value,
                    },
                  })
                }
                placeholder="e.g., 255123456789 or https://wa.me/255123456789"
                helperText="Enter phone number (with country code) or full WhatsApp URL"
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="WhatsApp Number 2"
                value={settings.socialMedia?.whatsapp2 || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialMedia: {
                      ...(settings.socialMedia || {}),
                      whatsapp2: e.target.value,
                    },
                  })
                }
                placeholder="e.g., 255987654321 or https://wa.me/255987654321"
                helperText="Enter phone number (with country code) or full WhatsApp URL"
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Instagram"
                value={settings.socialMedia?.instagram || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialMedia: {
                      ...(settings.socialMedia || {}),
                      instagram: e.target.value,
                    },
                  })
                }
                placeholder="e.g., @inventora.store or https://instagram.com/inventora.store"
                helperText="Enter Instagram handle or full URL"
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Twitter"
                value={settings.socialMedia?.twitter || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialMedia: {
                      ...(settings.socialMedia || {}),
                      twitter: e.target.value,
                    },
                  })
                }
                placeholder="e.g., @inventora_store or https://twitter.com/inventora_store"
                helperText="Enter Twitter handle or full URL"
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Facebook"
                value={settings.socialMedia?.facebook || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialMedia: {
                      ...(settings.socialMedia || {}),
                      facebook: e.target.value,
                    },
                  })
                }
                placeholder="e.g., inventora.store or https://facebook.com/inventora.store"
                helperText="Enter Facebook page name or full URL"
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={settings.socialMedia?.email || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialMedia: {
                      ...(settings.socialMedia || {}),
                      email: e.target.value,
                    },
                  })
                }
                placeholder="e.g., support@inventora.store"
                helperText="Contact email address"
                sx={{ mb: 3 }}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving}
              size={isSmallScreen ? 'small' : 'medium'}
              fullWidth={isSmallScreen}
              sx={{ mt: 2 }}
            >
              {saving ? 'Saving...' : 'Save Social Media Links'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              System Actions
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Backup />}
              onClick={handleBackup}
              sx={{ mt: 2 }}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Trigger Backup
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SystemSettings;

