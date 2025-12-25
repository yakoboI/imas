import React, { useRef, useState } from 'react';
import { Paper, Avatar, Typography, Box, Chip, IconButton, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { CameraAlt } from '@mui/icons-material';
import { uploadAvatar } from '../../store/slices/userSlice';
import { toast } from 'react-toastify';

function ProfileCard({ profile }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const userInitials = profile
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
    : 'U';

  const handleAvatarClick = () => {
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
      await dispatch(uploadAvatar(file)).unwrap();
      toast.success('Profile picture updated successfully');
      // Refresh profile to get updated avatar URL
      window.location.reload();
    } catch (error) {
      toast.error(error || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-block', mb: { xs: 1.5, sm: 2 } }}>
        <Avatar
          src={profile?.avatar_url}
          onClick={handleAvatarClick}
          sx={{
            width: { xs: 80, sm: 120 },
            height: { xs: 80, sm: 120 },
            mx: 'auto',
            fontSize: { xs: '2rem', sm: '3rem' },
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
              transition: 'opacity 0.2s',
            },
            '& img': {
              objectFit: 'cover',
              width: '100%',
              height: '100%',
            },
          }}
        >
          {!profile?.avatar_url && userInitials}
        </Avatar>
        {uploading && (
          <CircularProgress
            size={isSmallScreen ? 80 : 120}
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1,
            }}
          />
        )}
        <IconButton
          onClick={handleAvatarClick}
          disabled={uploading}
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            width: { xs: 28, sm: 36 },
            height: { xs: 28, sm: 36 },
          }}
        >
          <CameraAlt fontSize="small" />
        </IconButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </Box>
      <Typography 
        variant="h5" 
        gutterBottom
        sx={{ 
          fontSize: { xs: '1.1rem', sm: '1.5rem' },
          fontWeight: { xs: 600, sm: 400 }
        }}
      >
        {profile?.first_name} {profile?.last_name}
      </Typography>
      <Chip
        label={profile?.role?.replace('_', ' ').toUpperCase()}
        color="primary"
        size="small"
        sx={{ 
          mb: { xs: 1, sm: 2 },
          fontSize: { xs: '0.65rem', sm: '0.75rem' },
          height: { xs: 20, sm: 24 }
        }}
      />
      <Typography 
        variant="body2" 
        color="text.secondary" 
        gutterBottom
        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
      >
        {profile?.email}
      </Typography>
      {profile?.phone && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          {profile.phone}
        </Typography>
      )}
      <Box sx={{ mt: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, borderTop: 1, borderColor: 'divider' }}>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
        >
          Member since: {new Date(profile?.created_at).toLocaleDateString()}
        </Typography>
        {profile?.last_login && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: { xs: 0.5, sm: 1 },
              fontSize: { xs: '0.7rem', sm: '0.875rem' }
            }}
          >
            Last login: {new Date(profile.last_login).toLocaleString()}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default ProfileCard;

