import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import {
  Inventory,
  ShoppingCart,
  Receipt,
  TrendingUp,
} from '@mui/icons-material';
import dashboardService from '../services/dashboardService';
import tenantSettingsService from '../services/tenantSettingsService';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/currency';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalReceipts: 0,
    totalRevenue: '0.00',
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    todayRevenue: '0.00'
  });
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    loadDashboardStats();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await tenantSettingsService.getSettings();
      if (response.settings && response.settings.currency) {
        setCurrency(response.settings.currency);
      }
    } catch (error) {
      // Use default currency if settings can't be loaded
      console.error('Failed to load settings:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await dashboardService.getDashboardStats();
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Products', value: stats.totalProducts.toString(), icon: <Inventory />, color: '#1976d2' },
    { title: 'Total Orders', value: stats.totalOrders.toString(), icon: <ShoppingCart />, color: '#2e7d32' },
    { title: 'Total Receipts', value: stats.totalReceipts.toString(), icon: <Receipt />, color: '#ed6c02' },
    { title: 'Total Revenue', value: formatCurrency(parseFloat(stats.totalRevenue) || 0, currency), icon: <TrendingUp />, color: '#d32f2f' },
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
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={2}
              sx={{
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: 120,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  minWidth: 48,
                  borderRadius: 2,
                  backgroundColor: `${stat.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                  flexShrink: 0,
                  mb: 1,
                }}
              >
                {React.cloneElement(stat.icon, { sx: { fontSize: 24 } })}
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: 'center' }}>
                <Typography 
                  variant="h5" 
                  fontWeight="bold"
                  sx={{ 
                    fontSize: '1.5rem',
                    lineHeight: 1.1,
                    mb: 0.5,
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  }}
                  textAlign="center"
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

