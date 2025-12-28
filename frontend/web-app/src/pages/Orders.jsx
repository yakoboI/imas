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
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add,
  Visibility,
  Search,
  ShoppingCart as OrderIcon,
  Delete as DeleteIcon,
  Close,
  Cancel,
  CheckCircle,
  Payment,
} from '@mui/icons-material';
import orderService from '../services/orderService';
import productService from '../services/productService';
import customerService from '../services/customerService';
import tenantSettingsService from '../services/tenantSettingsService';
import integrationService from '../services/integrationService';
import pesapalService from '../services/pesapalService';
import flutterwaveService from '../services/flutterwaveService';
import dpoService from '../services/dpoService';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/currency';

function Orders() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState({ open: false, order: null });
  const [viewOrderDetails, setViewOrderDetails] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [activePaymentGateways, setActivePaymentGateways] = useState([]);
  const [initiatingPayment, setInitiatingPayment] = useState({ gateway: null, loading: false });
  const [formData, setFormData] = useState({
    customer_id: '',
    payment_method: '',
    notes: '',
    items: [{ product_id: '', quantity: 1, unit_price: '', discount: 0 }],
  });

  useEffect(() => {
    loadOrders();
    loadProducts();
    loadCustomers();
    loadSettings();
    loadActivePaymentGateways();
  }, []);

  const loadActivePaymentGateways = async () => {
    try {
      const response = await integrationService.getAvailableIntegrations();
      const paymentIntegrations = (response.integrations || []).filter(
        integration => integration.category === 'payment' && integration.connected && integration.connectionStatus?.status === 'active'
      );
      setActivePaymentGateways(paymentIntegrations);
    } catch (error) {
      console.error('Failed to load payment gateways:', error);
    }
  };

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

  const loadOrders = async () => {
    try {
      const response = await orderService.getAllOrders();
      setOrders(response.orders || response.data || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load orders:', error);
      }
      setOrders([]);
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

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAllCustomers();
      setCustomers(response.customers || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load customers:', error);
      }
      setCustomers([]);
    }
  };

  const handleCreateOrder = () => {
    setFormData({
      customer_id: '',
      payment_method: '',
      notes: '',
      items: [{ product_id: '', quantity: 1, unit_price: '', discount: 0 }],
    });
    setCreateDialog(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, unit_price: '', discount: 0 }],
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Auto-fill unit_price when product is selected
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = product.price || '';
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate items
      const validItems = formData.items.filter(item => item.product_id && item.quantity > 0);
      if (validItems.length === 0) {
        toast.error('Please add at least one product to the order');
        return;
      }

      const orderData = {
        customer_id: formData.customer_id || undefined,
        payment_method: formData.payment_method || undefined,
        notes: formData.notes || undefined,
        items: validItems.map(item => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity),
          unit_price: item.unit_price ? parseFloat(item.unit_price) : undefined,
          discount: item.discount ? parseFloat(item.discount) : 0,
        })),
      };

      await orderService.createOrder(orderData);
      toast.success('Order created successfully');
      setCreateDialog(false);
      loadOrders();
      setFormData({
        customer_id: '',
        payment_method: '',
        notes: '',
        items: [{ product_id: '', quantity: 1, unit_price: '', discount: 0 }],
      });
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error(error.response?.data?.error || 'Failed to create order');
    }
  };

  const handleViewOrder = async (order) => {
    setViewDialog({ open: true, order });
    setLoadingOrder(true);
    try {
      const response = await orderService.getOrderById(order.id);
      setViewOrderDetails(response.order);
    } catch (error) {
      console.error('Failed to load order details:', error);
      toast.error('Failed to load order details');
      // Use the order from the list if API fails
      setViewOrderDetails(order);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      await orderService.cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      loadOrders();
      // Close dialog if viewing this order
      if (viewDialog.order?.id === orderId) {
        setViewDialog({ open: false, order: null });
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel order');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (!window.confirm('Mark this order as completed? This will finalize the order.')) {
      return;
    }

    try {
      await orderService.completeOrder(orderId);
      toast.success('Order marked as completed');
      loadOrders();
      // Reload order details if viewing this order
      if (viewDialog.order?.id === orderId) {
        const response = await orderService.getOrderById(orderId);
        setViewOrderDetails(response.order);
      }
    } catch (error) {
      console.error('Failed to complete order:', error);
      toast.error(error.response?.data?.error || 'Failed to complete order');
    }
  };

  const handleInitiatePayment = async (orderId, gatewayType) => {
    if (!orderId || !gatewayType) return;

    setInitiatingPayment({ gateway: gatewayType, loading: true });
    try {
      let response;
      if (gatewayType === 'pesapal') {
        response = await pesapalService.initiatePayment(orderId);
      } else if (gatewayType === 'flutterwave') {
        response = await flutterwaveService.initiatePayment(orderId);
      } else if (gatewayType === 'dpo') {
        response = await dpoService.initiatePayment(orderId);
      } else {
        throw new Error('Unknown payment gateway');
      }

      if (response.redirectUrl) {
        // Open payment gateway in new window/tab
        window.open(response.redirectUrl, '_blank');
        toast.success('Redirecting to payment gateway...');
        // Reload order to get updated payment status
        setTimeout(() => {
          loadOrders();
          if (viewDialog.order?.id === orderId) {
            handleViewOrder(viewDialog.order);
          }
        }, 2000);
      } else {
        toast.error('Payment gateway did not return a redirect URL');
      }
    } catch (error) {
      console.error('Failed to initiate payment:', error);
      toast.error(error.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setInitiatingPayment({ gateway: null, loading: false });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
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
            Orders
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Manage customer orders and track order status
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleCreateOrder}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Create Order
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search orders by order number, customer name, or email..."
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

      {filteredOrders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <OrderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No orders found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first order'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Order Number</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Customer</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Date</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>Items</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Total</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{order.order_number || `#${order.id}`}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {order.customer?.name || order.customer_name || order.customer_email || 'Walk-in Customer'}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>
                    {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                    {order.items && order.items.length > 0 ? (
                      <Box>
                        {order.items.slice(0, 1).map((item, idx) => (
                          <Typography key={idx} variant="caption" display="block">
                            {item.product?.name || 'Product'}
                            {item.product?.sku ? ` (SKU: ${item.product.sku})` : ' (SKU: N/A)'}
                          </Typography>
                        ))}
                        {order.items.length > 1 && (
                          <Typography variant="caption" color="text.secondary">
                            +{order.items.length - 1} more
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      order.item_count || 0
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {formatCurrency(order.total_amount || 0, currency)}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <Chip
                      label={order.status || 'pending'}
                      size="small"
                      color={getStatusColor(order.status)}
                      sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {order.status?.toLowerCase() !== 'completed' && order.status?.toLowerCase() !== 'cancelled' && (
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleCompleteOrder(order.id)}
                        title="Complete Order"
                        sx={{ padding: { xs: '4px', sm: '8px' } }}
                      >
                        <CheckCircle fontSize="small" />
                      </IconButton>
                    )}
                    {order.status?.toLowerCase() !== 'cancelled' && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleCancelOrder(order.id)}
                        title="Cancel Order"
                        sx={{ padding: { xs: '4px', sm: '8px' } }}
                      >
                        <Cancel fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleViewOrder(order)}
                      title="View Order"
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleCreateSubmit}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Create New Order</span>
              {isSmallScreen && (
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={() => setCreateDialog(false)}
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
                  <InputLabel id="customer-select-label">Customer (Optional)</InputLabel>
                  <Select
                    labelId="customer-select-label"
                    id="customer-select"
                    value={formData.customer_id}
                    label="Customer (Optional)"
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.email ? `(${customer.email})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Order Items
                </Typography>
                {formData.items.map((item, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>Product</InputLabel>
                          <Select
                            value={item.product_id}
                            label="Product"
                            onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
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
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Quantity"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          inputProps={{ min: 1 }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Unit Price"
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          inputProps={{ step: '0.01', min: '0' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Discount %"
                          type="number"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                          inputProps={{ step: '0.01', min: '0', max: '100' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        {formData.items.length > 1 && (
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddItem}
                  sx={{ mb: 2 }}
                >
                  Add Item
                </Button>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="payment-method-label">Payment Method</InputLabel>
                  <Select
                    labelId="payment-method-label"
                    id="payment-method-select"
                    value={formData.payment_method}
                    label="Payment Method"
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="mobile_money">Mobile Money</MenuItem>
                    <MenuItem value="credit">Credit</MenuItem>
                  </Select>
                </FormControl>
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
              onClick={() => setCreateDialog(false)}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Create Order
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={() => setViewDialog({ open: false, order: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Order Details - {viewOrderDetails?.order_number || viewDialog.order?.order_number}</span>
            {isSmallScreen && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => setViewDialog({ open: false, order: null })}
                aria-label="close"
                size="small"
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingOrder ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : viewOrderDetails ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Order Number</Typography>
                <Typography variant="body1" fontWeight="bold">{viewOrderDetails.order_number}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip 
                  label={viewOrderDetails.status || 'pending'} 
                  size="small" 
                  color={getStatusColor(viewOrderDetails.status)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Order Date</Typography>
                <Typography variant="body1">
                  {viewOrderDetails.order_date 
                    ? new Date(viewOrderDetails.order_date).toLocaleString() 
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Customer</Typography>
                <Typography variant="body1">
                  {viewOrderDetails.customer?.name || 'Walk-in Customer'}
                </Typography>
                {viewOrderDetails.customer?.email && (
                  <Typography variant="body2" color="text.secondary">
                    {viewOrderDetails.customer.email}
                  </Typography>
                )}
                {viewOrderDetails.customer?.phone && (
                  <Typography variant="body2" color="text.secondary">
                    {viewOrderDetails.customer.phone}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom>Order Items</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewOrderDetails.items && viewOrderDetails.items.length > 0 ? (
                        viewOrderDetails.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.product?.name || 'N/A'} 
                              {item.product?.sku ? ` (SKU: ${item.product.sku})` : ' (SKU: N/A)'}
                            </TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.unit_price || 0, currency)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.subtotal || 0, currency)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">No items</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell colSpan={3} align="right"><strong>Total Amount</strong></TableCell>
                        <TableCell align="right">
                          <strong>
                            {formatCurrency(viewOrderDetails.total_amount || 0, currency)}
                          </strong>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              {viewOrderDetails.payment_method && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                  <Typography variant="body1">
                    {viewOrderDetails.payment_method.replace('_', ' ').toUpperCase()}
                  </Typography>
                </Grid>
              )}
              {viewOrderDetails.payment_status && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Payment Status</Typography>
                  <Chip 
                    label={viewOrderDetails.payment_status} 
                    size="small" 
                    color={viewOrderDetails.payment_status === 'paid' ? 'success' : 'warning'}
                  />
                </Grid>
              )}
              {viewOrderDetails.notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Notes</Typography>
                  <Typography variant="body1">{viewOrderDetails.notes}</Typography>
                </Grid>
              )}
            </Grid>
          ) : (
            <Typography>No order details available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {viewOrderDetails && viewOrderDetails.status?.toLowerCase() !== 'completed' && viewOrderDetails.status?.toLowerCase() !== 'cancelled' && (
            <>
              <Button
                onClick={() => handleCompleteOrder(viewOrderDetails.id)}
                startIcon={<CheckCircle />}
                color="success"
                variant="outlined"
                size={isSmallScreen ? 'small' : 'medium'}
              >
                Complete Order
              </Button>
              <Button
                onClick={() => handleCancelOrder(viewOrderDetails.id)}
                startIcon={<Cancel />}
                color="error"
                variant="outlined"
                size={isSmallScreen ? 'small' : 'medium'}
              >
                Cancel Order
              </Button>
            </>
          )}
          <Button 
            onClick={() => setViewDialog({ open: false, order: null })}
            size={isSmallScreen ? 'small' : 'medium'}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Orders;
