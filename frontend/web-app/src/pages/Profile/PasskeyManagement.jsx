import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Fingerprint,
  Delete,
  Add,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import passkeyService from '../../services/passkeyService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

function PasskeyManagement() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [error, setError] = useState(null);
  const [passkeySupported, setPasskeySupported] = useState(false);

  useEffect(() => {
    setPasskeySupported(passkeyService.isSupported());
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await passkeyService.getUserPasskeys();
      setPasskeys(data);
    } catch (err) {
      setError('Failed to load passkeys. Please try again.');
      console.error('Error loading passkeys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!deviceName.trim()) {
      toast.error('Please enter a device name');
      return;
    }

    setRegistering(true);
    setError(null);

    try {
      // Start registration
      const options = await passkeyService.startRegistration();

      // Complete registration
      await passkeyService.completeRegistration(options, deviceName.trim());

      toast.success('Passkey registered successfully!');
      setOpenDialog(false);
      setDeviceName('');
      loadPasskeys();
    } catch (err) {
      const errorMessage = err.message || 'Failed to register passkey. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error registering passkey:', err);
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (passkeyId) => {
    if (!window.confirm('Are you sure you want to delete this passkey? You will need to register it again to use it for login.')) {
      return;
    }

    setDeleting(passkeyId);
    try {
      await passkeyService.deletePasskey(passkeyId);
      toast.success('Passkey deleted successfully');
      loadPasskeys();
    } catch (err) {
      toast.error(err.message || 'Failed to delete passkey');
      console.error('Error deleting passkey:', err);
    } finally {
      setDeleting(null);
    }
  };

  if (!passkeySupported) {
    return (
      <Box>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/app/profile')} size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h5">Passkey Management</Typography>
        </Box>
        <Alert severity="warning">
          Passkeys are not supported in your browser. Please use a modern browser like Chrome, Firefox, Safari, or Edge.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/app/profile')} size="small">
            <ArrowBack />
          </IconButton>
          <Typography 
            variant="h5"
            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}
          >
            Passkey Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Passkey
        </Button>
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Fingerprint sx={{ fontSize: { xs: 18, sm: 24 } }} />
          Your Passkeys
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Passkeys allow you to sign in securely without a password using your device's biometric authentication or PIN.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : passkeys.length === 0 ? (
          <Alert severity="info">
            You don't have any passkeys registered yet. Click "Add Passkey" to register a new one.
          </Alert>
        ) : (
          <List>
            {passkeys.map((passkey, index) => (
              <React.Fragment key={passkey.id}>
                <ListItem>
                  <ListItemText
                    primaryTypographyProps={{ component: 'div' }}
                    secondaryTypographyProps={{ component: 'div' }}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" component="span">{passkey.deviceName || 'Unknown Device'}</Typography>
                        {passkey.lastUsedAt && (
                          <Chip
                            label="Active"
                            size="small"
                            color="success"
                            icon={<CheckCircle />}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                          Created: {format(new Date(passkey.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                        {passkey.lastUsedAt && (
                          <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                            Last used: {format(new Date(passkey.lastUsedAt), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(passkey.id)}
                      disabled={deleting === passkey.id}
                      color="error"
                    >
                      {deleting === passkey.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Delete />
                      )}
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < passkeys.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Register Passkey Dialog */}
      <Dialog open={openDialog} onClose={() => !registering && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register New Passkey</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Give your passkey a name to identify this device (e.g., "My iPhone", "Work Laptop").
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Device Name"
            variant="outlined"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            disabled={registering}
            placeholder="e.g., My iPhone, Work Laptop"
            sx={{ mt: 1 }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={registering}>
            Cancel
          </Button>
          <Button
            onClick={handleRegister}
            variant="contained"
            disabled={registering || !deviceName.trim()}
            startIcon={registering ? <CircularProgress size={20} /> : <Fingerprint />}
          >
            {registering ? 'Registering...' : 'Register Passkey'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PasskeyManagement;

