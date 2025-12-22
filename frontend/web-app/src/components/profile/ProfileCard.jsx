import React from 'react';
import { Paper, Avatar, Typography, Box, Chip } from '@mui/material';
import { useSelector } from 'react-redux';

function ProfileCard({ profile }) {
  const { user } = useSelector((state) => state.auth);

  const userInitials = profile
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Avatar
        src={profile?.avatar_url}
        sx={{
          width: 120,
          height: 120,
          mx: 'auto',
          mb: 2,
          fontSize: '3rem',
        }}
      >
        {!profile?.avatar_url && userInitials}
      </Avatar>
      <Typography variant="h5" gutterBottom>
        {profile?.first_name} {profile?.last_name}
      </Typography>
      <Chip
        label={profile?.role?.replace('_', ' ').toUpperCase()}
        color="primary"
        size="small"
        sx={{ mb: 2 }}
      />
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {profile?.email}
      </Typography>
      {profile?.phone && (
        <Typography variant="body2" color="text.secondary">
          {profile.phone}
        </Typography>
      )}
      <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          Member since: {new Date(profile?.created_at).toLocaleDateString()}
        </Typography>
        {profile?.last_login && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Last login: {new Date(profile.last_login).toLocaleString()}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default ProfileCard;

