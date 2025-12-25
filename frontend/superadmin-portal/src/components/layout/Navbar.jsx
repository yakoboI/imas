import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Settings,
  Logout,
  CameraAlt,
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';
import superAdminService from '../../services/superAdminService';
import { toast } from 'react-toastify';

function Navbar({ onMenuClick }) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { superadmin } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleMenuClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    handleMenuClose();
  };

  const handleAvatarClick = (event) => {
    event.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const response = await superAdminService.uploadAvatar(file);
      toast.success('Profile picture updated successfully');
      // Update local storage and reload
      if (superadmin) {
        const updatedSuperadmin = { ...superadmin, avatar_url: response.avatar_url };
        localStorage.setItem('superadmin', JSON.stringify(updatedSuperadmin));
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const initials = superadmin?.name
    ? superadmin.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SA';

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
      }}
    >
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: { xs: 1, sm: 2 } }}
          size={isSmallScreen ? 'small' : 'medium'}
        >
          <MenuIcon />
        </IconButton>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
          }}
        >
          👑 SuperAdmin Portal
        </Typography>
        <Chip
          label="SUPERADMIN"
          color="secondary"
          size="small"
          sx={{ 
            mr: { xs: 1, sm: 2 }, 
            fontWeight: 'bold',
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
            height: { xs: 20, sm: 24 }
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <Typography 
            variant="body2" 
            sx={{ 
              display: { xs: 'none', md: 'block' },
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {superadmin?.name}
          </Typography>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <IconButton onClick={handleMenuOpen} color="inherit" size="small" sx={{ position: 'relative' }}>
              {superadmin?.avatar_url ? (
                <Avatar 
                  src={superadmin.avatar_url}
                  sx={{ 
                    width: { xs: 28, sm: 32 }, 
                    height: { xs: 28, sm: 32 },
                    '& img': {
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                    },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  {!superadmin.avatar_url && initials}
                </Avatar>
              ) : (
                <Avatar 
                  sx={{ 
                    width: { xs: 28, sm: 32 }, 
                    height: { xs: 28, sm: 32 }, 
                    bgcolor: 'secondary.main',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  {initials}
                </Avatar>
              )}
            </IconButton>
            {uploading && (
              <CircularProgress
                size={32}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1,
                }}
              />
            )}
            <IconButton
              onClick={handleAvatarClick}
              disabled={uploading}
              sx={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                bgcolor: 'secondary.main',
                color: 'white',
                width: 20,
                height: 20,
                '&:hover': {
                  bgcolor: 'secondary.dark',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: 12,
                },
              }}
            >
              <CameraAlt fontSize="inherit" />
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleSettings}>
              <Settings sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;

