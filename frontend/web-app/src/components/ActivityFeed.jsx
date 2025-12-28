import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh,
  Inventory2,
  ShoppingCart,
  Person,
  Category,
  Warehouse,
  Receipt,
  Edit,
  Add,
  Delete,
} from '@mui/icons-material';
import auditService from '../services/auditService';
import { formatDistanceToNow } from 'date-fns';

const ACTION_ICONS = {
  PRODUCT: Inventory2,
  ORDER: ShoppingCart,
  CUSTOMER: Person,
  CATEGORY: Category,
  WAREHOUSE: Warehouse,
  RECEIPT: Receipt,
  INVENTORY: Inventory2,
};

const ACTION_COLORS = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  GET: 'default',
  POST: 'primary',
  PUT: 'warning',
};

function ActivityFeed({ limit = 10, userId = null }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
    // Auto-refresh every 30 seconds (only if not user-specific)
    if (!userId) {
      const interval = setInterval(loadActivities, 30000);
      return () => clearInterval(interval);
    }
  }, [limit, userId]);

  const loadActivities = async () => {
    try {
      setRefreshing(true);
      let response;
      if (userId) {
        // Use user-specific activity endpoint
        response = await auditService.getUserActivity(userId);
        // Backend returns { activity: [...] }
        const logs = response.activity || response.logs || response.data || [];
        setActivities(logs.slice(0, limit));
      } else {
        response = await auditService.getAuditLogs({ limit });
        // Backend returns { logs: [...] } or { data: [...] }
        const logs = response.logs || response.data || [];
        setActivities(logs.slice(0, limit));
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActionIcon = (entityType) => {
    const Icon = ACTION_ICONS[entityType?.toUpperCase()] || Edit;
    return <Icon />;
  };

  const getActionColor = (action) => {
    const actionType = action?.split('_')[0] || action?.split(' ')[0];
    return ACTION_COLORS[actionType] || 'default';
  };

  const formatAction = (action, entityType) => {
    if (!action) return 'Unknown action';
    
    // Clean up action string
    let formatted = action.replace(/_/g, ' ').toLowerCase();
    
    // Capitalize first letter
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    
    // Add entity type if available
    if (entityType) {
      formatted += ` ${entityType.toLowerCase()}`;
    }
    
    return formatted;
  };

  const getUserName = (user) => {
    if (!user) return 'System';
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email || 'Unknown';
  };

  if (loading && activities.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Recent Activity
        </Typography>
        <Tooltip title="Refresh">
          <IconButton
            size="small"
            onClick={loadActivities}
            disabled={refreshing}
            sx={{
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {activities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No recent activity
          </Typography>
        </Box>
      ) : (
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {activities.map((activity, index) => (
            <ListItem
              key={activity.id || index}
              sx={{
                borderBottom: index < activities.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                py: 1.5,
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: `${getActionColor(activity.action)}.light`,
                    color: `${getActionColor(activity.action)}.dark`,
                  }}
                >
                  {getActionIcon(activity.entity_type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" fontWeight={500}>
                      {formatAction(activity.action, activity.entity_type)}
                    </Typography>
                    <Chip
                      label={activity.action?.split('_')[0] || 'Action'}
                      size="small"
                      color={getActionColor(activity.action)}
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {getUserName(activity.user)} •{' '}
                      {activity.timestamp
                        ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
                        : 'Recently'}
                    </Typography>
                    {activity.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {activity.description}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}

export default ActivityFeed;

