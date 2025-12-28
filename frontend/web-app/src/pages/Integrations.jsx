import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Payment,
  ShoppingCart,
  AccountBalance,
  WhatsApp,
  CheckCircle,
  Cancel,
  Settings,
  Close,
  Link as LinkIcon,
  LinkOff,
  Refresh,
  History,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import integrationService from '../services/integrationService';

const INTEGRATION_ICONS = {
  payment: Payment,
  ecommerce: ShoppingCart,
  accounting: AccountBalance,
  social: WhatsApp,
};

const INTEGRATION_COLORS = {
  payment: 'primary',
  ecommerce: 'success',
  accounting: 'info',
  social: 'success',
};

function Integrations() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectDialog, setConnectDialog] = useState({ open: false, integration: null, formData: {} });
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState({ type: null, loading: false });
  const [logsDialog, setLogsDialog] = useState({ open: false, integrationType: null, logs: [], loading: false });

  useEffect(() => {
    if (isAdmin) {
      loadIntegrations();
    }
  }, [isAdmin]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await integrationService.getAvailableIntegrations();
      setIntegrations(response.integrations || []);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (integration) => {
    setConnectDialog({
      open: true,
      integration,
      formData: getDefaultFormData(integration.type),
    });
  };

  const getDefaultFormData = (type) => {
    const defaults = {
      pesapal: { consumerKey: '', consumerSecret: '', environment: 'sandbox' },
      flutterwave: { publicKey: '', secretKey: '', environment: 'sandbox' },
      dpo: { companyToken: '', serviceType: '', environment: 'sandbox' },
      shopify: { shopDomain: '', accessToken: '' },
      quickbooks: { clientId: '', clientSecret: '', redirectUri: '' },
      xero: { clientId: '', clientSecret: '', redirectUri: '' },
      whatsapp: { phoneNumberId: '', accessToken: '', businessAccountId: '' },
    };
    return defaults[type] || {};
  };

  const handleConnectSubmit = async (e) => {
    e.preventDefault();
    if (!connectDialog.integration) return;

    setConnecting(true);
    try {
      await integrationService.connectIntegration(
        connectDialog.integration.type,
        connectDialog.formData
      );
      toast.success(`${connectDialog.integration.name} connected successfully`);
      setConnectDialog({ open: false, integration: null, formData: {} });
      loadIntegrations();
    } catch (error) {
      console.error('Failed to connect integration:', error);
      toast.error(error.response?.data?.error || 'Failed to connect integration');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (type, name) => {
    if (!window.confirm(`Are you sure you want to disconnect ${name}? This action cannot be undone.`)) {
      return;
    }

    setDisconnecting({ type, loading: true });
    try {
      await integrationService.disconnectIntegration(type);
      toast.success(`${name} disconnected successfully`);
      loadIntegrations();
    } catch (error) {
      console.error('Failed to disconnect integration:', error);
      toast.error(error.response?.data?.error || 'Failed to disconnect integration');
    } finally {
      setDisconnecting({ type: null, loading: false });
    }
  };

  const handleViewLogs = async (integrationType) => {
    setLogsDialog({ open: true, integrationType, logs: [], loading: true });
    try {
      const response = await integrationService.getIntegrationLogs(integrationType, { limit: 100 });
      setLogsDialog(prev => ({ ...prev, logs: response.logs || [], loading: false }));
    } catch (error) {
      console.error('Failed to load integration logs:', error);
      toast.error('Failed to load integration logs');
      setLogsDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'error':
        return 'error';
      case 'pending_verification':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderFormFields = (type) => {
    const formData = connectDialog.formData;
    const setFormData = (newData) => setConnectDialog({ ...connectDialog, formData: newData });

    switch (type) {
      case 'pesapal':
        return (
          <>
            <TextField
              fullWidth
              label="Consumer Key"
              value={formData.consumerKey || ''}
              onChange={(e) => setFormData({ ...formData, consumerKey: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Consumer Secret"
              type="password"
              value={formData.consumerSecret || ''}
              onChange={(e) => setFormData({ ...formData, consumerSecret: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Environment"
              value={formData.environment || 'sandbox'}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </TextField>
          </>
        );
      case 'flutterwave':
        return (
          <>
            <TextField
              fullWidth
              label="Public Key"
              value={formData.publicKey || ''}
              onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Secret Key"
              type="password"
              value={formData.secretKey || ''}
              onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Environment"
              value={formData.environment || 'sandbox'}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </TextField>
          </>
        );
      case 'dpo':
        return (
          <>
            <TextField
              fullWidth
              label="Company Token"
              value={formData.companyToken || ''}
              onChange={(e) => setFormData({ ...formData, companyToken: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Service Type"
              value={formData.serviceType || ''}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
          </>
        );
      case 'shopify':
        return (
          <>
            <TextField
              fullWidth
              label="Shop Domain"
              value={formData.shopDomain || ''}
              onChange={(e) => setFormData({ ...formData, shopDomain: e.target.value })}
              placeholder="your-shop.myshopify.com"
              required
              sx={{ mb: 2 }}
              helperText="Enter your Shopify store domain"
            />
            <TextField
              fullWidth
              label="Access Token"
              type="password"
              value={formData.accessToken || ''}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
          </>
        );
      case 'quickbooks':
      case 'xero':
        return (
          <>
            <TextField
              fullWidth
              label="Client ID"
              value={formData.clientId || ''}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Client Secret"
              type="password"
              value={formData.clientSecret || ''}
              onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Redirect URI"
              value={formData.redirectUri || ''}
              onChange={(e) => setFormData({ ...formData, redirectUri: e.target.value })}
              required
              sx={{ mb: 2 }}
              helperText="OAuth redirect URI configured in your app"
            />
            <Alert severity="info" sx={{ mb: 2 }}>
              OAuth flow will be initiated after submitting these credentials. You'll be redirected to authorize the connection.
            </Alert>
          </>
        );
      case 'whatsapp':
        return (
          <>
            <TextField
              fullWidth
              label="Phone Number ID"
              value={formData.phoneNumberId || ''}
              onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Access Token"
              type="password"
              value={formData.accessToken || ''}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Business Account ID"
              value={formData.businessAccountId || ''}
              onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
          </>
        );
      default:
        return <Alert severity="warning">Configuration form not available for this integration</Alert>;
    }
  };

  if (!isAdmin) {
    return (
      <Box>
        <Alert severity="warning">
          Only administrators can manage integrations.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    const category = integration.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(integration);
    return acc;
  }, {});

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: { xs: 'center', sm: 'space-between' }, 
        alignItems: 'center', 
        mb: 3,
        gap: { xs: 2, sm: 0 }
      }}>
        <Box sx={{ textAlign: 'center', flex: { xs: 'none', sm: 1 } }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Integrations
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Connect external services to extend your inventory management capabilities
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadIntegrations}
          size={isSmallScreen ? 'small' : 'medium'}
        >
          Refresh
        </Button>
      </Box>

      {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => {
        const Icon = INTEGRATION_ICONS[category] || Settings;
        const color = INTEGRATION_COLORS[category] || 'default';

        return (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Icon color={color} /> {category.charAt(0).toUpperCase() + category.slice(1)} Integrations
            </Typography>
            <Grid container spacing={2}>
              {categoryIntegrations.map((integration) => {
                const isConnected = integration.connected;
                const status = integration.connectionStatus?.status || 'inactive';
                const isVerified = integration.connectionStatus?.verified || false;

                return (
                  <Grid item xs={6} sm={6} md={4} key={integration.type}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6">{integration.name}</Typography>
                          {isConnected && (
                            <Chip
                              label={status}
                              size="small"
                              color={getStatusColor(status)}
                              icon={isVerified ? <CheckCircle /> : <Cancel />}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {integration.description}
                        </Typography>
                        {isConnected && integration.connectionStatus?.lastSyncAt && (
                          <Typography variant="caption" color="text.secondary">
                            Last sync: {new Date(integration.connectionStatus.lastSyncAt).toLocaleString()}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions sx={{ flexDirection: 'column', gap: 1, alignItems: 'stretch' }}>
                        {isConnected ? (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<History />}
                              onClick={() => handleViewLogs(integration.type)}
                              fullWidth
                            >
                              View Logs
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<LinkOff />}
                              onClick={() => handleDisconnect(integration.type, integration.name)}
                              disabled={disconnecting.type === integration.type && disconnecting.loading}
                              fullWidth
                            >
                              {disconnecting.type === integration.type && disconnecting.loading ? 'Disconnecting...' : 'Disconnect'}
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<LinkIcon />}
                            onClick={() => handleConnect(integration)}
                            fullWidth
                          >
                            Connect
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );
      })}

      {/* Connect Dialog */}
      <Dialog
        open={connectDialog.open}
        onClose={() => setConnectDialog({ open: false, integration: null, formData: {} })}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleConnectSubmit}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Connect {connectDialog.integration?.name}</span>
              {isSmallScreen && (
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={() => setConnectDialog({ open: false, integration: null, formData: {} })}
                  aria-label="close"
                  size="small"
                >
                  <Close />
                </IconButton>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            {connectDialog.integration && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {connectDialog.integration.description}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {renderFormFields(connectDialog.integration.type)}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setConnectDialog({ open: false, integration: null, formData: {} })}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={connecting}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Integration Logs Dialog */}
      <Dialog
        open={logsDialog.open}
        onClose={() => setLogsDialog({ open: false, integrationType: null, logs: [], loading: false })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Integration Logs - {logsDialog.integrationType || 'All'}</span>
            {isSmallScreen && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => setLogsDialog({ open: false, integrationType: null, logs: [], loading: false })}
                aria-label="close"
                size="small"
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {logsDialog.loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : logsDialog.logs.length === 0 ? (
            <Typography color="text.secondary">No logs found for this integration.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Direction</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>External ID</TableCell>
                    <TableCell>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logsDialog.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip label={log.event_type} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.direction} 
                          size="small" 
                          color={log.direction === 'inbound' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.status} 
                          size="small" 
                          color={log.status === 'success' ? 'success' : log.status === 'error' ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>{log.external_id || 'N/A'}</TableCell>
                      <TableCell>
                        {log.error_message ? (
                          <Typography variant="caption" color="error">
                            {log.error_message}
                          </Typography>
                        ) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setLogsDialog({ open: false, integrationType: null, logs: [], loading: false })}
            size={isSmallScreen ? 'small' : 'medium'}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Integrations;

