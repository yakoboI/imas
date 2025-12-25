import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Chip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  TextField,
  MenuItem,
  Button,
  Switch,
  FormControlLabel,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Settings,
  AttachMoney,
  CurrencyExchange,
  Close,
  ArrowBack,
} from '@mui/icons-material';
import superAdminService from '../../services/superAdminService';
import { toast } from 'react-toastify';

// Currency conversion rate: USD to TSH (Tanzanian Shilling)
const USD_TO_TSH_RATE = 2500; // 1 USD = 2500 TSH

// Plan pricing configuration (should match backend)
const PLAN_PRICES = {
  free: { monthly: 0, name: 'Free' },
  basic: { monthly: 29, name: 'Basic' },
  professional: { monthly: 99, name: 'Professional' },
  enterprise: { monthly: 299, name: 'Enterprise' }
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  if (currency === 'TSH') {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

// Format currency to USD (backward compatibility)
const formatUSD = (amount) => {
  return formatCurrency(amount, 'USD');
};

function Analytics() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md')); // md breakpoint is 900px, covers iPads
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planPrices, setPlanPrices] = useState(PLAN_PRICES);
  const [currency, setCurrency] = useState('USD'); // 'USD' or 'TSH'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editForm, setEditForm] = useState({ price: 0, currency: 'USD' });

  useEffect(() => {
    loadAnalytics();
    // Load saved plan prices and currency from localStorage
    const savedPrices = localStorage.getItem('planPrices');
    const savedCurrency = localStorage.getItem('displayCurrency');
    if (savedPrices) {
      try {
        setPlanPrices(JSON.parse(savedPrices));
      } catch (e) {
        console.error('Failed to load saved plan prices:', e);
      }
    }
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
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

  const handleEditPlan = (planKey, plan) => {
    const currentPrice = planPrices[planKey]?.monthly || plan.monthly;
    setEditForm({
      price: currency === 'TSH' ? currentPrice * USD_TO_TSH_RATE : currentPrice,
      currency: currency
    });
    setEditingPlan({ planKey, plan });
    setSidebarOpen(true);
  };

  const handleSavePlan = () => {
    if (!editingPlan) return;
    
    const { planKey } = editingPlan;
    const newPrice = editForm.currency === 'TSH' 
      ? editForm.price / USD_TO_TSH_RATE  // Convert TSH back to USD for storage
      : editForm.price;

    // Update plan prices
    const updatedPrices = {
      ...planPrices,
      [planKey]: {
        ...planPrices[planKey],
        monthly: newPrice
      }
    };
    setPlanPrices(updatedPrices);
    
    // Update currency display if changed
    if (editForm.currency !== currency) {
      setCurrency(editForm.currency);
      localStorage.setItem('displayCurrency', editForm.currency);
    }

    // Save to localStorage
    localStorage.setItem('planPrices', JSON.stringify(updatedPrices));
    
    toast.success(`${planPrices[planKey].name} plan price updated successfully`);
    setEditingPlan(null);
    setSidebarOpen(false);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setEditingPlan(null);
  };

  const convertPrice = (price, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return price;
    if (fromCurrency === 'USD' && toCurrency === 'TSH') {
      return price * USD_TO_TSH_RATE;
    }
    if (fromCurrency === 'TSH' && toCurrency === 'USD') {
      return price / USD_TO_TSH_RATE;
    }
    return price;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', position: 'relative', flexDirection: { xs: 'column', lg: 'row' } }}>
      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        width: { 
          xs: '100%', 
          lg: sidebarOpen ? 'calc(100% - 400px)' : '100%' 
        }, 
        transition: 'width 0.3s',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 2,
          gap: { xs: 2, sm: 0 }
        }}>
    <Box>
            <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Analytics & Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Platform-wide analytics and insights
      </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{ minWidth: { xs: '100%', sm: 150 } }}
            size={isSmallScreen ? 'small' : 'medium'}
          >
            {sidebarOpen ? 'Close Settings' : 'Plan Settings'}
          </Button>
        </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 2 }}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', minHeight: { xs: 180, sm: 200 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', minHeight: { xs: 180, sm: 200 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Revenue Summary ({currency})
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Total Revenue ({currency})</Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {formatCurrency(convertPrice(analytics?.totalRevenue || 0, 'USD', currency), currency)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Monthly Revenue ({currency})</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(convertPrice(analytics?.monthlyRevenue || 0, 'USD', currency), currency)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">This Month Revenue ({currency})</Typography>
                <Typography variant="h6" fontWeight="bold" color="info.main">
                  {formatCurrency(convertPrice(analytics?.thisMonthRevenue || 0, 'USD', currency), currency)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Active Subscriptions</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {analytics?.activeSubscriptions || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">Avg Revenue per Tenant ({currency})</Typography>
                <Typography variant="h6" fontWeight="bold" color="info.main">
                  {formatCurrency(convertPrice(analytics?.avgRevenuePerTenant || 0, 'USD', currency), currency)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', minHeight: { xs: 180, sm: 200 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Usage Statistics
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Total Orders</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {analytics?.totalOrders?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Products Created</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {analytics?.totalProducts?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Total Customers</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {analytics?.totalCustomers?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1">Total Receipts</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {analytics?.totalReceipts?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">System Uptime</Typography>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  color={analytics?.systemHealth === 'healthy' ? 'success.main' : 'error.main'}
                >
                  {analytics?.systemUptime || 0}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', minHeight: { xs: 180, sm: 200 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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

        <Grid item xs={12}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' }, 
              mb: 2,
              gap: { xs: 1, sm: 0 }
            }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Plan Pricing & Distribution (Monthly in {currency})
              </Typography>
              <Chip 
                label={`Display: ${currency}`}
                color="primary"
                variant="outlined"
                icon={currency === 'USD' ? <AttachMoney /> : <CurrencyExchange />}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              {Object.entries(planPrices).map(([key, plan]) => {
                // planDistribution is an object with plan types as keys and counts as values
                const tenantCount = analytics?.planDistribution?.[key] || 0;
                const percentage = analytics?.totalTenants > 0 
                  ? ((tenantCount / analytics.totalTenants) * 100).toFixed(1)
                  : 0;
                const displayPrice = convertPrice(plan.monthly, 'USD', currency);
                
                return (
                  <Grid item xs={12} sm={6} md={3} key={key} sx={{ display: 'flex' }}>
                    <Box
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        textAlign: 'center',
                        width: '100%',
                        height: '100%',
                        minHeight: { xs: '180px', sm: '220px' },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: tenantCount > 0 ? 'action.hover' : 'background.paper',
                        position: 'relative',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: { xs: 'none', sm: 'translateY(-2px)' },
                          boxShadow: { xs: 1, sm: 3 },
                        }
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Chip 
                          label={plan.name} 
                          color={key === 'enterprise' ? 'primary' : key === 'professional' ? 'secondary' : 'default'}
                          sx={{ mb: 2 }}
                        />
                        <Box 
                          sx={{ 
                            minHeight: { xs: '56px', sm: '64px' },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1,
                            width: '100%',
                            px: 1
                          }}
                        >
                          <Typography 
                            variant="h4" 
                            fontWeight="bold" 
                            color="primary"
                            sx={{
                              fontSize: { 
                                xs: '1.5rem', 
                                sm: '2rem',
                                md: '1.6rem',
                                lg: '1.4rem',
                                xl: '1.3rem'
                              },
                              lineHeight: 1.2,
                              fontVariantNumeric: 'tabular-nums',
                              fontFeatureSettings: '"tnum"',
                              textAlign: 'center',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              maxWidth: '100%',
                              whiteSpace: 'normal'
                            }}
                          >
                            {formatCurrency(displayPrice, currency)}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ mb: 1.5, textAlign: 'center' }}
                        >
                          per month
                        </Typography>
                        <Divider sx={{ my: 1.5 }} />
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Tenants: <strong>{tenantCount}</strong>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ({percentage}% of total)
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

        {/* Plan Settings Sidebar */}
        <Drawer
          anchor="right"
          open={sidebarOpen}
          onClose={handleCloseSidebar}
          sx={{
            '& .MuiDrawer-paper': {
              width: { xs: '100%', sm: 380, md: 400 },
              boxSizing: 'border-box',
            },
          }}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3 }, height: '100%', overflowY: 'auto' }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' }, 
              mb: 3,
              gap: { xs: 1, sm: 0 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                {editingPlan && (
                  <IconButton 
                    onClick={() => setEditingPlan(null)} 
                    size="small"
                    sx={{ mr: { xs: 0, sm: 1 } }}
                  >
                    <ArrowBack />
                  </IconButton>
                )}
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {editingPlan ? `Edit ${editingPlan.plan.name} Plan` : 'Plan Pricing Settings'}
                </Typography>
              </Box>
              <IconButton 
                onClick={handleCloseSidebar} 
                size="small"
                sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
              >
                <Close />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Global Currency Setting - Only show when not editing */}
            {!editingPlan && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Display Currency
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currency === 'TSH'}
                      onChange={(e) => {
                        const newCurrency = e.target.checked ? 'TSH' : 'USD';
                        setCurrency(newCurrency);
                        localStorage.setItem('displayCurrency', newCurrency);
                      }}
                    />
                  }
                  label={currency === 'TSH' ? 'TSH (Tanzanian Shilling)' : 'USD (US Dollar)'}
                />
                {currency === 'TSH' && (
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    Conversion Rate: 1 USD = {USD_TO_TSH_RATE.toLocaleString()} TSH
                  </Typography>
                )}
              </Paper>
            )}

            {/* Plan List - Only show when not editing */}
            {!editingPlan && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Edit Plan Prices
                </Typography>
                <List>
              {Object.entries(planPrices).map(([key, plan]) => (
                <ListItem key={key} disablePadding sx={{ mb: 2 }}>
                  <Paper sx={{ width: '100%', p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={plan.name} 
                        color={key === 'enterprise' ? 'primary' : key === 'professional' ? 'secondary' : 'default'}
                        size="small"
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleEditPlan(key, plan)}
                      >
                        Edit
                      </Button>
                    </Box>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(convertPrice(plan.monthly, 'USD', currency), currency)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      per month
                    </Typography>
                  </Paper>
                </ListItem>
              ))}
                </List>
              </>
            )}

            {/* Edit Form */}
            {editingPlan && (
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
                <Divider sx={{ my: 2 }} />
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <TextField
                  fullWidth
                  select
                  label="Currency"
                  value={editForm.currency}
                  onChange={(e) => {
                    const newCurrency = e.target.value;
                    // Convert price when currency changes
                    const convertedPrice = convertPrice(
                      editForm.price,
                      editForm.currency,
                      newCurrency
                    );
                    setEditForm({ 
                      price: convertedPrice, 
                      currency: newCurrency 
                    });
                  }}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="USD">USD (US Dollar)</MenuItem>
                  <MenuItem value="TSH">TSH (Tanzanian Shilling)</MenuItem>
                </TextField>
                {editForm.currency === 'TSH' && (
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, mb: 2 }}>
                    <Typography variant="body2" color="info.dark">
                      <strong>Conversion Rate:</strong> 1 USD = {USD_TO_TSH_RATE.toLocaleString()} TSH
                    </Typography>
                    <Typography variant="body2" color="info.dark" sx={{ mt: 0.5 }}>
                      Equivalent in USD: {formatUSD(editForm.price / USD_TO_TSH_RATE)}
                    </Typography>
                  </Box>
                )}
                {editForm.currency === 'USD' && editForm.price > 0 && (
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, mb: 2 }}>
                    <Typography variant="body2" color="info.dark">
                      <strong>Equivalent in TSH:</strong> {formatCurrency(editForm.price * USD_TO_TSH_RATE, 'TSH')}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2, 
                  mt: 2 
                }}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<ArrowBack />}
                    onClick={() => setEditingPlan(null)}
                    size={isSmallScreen ? 'small' : 'medium'}
                  >
                    Back to Plans
                  </Button>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handleSavePlan}
                    size={isSmallScreen ? 'small' : 'medium'}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
        </Drawer>
      </Box>
    </Box>
  );
}

export default Analytics;

