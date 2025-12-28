import React, { useEffect, useState } from 'react';
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
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Grid,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Warehouse as WarehouseIcon,
  Close,
} from '@mui/icons-material';
import warehouseService from '../services/warehouseService';
import userManagementService from '../services/userManagementService';
import { toast } from 'react-toastify';
import { Alert } from '@mui/material';

function Warehouses() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, warehouse: null });
  const [addDialog, setAddDialog] = useState(false);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
  });

  useEffect(() => {
    loadWarehouses();
    loadTenantInfo();
  }, []);

  const loadTenantInfo = async () => {
    try {
      const response = await userManagementService.getTenantInfo();
      setTenantInfo(response);
    } catch (error) {
      console.error('Failed to load tenant info:', error);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehouseService.getAllWarehouses();
      setWarehouses(response.warehouses || response.data || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load warehouses:', error);
      }
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.warehouse) return;

    try {
      await warehouseService.deleteWarehouse(deleteDialog.warehouse.id);
      toast.success('Warehouse deleted successfully');
      loadWarehouses();
      loadTenantInfo(); // Reload tenant info after deleting warehouse
      setDeleteDialog({ open: false, warehouse: null });
    } catch (error) {
      toast.error('Failed to delete warehouse');
    }
  };

  const warehouseLimitReached = tenantInfo && tenantInfo.warehouseCount >= tenantInfo.maxWarehouses;

  const handleAdd = () => {
    if (warehouseLimitReached) {
      toast.error(`Warehouse limit reached for your plan (${tenantInfo.maxWarehouses} warehouse${tenantInfo.maxWarehouses === 1 ? '' : 's'}). Please upgrade your plan or deactivate existing warehouses.`);
      return;
    }
    setFormData({ name: '', location: '', address: '' });
    setAddDialog(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (warehouseLimitReached) {
      toast.error(`Warehouse limit reached for your plan (${tenantInfo.maxWarehouses} warehouse${tenantInfo.maxWarehouses === 1 ? '' : 's'}).`);
      return;
    }
    try {
      await warehouseService.createWarehouse(formData);
      toast.success('Warehouse added successfully');
      setAddDialog(false);
      loadWarehouses();
      loadTenantInfo(); // Reload tenant info after adding warehouse
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to add warehouse');
    }
  };

  const filteredWarehouses = warehouses.filter((warehouse) =>
    warehouse.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Warehouses
          </Typography>
          {tenantInfo && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {tenantInfo.warehouseCount} of {tenantInfo.maxWarehouses === 999999 ? 'Unlimited' : tenantInfo.maxWarehouses} warehouse{tenantInfo.maxWarehouses === 1 ? '' : 's'} ({tenantInfo.maxWarehouses === 999999 ? '∞' : Math.max(0, tenantInfo.maxWarehouses - tenantInfo.warehouseCount)} remaining)
            </Typography>
          )}
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleAdd} 
          disabled={warehouseLimitReached}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Warehouse
        </Button>
      </Box>

      {warehouseLimitReached && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have reached the maximum number of warehouses allowed for your current plan ({tenantInfo.maxWarehouses} warehouse{tenantInfo.maxWarehouses === 1 ? '' : 's'}). Please upgrade your plan or deactivate existing warehouses to add more.
        </Alert>
      )}

      <TextField
        fullWidth
        placeholder="Search warehouses by name or address..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {filteredWarehouses.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <WarehouseIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No warehouses found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first warehouse'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Name</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Location</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>Address</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWarehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{warehouse.name || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>{warehouse.location || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>{warehouse.address || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <Chip
                      label={warehouse.status || 'active'}
                      size="small"
                      color={warehouse.status === 'active' ? 'success' : 'default'}
                      sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton 
                      size="small" 
                      color="primary"
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, warehouse })}
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
      )}

      <Dialog
        open={addDialog}
        onClose={() => setAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleAddSubmit}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Add Warehouse</span>
              {isSmallScreen && (
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={() => setAddDialog(false)}
                  aria-label="close"
                  size="small"
                >
                  <Close />
                </IconButton>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Warehouse Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, State, Country"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setAddDialog(false)}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Add Warehouse
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, warehouse: null })}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Delete Warehouse</span>
            {isSmallScreen && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => setDeleteDialog({ open: false, warehouse: null })}
                aria-label="close"
                size="small"
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.warehouse?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, warehouse: null })}
            size={isSmallScreen ? 'small' : 'medium'}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            size={isSmallScreen ? 'small' : 'medium'}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Warehouses;
