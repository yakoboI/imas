import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add,
  Delete,
  Search,
  PointOfSale,
  ShoppingCart,
  Payment,
  Print,
  GetApp,
  Receipt,
} from '@mui/icons-material';
import orderService from '../services/orderService';
import productService from '../services/productService';
import customerService from '../services/customerService';
import receiptService from '../services/receiptService';
import tenantSettingsService from '../services/tenantSettingsService';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/currency';

function Sales() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [completedSales, setCompletedSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' or 'history'

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadSettings();
    loadCompletedSales();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await tenantSettingsService.getSettings();
      if (response.settings && response.settings.currency) {
        setCurrency(response.settings.currency);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts();
      setProducts(response.products || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products');
      }
      setProducts([]);
    } finally {
      setLoading(false);
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

  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      // Increase quantity if product already in cart
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      // Add new item to cart
      const newItem = {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: 1,
        unit_price: parseFloat(product.price) || 0,
        subtotal: parseFloat(product.price) || 0,
      };
      setCart([...cart, newItem]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity: parseInt(newQuantity), subtotal: parseInt(newQuantity) * item.unit_price }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const loadCompletedSales = async () => {
    setLoadingSales(true);
    try {
      // Load all orders
      const response = await orderService.getAllOrders();
      const allOrders = response.orders || response.data || [];
      
      // Filter for completed orders only
      const completedOrders = allOrders.filter(order => 
        order.status === 'completed' || order.status === 'paid'
      ).slice(0, 50); // Limit to 50 most recent
      
      // Load all receipts
      const receiptsResponse = await receiptService.listReceipts();
      const allReceipts = receiptsResponse.receipts || receiptsResponse.data || [];
      
      // Match receipts with orders
      const salesWithReceipts = completedOrders.map((order) => {
        const receipt = allReceipts.find(r => r.order_id === order.id);
        return {
          ...order,
          receipt: receipt || null,
        };
      });
      
      // Sort by date, most recent first
      salesWithReceipts.sort((a, b) => {
        const dateA = new Date(a.order_date || a.created_at);
        const dateB = new Date(b.order_date || b.created_at);
        return dateB - dateA;
      });
      
      setCompletedSales(salesWithReceipts);
    } catch (error) {
      console.error('Failed to load completed sales:', error);
      setCompletedSales([]);
    } finally {
      setLoadingSales(false);
    }
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error('Please add products to cart');
      return;
    }

    setProcessing(true);
    try {
      const orderData = {
        customer_id: selectedCustomer || undefined,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: 0,
        })),
      };

      // Create the order
      const orderResponse = await orderService.createOrder(orderData);
      const order = orderResponse.order || orderResponse.data;
      
      // Automatically complete the order
      try {
        await orderService.completeOrder(order.id);
      } catch (error) {
        console.error('Failed to complete order:', error);
      }

      // Automatically generate receipt
      let receipt = null;
      try {
        const receiptResponse = await receiptService.generateReceipt(order.id, {
          templateType: 'thermal',
        });
        receipt = receiptResponse.receipt || receiptResponse.data;
        toast.success('Sale completed and receipt generated successfully!');
      } catch (error) {
        console.error('Failed to generate receipt:', error);
        toast.success('Sale completed! Receipt generation failed. You can generate it later.');
      }
      
      // Clear cart and reset form
      setCart([]);
      setSelectedCustomer('');
      setPaymentMethod('cash');
      setSearchTerm('');
      
      // Reload completed sales to show the new sale
      await loadCompletedSales();
      
      // Switch to history tab to show the new sale
      setActiveTab('history');
      
    } catch (error) {
      console.error('Failed to complete sale:', error);
      toast.error(error.response?.data?.error || 'Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = async (receiptId, orderId) => {
    try {
      // First, try to get the receipt to check if PDF exists
      let receipt;
      try {
        const receiptResponse = await receiptService.getReceipt(receiptId);
        receipt = receiptResponse.receipt || receiptResponse.data;
      } catch (error) {
        console.error('Failed to get receipt:', error);
      }

      // If PDF doesn't exist and we have orderId, try to regenerate receipt
      if (receipt && !receipt.pdf_url && orderId) {
        toast.info('Generating receipt PDF...');
        try {
          await receiptService.generateReceipt(orderId, { templateType: 'thermal' });
          // Wait a bit for PDF generation
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Failed to regenerate receipt:', error);
        }
      }

      // Try to download PDF
      const blob = await receiptService.downloadPDF(receiptId);
      if (!blob || blob.size === 0) {
        toast.error('Receipt PDF is not available. The PDF may still be generating. Please try again in a moment.');
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.print();
          }, 250);
        });
        toast.success('Receipt opened for printing');
      } else {
        toast.error('Please allow popups to print receipts');
      }
    } catch (error) {
      // Only log unexpected errors (not 404s or 500s which are handled gracefully)
      if (error.response?.status !== 404 && error.response?.status !== 500) {
        console.error('Print error:', error);
      }
      if (error.response?.status === 404 || error.response?.status === 500) {
        // If PDF doesn't exist, try to regenerate
        if (orderId) {
          toast.info('PDF not found. Attempting to generate receipt...');
          try {
            await receiptService.generateReceipt(orderId, { templateType: 'thermal' });
            toast.info('Receipt regenerated. Please try printing again.');
          } catch (genError) {
            toast.error('Receipt PDF is not available. Please generate the receipt first.');
          }
        } else {
          toast.error('Receipt PDF is not available. Please generate the receipt first.');
        }
      } else if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to generate receipt PDF. Please try again.';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to print receipt';
        toast.error(errorMessage);
      }
    }
  };

  const handleDownloadReceipt = async (receiptId, receiptNumber, orderId) => {
    try {
      // First, try to get the receipt to check if PDF exists
      let receipt;
      try {
        const receiptResponse = await receiptService.getReceipt(receiptId);
        receipt = receiptResponse.receipt || receiptResponse.data;
      } catch (error) {
        console.error('Failed to get receipt:', error);
      }

      // If PDF doesn't exist and we have orderId, try to regenerate receipt
      if (receipt && !receipt.pdf_url && orderId) {
        toast.info('Generating receipt PDF...');
        try {
          await receiptService.generateReceipt(orderId, { templateType: 'thermal' });
          // Wait a bit for PDF generation
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Failed to regenerate receipt:', error);
        }
      }

      // Try to download PDF
      const blob = await receiptService.downloadPDF(receiptId);
      if (!blob || blob.size === 0) {
        toast.error('Receipt PDF is not available. The PDF may still be generating. Please try again in a moment.');
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receiptNumber || receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      // Only log unexpected errors (not 404s or 500s which are handled gracefully)
      if (error.response?.status !== 404 && error.response?.status !== 500) {
        console.error('Download error:', error);
      }
      if (error.response?.status === 404 || error.response?.status === 500) {
        // If PDF doesn't exist, try to regenerate
        if (orderId) {
          toast.info('PDF not found. Attempting to generate receipt...');
          try {
            await receiptService.generateReceipt(orderId, { templateType: 'thermal' });
            toast.info('Receipt regenerated. Please try downloading again.');
          } catch (genError) {
            toast.error('Receipt PDF is not available. Please generate the receipt first.');
          }
        } else {
          toast.error('Receipt PDF is not available. Please generate the receipt first.');
        }
      } else if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to generate receipt PDF. Please try again.';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to download receipt';
        toast.error(errorMessage);
      }
    }
  };

  const handleGenerateReceipt = async (orderId) => {
    try {
      const response = await receiptService.generateReceipt(orderId, {
        templateType: 'thermal',
      });
      toast.success('Receipt generated successfully!');
      await loadCompletedSales(); // Reload to show the new receipt
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      toast.error(error.response?.data?.error || 'Failed to generate receipt');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Sales</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {activeTab === 'pos' && (
            <Chip
              icon={<ShoppingCart />}
              label={`${cart.length} item${cart.length !== 1 ? 's' : ''} in cart`}
              color="primary"
              variant="outlined"
            />
          )}
          <Button
            variant={activeTab === 'pos' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('pos')}
            startIcon={<PointOfSale />}
          >
            Point of Sale
          </Button>
          <Button
            variant={activeTab === 'history' ? 'contained' : 'outlined'}
            onClick={() => {
              setActiveTab('history');
              loadCompletedSales();
            }}
            startIcon={<Receipt />}
          >
            Sales History
          </Button>
        </Box>
      </Box>

      {activeTab === 'pos' ? (
        <Grid container spacing={3}>
          {/* Products Section */}
          <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>

          <Paper sx={{ p: 2, maxHeight: '60vh', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Products
            </Typography>
            {filteredProducts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PointOfSale sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  {searchTerm ? 'No products found' : 'No products available'}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s',
                        },
                      }}
                      onClick={() => handleAddToCart(product)}
                    >
                      <CardContent>
                        <Typography variant="h6" noWrap>
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          SKU: {product.sku || 'N/A'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(product.price || 0, currency)}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Add />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                          >
                            Add
                          </Button>
                        </Box>
                        {product.stock_quantity !== undefined && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Stock: {product.stock_quantity || 0}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Cart Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="h6" gutterBottom>
              Cart
            </Typography>
            <Divider sx={{ my: 2 }} />

            {cart.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShoppingCart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Cart is empty
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell>
                            <Typography variant="body2">{item.product_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.product_sku}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.product_id, e.target.value)}
                              inputProps={{ min: 1, style: { textAlign: 'center', width: '50px' } }}
                              sx={{ width: '70px' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.unit_price, currency)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.subtotal, currency)}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveFromCart(item.product_id)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Customer (Optional)</InputLabel>
                    <Select
                      value={selectedCustomer}
                      label="Customer (Optional)"
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Walk-in Customer</em>
                      </MenuItem>
                      {customers.map((customer) => (
                        <MenuItem key={customer.id} value={customer.id}>
                          {customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentMethod}
                      label="Payment Method"
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="card">Card</MenuItem>
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      <MenuItem value="mobile_money">Mobile Money</MenuItem>
                      <MenuItem value="credit">Credit</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(calculateTotal(), currency)}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Payment />}
                  onClick={handleCompleteSale}
                  disabled={processing || cart.length === 0}
                  sx={{ py: 1.5 }}
                >
                  {processing ? 'Processing...' : 'Complete Sale'}
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
      ) : (
        /* Sales History Section */
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Completed Sales History
          </Typography>
          <Divider sx={{ my: 2 }} />

          {loadingSales ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : completedSales.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No completed sales yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Complete a sale to see it here
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Receipt</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completedSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.order_number || `#${sale.id}`}</TableCell>
                      <TableCell>
                        {sale.customer?.name || 
                         (sale.customer ? `${sale.customer.first_name || ''} ${sale.customer.last_name || ''}`.trim() : 'Walk-in') || 
                         'Walk-in'}
                      </TableCell>
                      <TableCell>
                        {sale.order_date 
                          ? new Date(sale.order_date).toLocaleString() 
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(sale.total_amount || 0, currency)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sale.payment_method?.replace('_', ' ').toUpperCase() || 'N/A'}
                          size="small"
                          color="default"
                        />
                      </TableCell>
                      <TableCell>
                        {sale.receipt ? (
                          <Chip
                            label={sale.receipt.receipt_number || 'Generated'}
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleGenerateReceipt(sale.id)}
                          >
                            Generate Receipt
                          </Button>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {sale.receipt ? (
                          <>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handlePrintReceipt(sale.receipt.id, sale.id)}
                              title="Print Receipt"
                            >
                              <Print />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleDownloadReceipt(sale.receipt.id, sale.receipt.receipt_number, sale.id)}
                              title="Download Receipt"
                            >
                              <GetApp />
                            </IconButton>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No receipt
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default Sales;

