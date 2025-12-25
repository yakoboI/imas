import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  MenuItem,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import superAdminService from '../../services/superAdminService';
import { toast } from 'react-toastify';

// Plan pricing configuration (should match backend)
const PLAN_PRICES = {
  free: { monthly: 0, name: 'Free', maxUsers: 5, maxWarehouses: 1 },
  basic: { monthly: 29, name: 'Basic', maxUsers: 6, maxWarehouses: 1 },
  professional: { monthly: 99, name: 'Professional', maxUsers: 999999, maxWarehouses: 3 },
  enterprise: { monthly: 299, name: 'Enterprise', maxUsers: 999999, maxWarehouses: 999999 }
};

function TenantEdit() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    planType: 'free',
    maxUsers: 5,
    maxWarehouses: 1,
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTenant, setLoadingTenant] = useState(true);

  useEffect(() => {
    loadTenant();
  }, [id]);

  const loadTenant = async () => {
    try {
      const response = await superAdminService.getTenantById(id);
      const tenant = response.tenant;
      setFormData({
        name: tenant.name || '',
        subdomain: tenant.subdomain || '',
        planType: tenant.plan_type || 'free',
        maxUsers: tenant.max_users || 5,
        maxWarehouses: tenant.max_warehouses || 1,
        company_name: tenant.company_name || '',
        company_email: tenant.company_email || '',
        company_phone: tenant.company_phone || '',
        company_address: tenant.company_address || '',
      });
    } catch (err) {
      toast.error('Failed to load tenant details');
      navigate('/tenants');
    } finally {
      setLoadingTenant(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-update max_users and maxWarehouses when plan changes
    if (name === 'planType' && PLAN_PRICES[value]) {
      setFormData({
        ...formData,
        planType: value,
        maxUsers: PLAN_PRICES[value].maxUsers,
        maxWarehouses: PLAN_PRICES[value].maxWarehouses,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Map camelCase to snake_case for backend
      const updateData = {
        name: formData.name,
        plan_type: formData.planType,
        max_users: formData.maxUsers,
        max_warehouses: formData.maxWarehouses,
        company_name: formData.company_name || null,
        company_email: formData.company_email || null,
        company_phone: formData.company_phone || null,
        company_address: formData.company_address || null,
      };
      await superAdminService.updateTenant(id, updateData);
      toast.success('Tenant updated successfully');
      navigate('/tenants');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update tenant');
      toast.error('Failed to update tenant');
    } finally {
      setLoading(false);
    }
  };

  if (loadingTenant) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Edit Tenant
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Update tenant information and configuration
        </Typography>
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Tenant Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Subdomain"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleChange}
                helperText="Unique subdomain for this tenant (e.g., companyname)"
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Plan Type"
                name="planType"
                value={formData.planType}
                onChange={handleChange}
              >
                <MenuItem value="free">Free</MenuItem>
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Max Users"
                name="maxUsers"
                value={formData.maxUsers}
                onChange={handleChange}
                inputProps={{ 
                  min: 1, 
                  max: PLAN_PRICES[formData.planType]?.maxUsers || 999999 
                }}
                helperText={`Plan limit: ${PLAN_PRICES[formData.planType]?.maxUsers === 999999 ? 'Unlimited' : PLAN_PRICES[formData.planType]?.maxUsers} users`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Max Warehouses"
                name="maxWarehouses"
                value={formData.maxWarehouses}
                onChange={handleChange}
                inputProps={{ 
                  min: 1, 
                  max: PLAN_PRICES[formData.planType]?.maxWarehouses || 999999 
                }}
                helperText={`Plan limit: ${PLAN_PRICES[formData.planType]?.maxWarehouses === 999999 ? 'Unlimited' : PLAN_PRICES[formData.planType]?.maxWarehouses} warehouse${PLAN_PRICES[formData.planType]?.maxWarehouses === 1 ? '' : 's'}`}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Company Information (Optional)
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Email"
                name="company_email"
                type="email"
                value={formData.company_email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Phone"
                name="company_phone"
                value={formData.company_phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Address"
                name="company_address"
                multiline
                rows={3}
                value={formData.company_address}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2, 
            justifyContent: 'flex-end', 
            mt: 3 
          }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/tenants')}
              fullWidth={isSmallScreen}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              fullWidth={isSmallScreen}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              {loading ? 'Updating...' : 'Update Tenant'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default TenantEdit;

