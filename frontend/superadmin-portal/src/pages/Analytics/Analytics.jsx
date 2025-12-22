import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
} from '@mui/material';
import superAdminService from '../../services/superAdminService';
import { toast } from 'react-toastify';

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const overview = await superAdminService.getAnalyticsOverview();
      setAnalytics(overview);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
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
      <Typography variant="h4" gutterBottom>
        Analytics & Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Platform-wide analytics and insights
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', minHeight: 200 }}>
            <Typography variant="h6" gutterBottom>
              Platform Overview
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Total Tenants</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {analytics?.totalTenants || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Active Tenants</Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {analytics?.activeTenants || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">Total Users</Typography>
                <Typography variant="h6" fontWeight="bold" color="info.main">
                  {analytics?.totalUsers || 0}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', minHeight: 200 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Summary
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Total Revenue</Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  ${analytics?.totalRevenue?.toLocaleString() || '0.00'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Monthly Revenue</Typography>
                <Typography variant="h6" fontWeight="bold">
                  ${analytics?.monthlyRevenue?.toLocaleString() || '0.00'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">Active Subscriptions</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {analytics?.activeSubscriptions || 0}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', minHeight: 200 }}>
            <Typography variant="h6" gutterBottom>
              Usage Statistics
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Total Orders</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {analytics?.totalOrders || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Products Created</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {analytics?.totalProducts || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">System Uptime</Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  99.9%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', minHeight: 200 }}>
            <Typography variant="h6" gutterBottom>
              Tenant Growth
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">New Tenants (This Month)</Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  +{analytics?.newTenantsThisMonth || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Growth Rate</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {analytics?.growthRate ? `${analytics.growthRate}%` : '0%'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">Average Users per Tenant</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {analytics?.avgUsersPerTenant?.toFixed(1) || '0.0'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Analytics;

