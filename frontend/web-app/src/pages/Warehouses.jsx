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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import warehouseService from '../services/warehouseService';
import { toast } from 'react-toastify';

function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, warehouse: null });
  const [addDialog, setAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
  });

  useEffect(() => {
    loadWarehouses();
  }, []);

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
      setDeleteDialog({ open: false, warehouse: null });
    } catch (error) {
      toast.error('Failed to delete warehouse');
    }
  };

  const handleAdd = () => {
    setFormData({ name: '', location: '', address: '' });
    setAddDialog(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await warehouseService.createWarehouse(formData);
      toast.success('Warehouse added successfully');
      setAddDialog(false);
      loadWarehouses();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add warehouse');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Warehouses</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
          Add Warehouse
        </Button>
      </Box>

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
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWarehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell>{warehouse.name || 'N/A'}</TableCell>
                  <TableCell>{warehouse.location || 'N/A'}</TableCell>
                  <TableCell>{warehouse.address || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={warehouse.status || 'active'}
                      size="small"
                      color={warehouse.status === 'active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, warehouse })}
                    >
                      <Delete />
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
          <DialogTitle>Add Warehouse</DialogTitle>
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
            <Button onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add Warehouse</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, warehouse: null })}
      >
        <DialogTitle>Delete Warehouse</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.warehouse?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, warehouse: null })}>
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

export default Warehouses;
