import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress, GlobalStyles, IconButton, Tooltip } from '@mui/material';
import {
  Inventory,
  ShoppingCart,
  Receipt,
  TrendingUp,
  PendingActions,
  ReceiptLong,
  Warning,
  Refresh,
} from '@mui/icons-material';
import dashboardService from '../services/dashboardService';
import tenantSettingsService from '../services/tenantSettingsService';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/currency';
import ActivityFeed from '../components/ActivityFeed';
import CostSavingsCalculator from '../components/CostSavingsCalculator';
import ExpandableCostSavingsCalculator from '../components/ExpandableCostSavingsCalculator';
import RevenueChart from '../components/charts/RevenueChart';
import OrdersChart from '../components/charts/OrdersChart';
import StatusDistributionChart from '../components/charts/StatusDistributionChart';


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
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [chartData, setChartData] = useState({
    revenueByDate: [],
    ordersByDate: [],
    ordersByStatus: [],
    paymentMethods: [],
  });
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
    loadSettings();
    loadChartData();
    
    // Refresh dashboard stats every 10 seconds for near real-time updates
    const interval = setInterval(() => {
      loadDashboardStats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadChartData = async () => {
    try {
      setChartLoading(true);
      const response = await dashboardService.getChartData(30); // Last 30 days
      if (response) {
        setChartData({
          revenueByDate: response.revenueByDate || [],
          ordersByDate: response.ordersByDate || [],
          ordersByStatus: response.ordersByStatus || [],
          paymentMethods: response.paymentMethods || [],
        });
      }
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadDashboardStats();
    setRefreshing(false);
    setLastRefresh(new Date());
  };

  const loadSettings = async () => {
    try {
      const response = await tenantSettingsService.getSettings();
      if (response.settings && response.settings.currency) {
        // Set currency from admin settings - this will be used for all currency formatting
        // The formatCurrency function uses Intl.NumberFormat which automatically formats
        // with the correct currency symbol based on the currency code
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
        setLastRefresh(new Date());
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load dashboard stats:', error);
        if (!refreshing) {
          toast.error('Failed to load dashboard statistics');
        }
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
      // Currency symbol is automatically determined by formatCurrency based on admin's currency choice
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
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Overview of your business metrics and statistics
            {lastRefresh && (
              <span style={{ marginLeft: '8px', fontSize: '0.75rem' }}>
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </Typography>
        </Box>
        <Tooltip title="Refresh dashboard data">
          <IconButton
            onClick={handleManualRefresh}
            disabled={refreshing}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
              },
            }}
          >
            <Refresh sx={{ 
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mt: 2 }}>
        {/* Row 1: Total products/Quantity, Total Orders, Total Receipts, Total Revenue (4 cards) */}
        <Grid item xs={6} sm={3} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: { xs: 115, sm: 130, md: 140 },
              transition: 'transform 0.2s, box-shadow 0.2s',
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <Box
              sx={{
                width: { xs: 36, sm: 48, md: 52 },
                height: { xs: 36, sm: 48, md: 52 },
                minWidth: { xs: 36, sm: 48, md: 52 },
                borderRadius: 1.5,
                backgroundColor: `${statCards[0].color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: statCards[0].color,
                flexShrink: 0,
                mb: { xs: 1, sm: 1.5 },
              }}
            >
              {React.cloneElement(statCards[0].icon, { sx: { fontSize: { xs: 20, sm: 26, md: 28 } } })}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: 'center' }}>
              <Typography 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.95rem' },
                  lineHeight: 1.3,
                  mb: { xs: 0.5, sm: 0.5 },
                  color: statCards[0].color,
                }}
              >
                {statCards[0].value}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' },
                  lineHeight: 1.4,
                }}
                textAlign="center"
              >
                {statCards[0].subtitle}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: { xs: 115, sm: 130, md: 140 },
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <Box
              sx={{
                width: { xs: 36, sm: 48, md: 52 },
                height: { xs: 36, sm: 48, md: 52 },
                minWidth: { xs: 36, sm: 48, md: 52 },
                borderRadius: 1.5,
                backgroundColor: `${statCards[1].color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: statCards[1].color,
                flexShrink: 0,
                mb: { xs: 1, sm: 1.5 },
              }}
            >
              {React.cloneElement(statCards[1].icon, { sx: { fontSize: { xs: 20, sm: 26, md: 28 } } })}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: 'center' }}>
              <Typography 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.95rem' },
                  lineHeight: 1.3,
                  mb: { xs: 0.5, sm: 0.5 },
                  color: statCards[1].color,
                }}
              >
                {statCards[1].value}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  lineHeight: 1.4,
                }}
                textAlign="center"
              >
                {statCards[1].title}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: { xs: 115, sm: 130, md: 140 },
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <Box
              sx={{
                width: { xs: 36, sm: 48, md: 52 },
                height: { xs: 36, sm: 48, md: 52 },
                minWidth: { xs: 36, sm: 48, md: 52 },
                borderRadius: 1.5,
                backgroundColor: `${statCards[2].color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: statCards[2].color,
                flexShrink: 0,
                mb: { xs: 1, sm: 1.5 },
              }}
            >
              {React.cloneElement(statCards[2].icon, { sx: { fontSize: { xs: 20, sm: 26, md: 28 } } })}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: 'center' }}>
              <Typography 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.95rem' },
                  lineHeight: 1.3,
                  mb: { xs: 0.5, sm: 0.5 },
                  color: statCards[2].color,
                }}
              >
                {statCards[2].value}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  lineHeight: 1.4,
                }}
                textAlign="center"
              >
                {statCards[2].title}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        {/* Row 2: Total Revenue, Pending Orders, Sales Without Receipts, Low Stock (4 cards, with last one wrapping) */}
        <Grid item xs={6} sm={3} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: { xs: 115, sm: 130, md: 140 },
              transition: 'transform 0.2s, box-shadow 0.2s',
              position: 'relative',
              overflow: 'visible',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-4px)' },
                boxShadow: { xs: 2, sm: 4 },
              },
            }}
          >
            <Box
              sx={{
                width: { xs: 36, sm: 48, md: 52 },
                height: { xs: 36, sm: 48, md: 52 },
                minWidth: { xs: 36, sm: 48, md: 52 },
                borderRadius: 1.5,
                backgroundColor: `${statCards[3].color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: statCards[3].color,
                flexShrink: 0,
                mb: { xs: 1, sm: 1.5 },
              }}
            >
              {React.cloneElement(statCards[3].icon, { sx: { fontSize: { xs: 20, sm: 26, md: 28 } } })}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: 'center' }}>
              <Typography 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.95rem' },
                  lineHeight: 1.3,
                  mb: { xs: 0.5, sm: 0.5 },
                  color: statCards[3].color,
                }}
              >
                {statCards[3].value}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  lineHeight: 1.4,
                }}
                textAlign="center"
              >
                {statCards[3].title}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: { xs: 125, sm: 140, md: 150 },
              transition: 'transform 0.2s, box-shadow 0.2s',
              position: 'relative',
              overflow: 'visible',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-4px)' },
                boxShadow: { xs: 2, sm: 4 },
              },
            }}
          >
            {statCards[4].hasAlert && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: { xs: 14, sm: 16 },
                  height: { xs: 14, sm: 16 },
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
                width: { xs: 36, sm: 48, md: 52 },
                height: { xs: 36, sm: 48, md: 52 },
                minWidth: { xs: 36, sm: 48, md: 52 },
                borderRadius: 1.5,
                backgroundColor: `${statCards[4].color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: statCards[4].color,
                flexShrink: 0,
                mb: { xs: 1, sm: 1.5 },
              }}
            >
              {React.cloneElement(statCards[4].icon, { sx: { fontSize: { xs: 20, sm: 26, md: 28 } } })}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: 'center' }}>
              <Typography 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.95rem' },
                  lineHeight: 1.3,
                  mb: { xs: 0.5, sm: 0.5 },
                  color: statCards[4].color,
                }}
              >
                {statCards[4].value}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' },
                  lineHeight: 1.3,
                  mb: { xs: 0.25, sm: 0.5 },
                  fontWeight: 500,
                }}
                textAlign="center"
              >
                {statCards[4].subtitle}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  lineHeight: 1.4,
                }}
                textAlign="center"
              >
                {statCards[4].title}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Row 3: Sales Without Receipts, Low Stock Products (2 items for small devices) */}
        <Grid item xs={6} sm={3} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: { xs: 125, sm: 140, md: 150 },
              transition: 'transform 0.2s, box-shadow 0.2s',
              position: 'relative',
              overflow: 'visible',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-4px)' },
                boxShadow: { xs: 2, sm: 4 },
              },
            }}
          >
            {statCards[5].hasAlert && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: { xs: 14, sm: 16 },
                  height: { xs: 14, sm: 16 },
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
                width: { xs: 36, sm: 48, md: 52 },
                height: { xs: 36, sm: 48, md: 52 },
                minWidth: { xs: 36, sm: 48, md: 52 },
                borderRadius: 1.5,
                backgroundColor: `${statCards[5].color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: statCards[5].color,
                flexShrink: 0,
                mb: { xs: 1, sm: 1.5 },
              }}
            >
              {React.cloneElement(statCards[5].icon, { sx: { fontSize: { xs: 20, sm: 26, md: 28 } } })}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: 'center' }}>
              <Typography 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.95rem' },
                  lineHeight: 1.3,
                  mb: { xs: 0.5, sm: 0.5 },
                  color: statCards[5].color,
                }}
              >
                {statCards[5].value}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' },
                  lineHeight: 1.3,
                  mb: { xs: 0.25, sm: 0.5 },
                  fontWeight: 500,
                }}
                textAlign="center"
              >
                {statCards[5].subtitle}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  lineHeight: 1.4,
                }}
                textAlign="center"
              >
                {statCards[5].title}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: { xs: 125, sm: 140, md: 150 },
              transition: 'transform 0.2s, box-shadow 0.2s',
              position: 'relative',
              overflow: 'visible',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-4px)' },
                boxShadow: { xs: 2, sm: 4 },
              },
            }}
          >
            {statCards[6].hasAlert && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: { xs: 14, sm: 16 },
                  height: { xs: 14, sm: 16 },
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
                width: { xs: 36, sm: 48, md: 52 },
                height: { xs: 36, sm: 48, md: 52 },
                minWidth: { xs: 36, sm: 48, md: 52 },
                borderRadius: 1.5,
                backgroundColor: `${statCards[6].color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: statCards[6].color,
                flexShrink: 0,
                mb: { xs: 1, sm: 1.5 },
              }}
            >
              {React.cloneElement(statCards[6].icon, { sx: { fontSize: { xs: 20, sm: 26, md: 28 } } })}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: 'center' }}>
              <Typography 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.95rem' },
                  lineHeight: 1.3,
                  mb: { xs: 0.5, sm: 0.5 },
                  color: statCards[6].color,
                }}
              >
                {statCards[6].value}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' },
                  lineHeight: 1.3,
                  mb: { xs: 0.25, sm: 0.5 },
                  fontWeight: 500,
                }}
                textAlign="center"
              >
                {statCards[6].subtitle}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  lineHeight: 1.4,
                }}
                textAlign="center"
              >
                {statCards[6].title}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Analytics & Trends
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <RevenueChart data={chartData.revenueByDate} currency={currency} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatusDistributionChart
              data={chartData.ordersByStatus}
              title="Orders by Status"
              currency={currency}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <OrdersChart data={chartData.ordersByDate} currency={currency} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatusDistributionChart
              data={chartData.paymentMethods}
              title="Payment Methods"
              currency={currency}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Activity Feed Section */}
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ActivityFeed limit={5} />
          </Grid>
          <Grid item xs={12} md={6}>
            <ExpandableCostSavingsCalculator />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;

