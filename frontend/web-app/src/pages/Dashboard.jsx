import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress, GlobalStyles } from '@mui/material';
import {
  Inventory,
  ShoppingCart,
  Receipt,
  TrendingUp,
  PendingActions,
  ReceiptLong,
  Warning,
} from '@mui/icons-material';
import dashboardService from '../services/dashboardService';
import tenantSettingsService from '../services/tenantSettingsService';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/currency';


function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalOrders: 0,
    totalReceipts: 0,
    totalRevenue: '0.00',
    totalCustomers: 0,
    pendingOrders: 0,
    ordersWithoutReceipts: 0,
    lowStockProducts: 0,
    todayRevenue: '0.00'
  });
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    loadDashboardStats();
    loadSettings();
    
    // Refresh dashboard stats every 30 seconds to keep alerts updated
    const interval = setInterval(() => {
      loadDashboardStats();
    }, 30000);
    
    return () => clearInterval(interval);
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
        // Ensure all numeric values are properly converted
        const processedStats = {
          ...response.stats,
          pendingOrders: parseInt(response.stats.pendingOrders) || 0,
          ordersWithoutReceipts: parseInt(response.stats.ordersWithoutReceipts) || 0,
          lowStockProducts: parseInt(response.stats.lowStockProducts) || 0,
          totalProducts: parseInt(response.stats.totalProducts) || 0,
          totalQuantity: parseInt(response.stats.totalQuantity) || 0,
          totalOrders: parseInt(response.stats.totalOrders) || 0,
          totalReceipts: parseInt(response.stats.totalReceipts) || 0,
        };
        setStats(processedStats);
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

  // Calculate alert status with proper type conversion
  const pendingOrdersCount = Number(stats.pendingOrders) || 0;
  const ordersWithoutReceiptsCount = Number(stats.ordersWithoutReceipts) || 0;
  const lowStockProductsCount = Number(stats.lowStockProducts) || 0;

  const statCards = [
    { 
      title: '', 
      value: `Total products: ${stats.totalProducts}`, 
      subtitle: `Total Quantity: ${stats.totalQuantity.toLocaleString()}`,
      icon: <Inventory />, 
      color: '#1976d2',
      hasAlert: false
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toString(), 
      icon: <ShoppingCart />, 
      color: '#2e7d32',
      hasAlert: false
    },
    { 
      title: 'Total Receipts', 
      value: stats.totalReceipts.toString(), 
      icon: <Receipt />, 
      color: '#ed6c02',
      hasAlert: false
    },
    { 
      title: 'Total Revenue', 
      value: formatCurrency(parseFloat(stats.totalRevenue) || 0, currency), 
      icon: <TrendingUp />, 
      color: '#d32f2f',
      hasAlert: false
    },
    { 
      title: 'Pending Orders', 
      value: stats.pendingOrders.toString(), 
      subtitle: 'Orders awaiting completion',
      icon: <PendingActions />, 
      color: '#ff9800',
      hasAlert: pendingOrdersCount > 0,
      description: 'Orders with status "pending" that need to be completed or cancelled'
    },
    { 
      title: 'Sales Without Receipts', 
      value: stats.ordersWithoutReceipts.toString(), 
      subtitle: 'Completed sales needing receipts',
      icon: <ReceiptLong />, 
      color: '#9c27b0',
      hasAlert: ordersWithoutReceiptsCount > 0,
      description: 'Completed orders that do not have an active receipt generated'
    },
    { 
      title: 'Low Stock Products', 
      value: stats.lowStockProducts.toString(), 
      subtitle: 'Products below threshold',
      icon: <Warning />, 
      color: '#d32f2f',
      hasAlert: lowStockProductsCount > 0,
      description: 'Products with inventory quantity below the low stock threshold'
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
      <GlobalStyles
        styles={{
          '@keyframes pulseAlert': {
            '0%, 100%': {
              transform: 'scale(1)',
              opacity: 1,
              boxShadow: '0 0 15px rgba(255, 0, 0, 1), 0 0 30px rgba(255, 0, 0, 0.8), 0 0 45px rgba(255, 0, 0, 0.6)',
            },
            '50%': {
              transform: 'scale(1.5)',
              opacity: 0.95,
              boxShadow: '0 0 25px rgba(255, 0, 0, 1), 0 0 50px rgba(255, 0, 0, 0.9), 0 0 75px rgba(255, 0, 0, 0.7)',
            },
          },
        }}
      />
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Overview of your business metrics and statistics
        </Typography>
      </Box>
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 2 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={2}
              onClick={stat.clickable ? stat.onClick : undefined}
              sx={{
                p: { xs: 2, sm: 2.5 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: { xs: 100, sm: 120 },
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                overflow: 'visible',
                cursor: stat.clickable ? 'pointer' : 'default',
                '&:hover': {
                  transform: { xs: 'none', sm: 'translateY(-4px)' },
                  boxShadow: { xs: 2, sm: 4 },
                },
              }}
            >
              {/* Red LED Alert Indicator */}
              {stat.hasAlert && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: '#ff0000',
                    zIndex: 1000,
                    boxShadow: '0 0 15px rgba(255, 0, 0, 1), 0 0 30px rgba(255, 0, 0, 0.8), 0 0 45px rgba(255, 0, 0, 0.6)',
                    animation: 'pulseAlert 1s ease-in-out infinite',
                  }}
                />
              )}
              <Box
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  minWidth: { xs: 40, sm: 48 },
                  borderRadius: 1.5,
                  backgroundColor: `${stat.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                  flexShrink: 0,
                  mb: 1.5,
                }}
              >
                {React.cloneElement(stat.icon, { sx: { fontSize: { xs: 20, sm: 24 } } })}
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: 'center' }}>
                <Typography 
                  fontWeight="bold"
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    lineHeight: 1.2,
                    mb: 0.5,
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </Typography>
                {stat.subtitle && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                      lineHeight: 1.2,
                      mb: 0.5,
                      fontWeight: 500,
                    }}
                    textAlign="center"
                  >
                    {stat.subtitle}
                  </Typography>
                )}
                {stat.description && stat.hasAlert && (
                  <Typography 
                    variant="caption" 
                    color="error"
                    sx={{
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      lineHeight: 1.2,
                      mt: 0.5,
                      fontStyle: 'italic',
                    }}
                    textAlign="center"
                  >
                    ⚠️ Action required
                  </Typography>
                )}
                {stat.title && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      lineHeight: 1.4,
                    }}
                    textAlign="center"
                  >
                    {stat.title}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Dashboard;

