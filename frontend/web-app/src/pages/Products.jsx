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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Inventory as InventoryIcon,
  Close,
  ShoppingCart,
} from '@mui/icons-material';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import warehouseService from '../services/warehouseService';
import tenantSettingsService from '../services/tenantSettingsService';
import orderService from '../services/orderService';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/currency';

function Products() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, product: null });
  const [ordersDialog, setOrdersDialog] = useState({ open: false, product: null, orders: [] });
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    category_id: '',
    stock_quantity: '',
    warehouse_id: '',
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadWarehouses();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await tenantSettingsService.getSettings();
      if (response.settings && response.settings.currency) {
        setCurrency(response.settings.currency);
      }
    } catch (error) {
      // Use default currency if settings can't be loaded
      console.error('Failed to load settings:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts();
      const productsList = response.products || response.data || [];
      setProducts(productsList);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Only show error if it's not a 404
      if (error.response?.status !== 404) {
        toast.error('Failed to load products');
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAllCategories();
      setCategories(response.categories || response.data || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load categories:', error);
      }
      setCategories([]);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehouseService.getAllWarehouses();
      const warehousesList = response.warehouses || response.data || [];
      setWarehouses(warehousesList);
      // Auto-select first warehouse if available and none selected
      if (warehousesList.length > 0 && !formData.warehouse_id) {
        setFormData(prev => ({ ...prev, warehouse_id: warehousesList[0].id }));
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load warehouses:', error);
      }
      setWarehouses([]);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.product) return;

    try {
      await productService.deleteProduct(deleteDialog.product.id);
      toast.success('Product deleted successfully');
      loadProducts();
      setDeleteDialog({ open: false, product: null });
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleAdd = () => {
    // Set default warehouse if available
    const defaultWarehouse = warehouses.length > 0 ? warehouses[0].id : '';
    setFormData({ 
      name: '', 
      sku: '', 
      description: '', 
      price: '', 
      category_id: '',
      stock_quantity: '',
      warehouse_id: defaultWarehouse,
    });
    setAddDialog(true);
  };

  const handleViewOrders = async (product) => {
    setOrdersDialog({ open: true, product, orders: [] });
    setLoadingOrders(true);
    try {
      const response = await orderService.getOrdersByProduct(product.id);
      setOrdersDialog({
        open: true,
        product,
        orders: response.orders || []
      });
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders for this product');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      price: product.price || '',
      category_id: product.category_id || product.category?.id || '',
      stock_quantity: product.stock_quantity || '',
      warehouse_id: warehouses.length > 0 ? warehouses[0].id : '',
    });
    setEditDialog({ open: true, product });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data to send
      const dataToSend = {
        name: formData.name,
        sku: formData.sku || undefined,
        description: formData.description || undefined,
        price: formData.price || undefined,
        category_id: formData.category_id || undefined,
      };
      
      // Only include stock fields if stock_quantity is provided and > 0
      const stockQty = formData.stock_quantity ? parseInt(formData.stock_quantity) : 0;
      
      if (stockQty > 0) {
        if (!formData.warehouse_id || formData.warehouse_id.trim() === '') {
          toast.error('Please select a warehouse to add stock');
          return;
        }
        dataToSend.stock_quantity = stockQty;
        dataToSend.warehouse_id = formData.warehouse_id;
      }
      
      const response = await productService.createProduct(dataToSend);
      toast.success('Product added successfully');
      setAddDialog(false);
      // Reset form
      const defaultWarehouse = warehouses.length > 0 ? warehouses[0].id : '';
      setFormData({ 
        name: '', 
        sku: '', 
        description: '', 
        price: '', 
        category_id: '',
        stock_quantity: '',
        warehouse_id: defaultWarehouse,
      });
      // Reload products list
      await loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add product';
      toast.error(errorMessage);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editDialog.product) return;

    try {
      const dataToSend = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description || undefined,
        price: formData.price || undefined,
        category_id: formData.category_id || undefined,
      };
      
      await productService.updateProduct(editDialog.product.id, dataToSend);
      toast.success('Product updated successfully');
      setEditDialog({ open: false, product: null });
      await loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update product';
      toast.error(errorMessage);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
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
            Products
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Manage your product catalog and inventory
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleAdd}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Product
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search products by name or SKU..."
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

      {filteredProducts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No products found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Name</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>SKU</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Category</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Price</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Stock</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>Status</TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{product.name || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>{product.sku || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {product.category?.name || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {formatCurrency(product.price || 0, currency)}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {product.stock_quantity !== undefined && product.stock_quantity !== null 
                      ? Number(product.stock_quantity) 
                      : 0}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                    <Chip
                      label={product.status || 'active'}
                      size="small"
                      color={product.status === 'active' ? 'success' : 'default'}
                      sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleViewOrders(product)}
                      title="View Orders"
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <ShoppingCart fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleEdit(product)}
                      title="Edit Product"
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, product })}
                      title="Delete Product"
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
              <span>Add Product</span>
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
                  label="Product Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="SKU (Optional - will be auto-generated if not provided)"
                  name="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  helperText="Leave empty to auto-generate SKU"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Category"
                  name="category_id"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">None</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Warehouse (for stock)"
                  name="warehouse_id"
                  value={formData.warehouse_id || ''}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                  SelectProps={{
                    native: true,
                  }}
                  helperText={warehouses.length === 0 ? 'No warehouses available. Create one first.' : formData.stock_quantity && !formData.warehouse_id ? 'Select warehouse to add stock' : ''}
                  error={!!(formData.stock_quantity && !formData.warehouse_id)}
                >
                  <option value="">None</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Initial Stock Quantity"
                  name="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, stock_quantity: value });
                  }}
                  inputProps={{ step: '1', min: '0' }}
                  helperText={formData.stock_quantity && !formData.warehouse_id ? 'Please select a warehouse' : 'Optional: Enter initial stock quantity'}
                  error={!!(formData.stock_quantity && !formData.warehouse_id)}
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
              Add Product
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, product: null })} maxWidth="sm" fullWidth>
        <form onSubmit={handleEditSubmit}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Edit Product</span>
              {isSmallScreen && (
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={() => setEditDialog({ open: false, product: null })}
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
                  label="Product Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="SKU"
                  name="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Category"
                  name="category_id"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">None</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setEditDialog({ open: false, product: null })}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Update Product
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, product: null })}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Delete Product</span>
            {isSmallScreen && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => setDeleteDialog({ open: false, product: null })}
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
            Are you sure you want to delete "{deleteDialog.product?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, product: null })}
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

      {/* View Orders Dialog */}
      <Dialog
        open={ordersDialog.open}
        onClose={() => setOrdersDialog({ open: false, product: null, orders: [] })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Orders for {ordersDialog.product?.name || 'Product'}</span>
            {isSmallScreen && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => setOrdersDialog({ open: false, product: null, orders: [] })}
                aria-label="close"
                size="small"
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingOrders ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : ordersDialog.orders.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No orders found for this product
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordersDialog.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.order_number || `#${order.id}`}</TableCell>
                      <TableCell>
                        {order.customer?.name || order.customer_name || order.customer_email || 'Walk-in'}
                      </TableCell>
                      <TableCell align="right">
                        {order.quantity || order.items?.find(item => item.product_id === ordersDialog.product?.id)?.quantity || 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(
                          order.unit_price || order.items?.find(item => item.product_id === ordersDialog.product?.id)?.unit_price || 0,
                          currency
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(
                          order.subtotal || order.items?.find(item => item.product_id === ordersDialog.product?.id)?.subtotal || 0,
                          currency
                        )}
                      </TableCell>
                      <TableCell>
                        {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status || 'pending'}
                          size="small"
                          color={
                            order.status === 'completed' ? 'success' :
                            order.status === 'cancelled' ? 'error' : 'warning'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOrdersDialog({ open: false, product: null, orders: [] })}
            size={isSmallScreen ? 'small' : 'medium'}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Products;
