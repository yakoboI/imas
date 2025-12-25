import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import {
  Business,
  People,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import superAdminService from '../services/superAdminService';
import { toast } from 'react-toastify';

function Dashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    systemHealth: 'unknown',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [overview, health] = await Promise.allSettled([
        superAdminService.getAnalyticsOverview(),
        superAdminService.getSystemHealth(),
      ]);

      // Handle overview result
      if (overview.status === 'fulfilled') {
        setStats(prev => ({
          ...prev,
          totalTenants: overview.value.totalTenants || 0,
          activeTenants: overview.value.activeTenants || 0,
          totalUsers: overview.value.totalUsers || 0,
        }));
      } else if (overview.reason?.response?.status !== 401) {
        // Only show error if not 401 (401 is handled by interceptor)
        console.error('Failed to load analytics overview:', overview.reason);
      }

      // Handle health result
      if (health.status === 'fulfilled') {
        setStats(prev => ({
          ...prev,
          systemHealth: health.value.status === 'ok' ? 'healthy' : 'unhealthy',
        }));
      } else if (health.reason?.response?.status !== 401) {
        // Only show error if not 401 (401 is handled by interceptor)
        console.error('Failed to load system health:', health.reason);
        setStats(prev => ({
          ...prev,
          systemHealth: 'unknown',
        }));
      }
    } catch (error) {
      // Only show toast for non-401 errors
      if (error?.response?.status !== 401) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Tenants',
      value: stats.totalTenants,
      icon: <Business />,
      color: '#9c27b0',
    },
    {
      title: 'Active Tenants',
      value: stats.activeTenants,
      icon: <CheckCircle />,
      color: '#2e7d32',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <People />,
      color: '#1976d2',
    },
    {
      title: 'System Health',
      value: stats.systemHealth,
      icon: <TrendingUp />,
      color: stats.systemHealth === 'healthy' ? '#2e7d32' : '#d32f2f',
    },
  ];

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
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Platform overview and statistics
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 2 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={2}
              sx={{
                p: { xs: 2, sm: 2.5 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                height: '100%',
                minHeight: { xs: 100, sm: 120 },
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: { xs: 'none', sm: 'translateY(-4px)' },
                  boxShadow: { xs: 2, sm: 4 },
                },
              }}
            >
              <Box
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  borderRadius: 1.5,
                  backgroundColor: `${stat.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                  mb: 1.5,
                }}
              >
                {React.cloneElement(stat.icon, { sx: { fontSize: { xs: 20, sm: 24 } } })}
              </Box>
              <Box>
                <Typography 
                  fontWeight="bold"
                  sx={{ 
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    lineHeight: 1.2,
                    mb: 0.5,
                    color: stat.color,
                  }}
                >
                  {typeof stat.value === 'string' ? stat.value.charAt(0).toUpperCase() + stat.value.slice(1) : stat.value}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    lineHeight: 1.4,
                  }}
                >
                  {stat.title}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Dashboard;

