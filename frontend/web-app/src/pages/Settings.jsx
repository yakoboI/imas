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
  Alert,
  Chip,
} from '@mui/material';
import { Save, Settings as SettingsIcon, CheckCircle, Error as ErrorIcon, Delete, Verified } from '@mui/icons-material';
import { toast } from 'react-toastify';
import tenantSettingsService from '../services/tenantSettingsService';
import traIntegrationService from '../services/traIntegrationService';
import notificationService from '../services/notificationService';
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
  const [traConfig, setTraConfig] = useState({
    tenantTIN: '',
    vfdSerialNum: '',
    traVerified: false,
    traVerifiedAt: null,
    lastZReportDate: null,
    currentGlobalCounter: 0,
    hasCertificate: false,
    hasPassword: false
  });
  const [traLoading, setTraLoading] = useState(false);
  const [traSaving, setTraSaving] = useState(false);
  const [traVerifying, setTraVerifying] = useState(false);
  const [testingNotification, setTestingNotification] = useState({ type: null, loading: false });
  const [traFormData, setTraFormData] = useState({
    tin: '',
    vfdSerialNum: '',
    certPassword: '',
    traApiEndpoint: ''
  });
  const [certFile, setCertFile] = useState(null);

  useEffect(() => {
    loadSettings();
    loadTraConfiguration();
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

  const loadTraConfiguration = async () => {
    setTraLoading(true);
    try {
      const response = await traIntegrationService.getConfiguration();
      setTraConfig(response);
      setTraFormData({
        tin: response.tenantTIN || '',
        vfdSerialNum: response.vfdSerialNum || '',
        certPassword: '',
        traApiEndpoint: response.traApiEndpoint || ''
      });
    } catch (error) {
      console.error('Failed to load TRA configuration:', error);
      // Don't show error toast if TRA is not configured yet
    } finally {
      setTraLoading(false);
    }
  };

  const handleTraConfigure = async () => {
    if (!isAdmin) {
      toast.error('Only administrators can configure TRA integration');
      return;
    }

    if (!traFormData.tin || !traFormData.vfdSerialNum || !traFormData.certPassword) {
      toast.error('TIN, VFD Serial Number, and Certificate Password are required');
      return;
    }

    if (!certFile && !traConfig.hasCertificate) {
      toast.error('Please upload a PFX certificate file');
      return;
    }

    setTraSaving(true);
    try {
      const formData = new FormData();
      formData.append('tin', traFormData.tin);
      formData.append('vfdSerialNum', traFormData.vfdSerialNum);
      formData.append('certPassword', traFormData.certPassword);
      if (certFile) {
        formData.append('certificate', certFile);
      }
      if (traFormData.traApiEndpoint) {
        formData.append('traApiEndpoint', traFormData.traApiEndpoint);
      }

      const response = await traIntegrationService.configureIntegration(formData);
      
      if (response.validation?.success) {
        toast.success('TRA integration configured and verified successfully!');
      } else {
        toast.warning('TRA integration configured, but verification failed: ' + (response.validation?.message || 'Unknown error'));
      }
      
      await loadTraConfiguration();
      setCertFile(null);
    } catch (error) {
      console.error('Failed to configure TRA integration:', error);
      toast.error(error.response?.data?.error || 'Failed to configure TRA integration');
    } finally {
      setTraSaving(false);
    }
  };

  const handleTraVerify = async () => {
    setTraVerifying(true);
    try {
      const response = await traIntegrationService.verifyCredentials();
      if (response.success) {
        toast.success('TRA credentials verified successfully!');
      } else {
        toast.error('TRA credentials verification failed: ' + (response.message || 'Unknown error'));
      }
      await loadTraConfiguration();
    } catch (error) {
      console.error('Failed to verify TRA credentials:', error);
      toast.error(error.response?.data?.error || 'Failed to verify TRA credentials');
    } finally {
      setTraVerifying(false);
    }
  };

  const handleTraRemove = async () => {
    if (!window.confirm('Are you sure you want to remove TRA integration? This action cannot be undone.')) {
      return;
    }

    try {
      await traIntegrationService.removeIntegration();
      toast.success('TRA integration removed successfully');
      await loadTraConfiguration();
      setCertFile(null);
    } catch (error) {
      console.error('Failed to remove TRA integration:', error);
      toast.error(error.response?.data?.error || 'Failed to remove TRA integration');
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

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              TRA EFDMS Integration
            </Typography>
            <Divider sx={{ my: 2 }} />
            {!isAdmin && (
              <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontStyle: 'italic' }}>
                ⚠️ TRA integration can only be configured by administrators
              </Typography>
            )}
            
            {traConfig.traVerified && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Verified /> TRA Integration Verified
                  {traConfig.traVerifiedAt && (
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      Verified on: {new Date(traConfig.traVerifiedAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </Alert>
            )}

            {traConfig.lastZReportDate && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Last Z-Report: {new Date(traConfig.lastZReportDate).toLocaleDateString()} 
                (Counter: {traConfig.currentGlobalCounter})
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="TIN (Taxpayer Identification Number)"
                  value={traFormData.tin}
                  onChange={(e) => setTraFormData({ ...traFormData, tin: e.target.value })}
                  disabled={!isAdmin || traSaving}
                  helperText="Your TRA Taxpayer Identification Number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="VFD Serial Number"
                  value={traFormData.vfdSerialNum}
                  onChange={(e) => setTraFormData({ ...traFormData, vfdSerialNum: e.target.value })}
                  disabled={!isAdmin || traSaving}
                  helperText="Virtual Fiscal Device Serial Number from TRA"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="file"
                  label="PFX Certificate File"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ accept: '.pfx,.p12' }}
                  onChange={(e) => setCertFile(e.target.files[0] || null)}
                  disabled={!isAdmin || traSaving}
                  helperText="Upload your .pfx or .p12 certificate file from TRA (max 5MB)"
                />
                {traConfig.hasCertificate && !certFile && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Certificate already uploaded. Upload a new file to replace it.
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="Certificate Password"
                  value={traFormData.certPassword}
                  onChange={(e) => setTraFormData({ ...traFormData, certPassword: e.target.value })}
                  disabled={!isAdmin || traSaving}
                  helperText="Password for the PFX certificate file"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="TRA API Endpoint (Optional)"
                  value={traFormData.traApiEndpoint}
                  onChange={(e) => setTraFormData({ ...traFormData, traApiEndpoint: e.target.value })}
                  disabled={!isAdmin || traSaving}
                  helperText="Leave empty to use default TRA endpoint"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleTraConfigure}
                disabled={traSaving || !isAdmin}
                size={isSmallScreen ? 'small' : 'medium'}
              >
                {traSaving ? 'Configuring...' : traConfig.traVerified ? 'Update Configuration' : 'Configure TRA Integration'}
              </Button>
              
              {traConfig.traVerified && (
                <Button
                  variant="outlined"
                  startIcon={<Verified />}
                  onClick={handleTraVerify}
                  disabled={traVerifying || !isAdmin}
                  size={isSmallScreen ? 'small' : 'medium'}
                >
                  {traVerifying ? 'Verifying...' : 'Verify Credentials'}
                </Button>
              )}

              {(traConfig.tenantTIN || traConfig.vfdSerialNum) && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleTraRemove}
                  disabled={!isAdmin}
                  size={isSmallScreen ? 'small' : 'medium'}
                >
                  Remove Integration
                </Button>
              )}
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>About TRA EFDMS Integration:</strong><br />
                Configure your Tanzania Revenue Authority credentials to automatically submit invoices and daily Z-Reports to TRA.
                All invoices generated will be automatically submitted to TRA EFDMS, and daily Z-Reports will be sent automatically at the end of each business day.
              </Typography>
            </Alert>
          </Paper>
        </Grid>

        {/* Notification Testing Section (Admin Only) */}
        {isAdmin && (
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon /> Notification Testing (Admin/Dev Tools)
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Development Tools:</strong> Use these buttons to test notification functionality. 
                  This will send test notifications to verify that your notification system is working correctly.
                </Typography>
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={async () => {
                      setTestingNotification({ type: 'low-stock', loading: true });
                      try {
                        await notificationService.testLowStockAlert();
                        toast.success('Low stock alert test notification sent successfully');
                      } catch (error) {
                        console.error('Failed to test low stock alert:', error);
                        toast.error(error.response?.data?.error || 'Failed to send test notification');
                      } finally {
                        setTestingNotification({ type: null, loading: false });
                      }
                    }}
                    disabled={testingNotification.loading}
                    size={isSmallScreen ? 'small' : 'medium'}
                  >
                    {testingNotification.type === 'low-stock' && testingNotification.loading ? 'Testing...' : 'Test Low Stock Alert'}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={async () => {
                      setTestingNotification({ type: 'order-update', loading: true });
                      try {
                        await notificationService.testOrderUpdate();
                        toast.success('Order update test notification sent successfully');
                      } catch (error) {
                        console.error('Failed to test order update:', error);
                        toast.error(error.response?.data?.error || 'Failed to send test notification');
                      } finally {
                        setTestingNotification({ type: null, loading: false });
                      }
                    }}
                    disabled={testingNotification.loading}
                    size={isSmallScreen ? 'small' : 'medium'}
                  >
                    {testingNotification.type === 'order-update' && testingNotification.loading ? 'Testing...' : 'Test Order Update'}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={async () => {
                      setTestingNotification({ type: 'daily-digest', loading: true });
                      try {
                        await notificationService.testDailyDigest();
                        toast.success('Daily digest test notification sent successfully');
                      } catch (error) {
                        console.error('Failed to test daily digest:', error);
                        toast.error(error.response?.data?.error || 'Failed to send test notification');
                      } finally {
                        setTestingNotification({ type: null, loading: false });
                      }
                    }}
                    disabled={testingNotification.loading}
                    size={isSmallScreen ? 'small' : 'medium'}
                  >
                    {testingNotification.type === 'daily-digest' && testingNotification.loading ? 'Testing...' : 'Test Daily Digest'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

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
