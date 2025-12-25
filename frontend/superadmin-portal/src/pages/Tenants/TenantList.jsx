import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Visibility,
} from '@mui/icons-material';
import superAdminService from '../../services/superAdminService';
import { toast } from 'react-toastify';

function TenantList() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, tenant: null });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await superAdminService.getAllTenants();
      setTenants(response.tenants || []);
    } catch (error) {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id) => {
    try {
      await superAdminService.suspendTenant(id);
      toast.success('Tenant suspended');
      loadTenants();
    } catch (error) {
      toast.error('Failed to suspend tenant');
    }
  };

  const handleActivate = async (id) => {
    try {
      await superAdminService.activateTenant(id);
      toast.success('Tenant activated');
      loadTenants();
    } catch (error) {
      toast.error('Failed to activate tenant');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.tenant) return;

    try {
      await superAdminService.deleteTenant(deleteDialog.tenant.id);
      toast.success('Tenant deleted successfully');
      setDeleteDialog({ open: false, tenant: null });
      loadTenants();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to delete tenant';
      toast.error(errorMessage);
      console.error('Delete tenant error:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'warning';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'enterprise':
        return 'primary';
      case 'professional':
        return 'info';
      case 'basic':
        return 'secondary';
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

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>Tenants</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/tenants/create')}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Create Tenant
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
        <Table sx={{ minWidth: { xs: 800, sm: 'auto' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: { xs: '20%', sm: '15%' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Name</TableCell>
              <TableCell sx={{ width: { xs: '15%', sm: '12%' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Subdomain</TableCell>
              <TableCell sx={{ width: { xs: '10%', sm: '10%' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Plan</TableCell>
              <TableCell sx={{ width: { xs: '10%', sm: '10%' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
              <TableCell sx={{ width: { xs: '12%', sm: '12%' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }} align="center">Users</TableCell>
              <TableCell sx={{ width: { xs: '12%', sm: '12%' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }} align="center">Warehouses</TableCell>
              <TableCell sx={{ width: { xs: '12%', sm: '12%' }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Created</TableCell>
              <TableCell sx={{ width: { xs: '19%', sm: '17%' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {tenant.name}
                </TableCell>
                <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {tenant.subdomain}
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  <Chip
                    label={tenant.plan_type}
                    size="small"
                    color={getPlanColor(tenant.plan_type)}
                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  <Chip
                    label={tenant.status}
                    size="small"
                    color={getStatusColor(tenant.status)}
                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                  />
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {tenant.user_count !== undefined 
                    ? `${tenant.user_count} / ${tenant.max_users === 999999 ? '∞' : tenant.max_users}`
                    : tenant.max_users || 'N/A'}
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {tenant.warehouse_count !== undefined
                    ? `${tenant.warehouse_count} / ${tenant.max_warehouses === 999999 ? '∞' : tenant.max_warehouses}`
                    : tenant.max_warehouses === 999999 ? '∞' : tenant.max_warehouses || 'N/A'}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {new Date(tenant.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/tenants/${tenant.id}`)}
                    sx={{ padding: { xs: '4px', sm: '8px' } }}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/tenants/${tenant.id}/edit`)}
                    sx={{ padding: { xs: '4px', sm: '8px' } }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  {tenant.status === 'active' ? (
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => handleSuspend(tenant.id)}
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <Block fontSize="small" />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleActivate(tenant.id)}
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <CheckCircle fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteDialog({ open: true, tenant })}
                    sx={{ padding: { xs: '4px', sm: '8px' } }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, tenant: null })}
      >
        <DialogTitle>Delete Tenant</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete tenant "{deleteDialog.tenant?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, tenant: null })}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TenantList;

