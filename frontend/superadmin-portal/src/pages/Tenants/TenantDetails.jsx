import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import superAdminService from '../../services/superAdminService';
import { toast } from 'react-toastify';

function TenantDetails() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenant();
  }, [id]);

  const loadTenant = async () => {
    try {
      const response = await superAdminService.getTenantById(id);
      setTenant(response.tenant);
    } catch (error) {
      toast.error('Failed to load tenant details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!tenant) {
    return <Typography>Tenant not found</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: 2,
          mb: 1
        }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/tenants')}
            size={isSmallScreen ? 'small' : 'medium'}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>{tenant.name}</Typography>
          <Chip
            label={tenant.status}
            color={getStatusColor(tenant.status)}
            size="small"
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 7 } }}>
          View tenant details, users, and configuration
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Tenant Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{tenant.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Subdomain
                </Typography>
                <Typography variant="body1">{tenant.subdomain}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Plan Type
                </Typography>
                <Chip label={tenant.plan_type} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Max Users
                </Typography>
                <Typography variant="body1">{tenant.max_users}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1">
                  {new Date(tenant.created_at).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Company Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              {tenant.company_name && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Company Name
                  </Typography>
                  <Typography variant="body1">{tenant.company_name}</Typography>
                </Grid>
              )}
              {tenant.company_email && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{tenant.company_email}</Typography>
                </Grid>
              )}
              {tenant.company_phone && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">{tenant.company_phone}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {tenant.users && tenant.users.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Users ({tenant.users.length})
              </Typography>
              <Divider sx={{ my: 2 }} />
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: { xs: 400, sm: 'auto' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Name</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Role</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tenant.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>{user.email}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          <Chip label={user.role} size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default TenantDetails;

