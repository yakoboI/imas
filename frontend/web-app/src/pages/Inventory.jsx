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
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  Add,
  Search,
  Inventory as InventoryIcon,
  TrendingUp,
  TrendingDown,
  Remove,
  Close,
} from '@mui/icons-material';
import inventoryService from '../services/inventoryService';
import productService from '../services/productService';
import warehouseService from '../services/warehouseService';
import tenantSettingsService from '../services/tenantSettingsService';
import { toast } from 'react-toastify';

function Inventory() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  });
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '',
    adjustment_type: 'set', // 'set', 'add', 'subtract'
    notes: '',
  });

  useEffect(() => {
    const initializeData = async () => {
      await loadSettings();
      await loadInventoryStats();
      await loadInventory();
      await loadProducts();
      await loadWarehouses();
    };
    initializeData();
  }, []);

  // Reload stats when threshold changes
  useEffect(() => {
    if (lowStockThreshold > 0) {
      loadInventoryStats();
    }
  }, [lowStockThreshold]);

  const loadSettings = async () => {
    try {
      const response = await tenantSettingsService.getSettings();
      if (response.settings?.lowStockThreshold !== undefined) {
        setLowStockThreshold(response.settings.lowStockThreshold);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use default threshold of 10 if settings can't be loaded
    }
  };

  const loadInventoryStats = async () => {
    try {
      const response = await inventoryService.getInventoryStats();
      if (response && response.stats) {
        setStats({
          totalItems: response.stats.totalItems ?? 0,
          lowStockItems: response.stats.lowStockItems ?? 0,
          outOfStockItems: response.stats.outOfStockItems ?? 0,
        });
        // Update threshold if provided in response
        if (response.stats.lowStockThreshold !== undefined) {
          setLowStockThreshold(response.stats.lowStockThreshold);
        }
      } else {
        // If no stats in response, set defaults
        setStats({
          totalItems: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load inventory stats:', error);
      // Set defaults on error
      setStats({
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
      });
    }
  };

  const loadInventory = async () => {
    try {
      const response = await inventoryService.getAllInventory();
      setInventory(response.inventory || response.data || []);
      // Update threshold if provided in response
      if (response.lowStockThreshold !== undefined) {
        setLowStockThreshold(response.lowStockThreshold);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load inventory:', error);
      }
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.getAllProducts();
      setProducts(response.products || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load products:', error);
      }
      setProducts([]);
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
    }
  };

  const handleAdjustStock = () => {
    setFormData({
      product_id: '',
      warehouse_id: '',
      quantity: '',
      adjustment_type: 'set',
      notes: '',
    });
    setAdjustDialog(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.adjustStock(formData);
      toast.success('Stock adjusted successfully');
      setAdjustDialog(false);
      loadInventoryStats(); // Reload statistics
      loadInventory();
      setFormData({
        product_id: '',
        warehouse_id: '',
        quantity: '',
        adjustment_type: 'set',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      toast.error(error.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'error' };
    if (quantity < lowStockThreshold) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  const filteredInventory = inventory.filter((item) =>
    item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.warehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
            Inventory
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleAdjustStock}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Adjust Stock
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.totalItems ?? 0}</Typography>
            <Typography variant="body2" color="text.secondary">Total Items</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">{stats.lowStockItems ?? 0}</Typography>
            <Typography variant="body2" color="text.secondary">Low Stock</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="error.main">{stats.outOfStockItems ?? 0}</Typography>
            <Typography variant="body2" color="text.secondary">Out of Stock</Typography>
          </Paper>
        </Grid>
      </Grid>

      <TextField
        fullWidth
        placeholder="Search inventory by product name or warehouse..."
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

      {filteredInventory.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No inventory items found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'Inventory items will appear here'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Product</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Warehouse</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Quantity</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>Unit</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.map((item) => {
                const status = getStockStatus(item.quantity);
                return (
                  <TableRow key={item.id}>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{item.product?.name || item.product_name || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{item.warehouse?.name || item.warehouse_name || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{item.quantity || 0}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>{item.unit || 'pcs'}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      <Chip label={status.label} size="small" color={status.color} sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={adjustDialog}
        onClose={() => setAdjustDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleAdjustSubmit}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Adjust Stock</span>
              {isSmallScreen && (
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={() => setAdjustDialog(false)}
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
                <FormControl fullWidth>
                  <InputLabel id="product-select-label">Product</InputLabel>
                  <Select
                    labelId="product-select-label"
                    id="product-select"
                    value={formData.product_id}
                    label="Product"
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    required
                  >
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="warehouse-select-label">Warehouse</InputLabel>
                  <Select
                    labelId="warehouse-select-label"
                    id="warehouse-select"
                    value={formData.warehouse_id}
                    label="Warehouse"
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    required
                  >
                    {warehouses.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="adjustment-type-label">Adjustment Type</InputLabel>
                  <Select
                    labelId="adjustment-type-label"
                    id="adjustment-type-select"
                    value={formData.adjustment_type}
                    label="Adjustment Type"
                    onChange={(e) => setFormData({ ...formData, adjustment_type: e.target.value })}
                  >
                    <MenuItem value="set">Set Quantity</MenuItem>
                    <MenuItem value="add">Add to Stock</MenuItem>
                    <MenuItem value="subtract">Subtract from Stock</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  inputProps={{ step: '1', min: '0' }}
                  required
                  helperText={
                    formData.adjustment_type === 'set'
                      ? 'Set the stock to this exact quantity'
                      : formData.adjustment_type === 'add'
                      ? 'Add this amount to current stock'
                      : 'Subtract this amount from current stock'
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setAdjustDialog(false)}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Adjust Stock
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default Inventory;
