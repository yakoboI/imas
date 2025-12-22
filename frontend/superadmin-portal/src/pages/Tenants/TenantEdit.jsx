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
} from '@mui/material';
import superAdminService from '../../services/superAdminService';
import { toast } from 'react-toastify';

function TenantEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    planType: 'free',
    maxUsers: 5,
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Edit Tenant
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
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
                inputProps={{ min: 1 }}
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

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate('/tenants')}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Updating...' : 'Update Tenant'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default TenantEdit;

