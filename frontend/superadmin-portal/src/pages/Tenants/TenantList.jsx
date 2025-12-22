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
      toast.success('Tenant deleted');
      setDeleteDialog({ open: false, tenant: null });
      loadTenants();
    } catch (error) {
      toast.error('Failed to delete tenant');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Tenants</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/tenants/create')}
        >
          Create Tenant
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Subdomain</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Users</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>{tenant.name}</TableCell>
                <TableCell>{tenant.subdomain}</TableCell>
                <TableCell>
                  <Chip
                    label={tenant.plan_type}
                    size="small"
                    color={getPlanColor(tenant.plan_type)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={tenant.status}
                    size="small"
                    color={getStatusColor(tenant.status)}
                  />
                </TableCell>
                <TableCell>{tenant.max_users || 'N/A'}</TableCell>
                <TableCell>
                  {new Date(tenant.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/tenants/${tenant.id}`)}
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/tenants/${tenant.id}/edit`)}
                  >
                    <Edit />
                  </IconButton>
                  {tenant.status === 'active' ? (
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => handleSuspend(tenant.id)}
                    >
                      <Block />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleActivate(tenant.id)}
                    >
                      <CheckCircle />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteDialog({ open: true, tenant })}
                  >
                    <Delete />
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

