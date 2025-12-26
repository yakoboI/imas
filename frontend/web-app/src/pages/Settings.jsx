import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Save, Settings as SettingsIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import tenantSettingsService from '../services/tenantSettingsService';
import { useSelector } from 'react-redux';
import { CURRENCIES } from '../utils/currency';

function Settings() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    currency: 'USD',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    lowStockThreshold: 10,
  });
  const [company, setCompany] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo: '',
    taxId: ''
  });
  const [tenant, setTenant] = useState({
    name: '',
    subdomain: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await tenantSettingsService.getSettings();
      if (response.settings) {
        setSettings((prev) => ({
          ...prev,
          currency: response.settings.currency || 'USD',
          timezone: response.settings.timezone || 'UTC',
          dateFormat: response.settings.dateFormat || 'YYYY-MM-DD',
          lowStockThreshold: response.settings.lowStockThreshold || 10,
        }));
      }
      if (response.company) {
        setCompany(response.company);
        setSettings((prev) => ({
          ...prev,
          companyName: response.company.name || '',
          companyEmail: response.company.email || '',
          companyPhone: response.company.phone || '',
          companyAddress: response.company.address || '',
        }));
      }
      if (response.tenant) {
        setTenant(response.tenant);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Only administrators can update settings');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        companyName: settings.companyName,
        companyEmail: settings.companyEmail,
        companyPhone: settings.companyPhone,
        companyAddress: settings.companyAddress,
        currency: settings.currency,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        lowStockThreshold: settings.lowStockThreshold,
      };
      await tenantSettingsService.updateSettings(updateData);
      toast.success('Settings saved successfully');
      // Reload settings to get updated values
      await loadSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {isAdmin 
            ? 'Manage company information and system settings (Admin only)'
            : 'View company information and system settings. Only administrators can make changes.'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Company Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              {!isAdmin && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontStyle: 'italic' }}>
                    ⚠️ Company information can only be updated by administrators
                  </Typography>
                </Grid>
              )}
              {/* Tenant Name and Subdomain - Read Only */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name (Organization)"
                  value={tenant.name || 'N/A'}
                  disabled
                  helperText="Set during registration and cannot be changed"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Subdomain"
                  value={tenant.subdomain || 'N/A'}
                  disabled
                  helperText="Unique identifier set during registration"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  disabled={!isAdmin}
                  helperText="Business/legal company name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Email"
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  disabled={!isAdmin}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Phone"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  disabled={!isAdmin}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Address"
                  multiline
                  rows={2}
                  value={settings.companyAddress}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  disabled={!isAdmin}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Localization
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="currency-select-label">Currency</InputLabel>
                  <Select
                    labelId="currency-select-label"
                    id="currency-select"
                    value={settings.currency || 'USD'}
                    label="Currency"
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    disabled={!isAdmin}
                  >
                    {CURRENCIES.map((currency) => (
                      <MenuItem key={currency.code} value={currency.code}>
                        {currency.name} ({currency.code}) - {currency.symbol}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {!isAdmin && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontStyle: 'italic' }}>
                    ⚠️ System settings can only be updated by administrators
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  disabled={!isAdmin}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Date Format"
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  disabled={!isAdmin}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Inventory Settings
            </Typography>
            <Divider sx={{ my: 2 }} />
            {!isAdmin && (
              <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontStyle: 'italic' }}>
                ⚠️ Inventory settings can only be updated by administrators
              </Typography>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Low Stock Threshold"
                  type="number"
                  value={settings.lowStockThreshold || 10}
                  onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 10 })}
                  inputProps={{ min: 0, step: 1 }}
                  helperText="Items with quantity below this threshold will be marked as low stock"
                  disabled={!isAdmin}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving || !isAdmin}
              sx={{ mt: 3 }}
              size={isSmallScreen ? 'small' : 'medium'}
              fullWidth={isSmallScreen}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            {!isAdmin && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Only administrators can update settings
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <SettingsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Settings Help
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {isAdmin 
                ? 'Configure company information and system-wide settings. These settings apply to all users in your organization.'
                : 'These settings are managed by administrators. For personal preferences like notifications, visit your Profile settings.'}
            </Typography>
            {!isAdmin && (
              <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
                💡 Tip: Personal notification preferences can be managed in Profile → Notification Settings
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;
