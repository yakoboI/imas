import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { changePassword } from '../../store/slices/userSlice';
import { toast } from 'react-toastify';
import { ArrowBack } from '@mui/icons-material';

function ChangePassword() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      await dispatch(changePassword(formData)).unwrap();
      toast.success('Password changed successfully');
      navigate('/app/profile');
    } catch (err) {
      setError(err);
      toast.error(err || 'Failed to change password');
    }
  };

  return (
    <Container maxWidth="sm">
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
            Change Password
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 7 } }}>
          Update your account password for enhanced security
        </Typography>
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Current Password"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="New Password"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            required
            helperText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
          />
          <TextField
            fullWidth
            margin="normal"
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            error={formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== ''}
            helperText={
              formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== ''
                ? 'Passwords do not match'
                : ''
            }
          />
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
              Change Password
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default ChangePassword;

