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
  useMediaQuery,
  useTheme,
  Tooltip,
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
  ArrowBack,
  Close,
  ShoppingCartOutlined as OrderIcon,
} from '@mui/icons-material';
import orderService from '../services/orderService';
import productService from '../services/productService';
import customerService from '../services/customerService';
import receiptService from '../services/receiptService';
import tenantSettingsService from '../services/tenantSettingsService';
import integrationService from '../services/integrationService';
import pesapalService from '../services/pesapalService';
import flutterwaveService from '../services/flutterwaveService';
import dpoService from '../services/dpoService';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/currency';

function Sales() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
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
  const [uncompletedOrders, setUncompletedOrders] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'orders', or 'history'
  const [showCartView, setShowCartView] = useState(false); // For small screens: show cart view or products view
  const [productOrderHistory, setProductOrderHistory] = useState({}); // { productId: [orders] }
  const [activePaymentGateways, setActivePaymentGateways] = useState([]);
  const [initiatingPayment, setInitiatingPayment] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadSettings();
    loadCompletedSales();
    loadUncompletedOrders();
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
      console.error('Failed to load settings:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts();
      const productsList = response.products || [];
      setProducts(productsList);
      
      // Update cart items with latest stock quantities
      if (cart.length > 0) {
        setCart(cart.map(cartItem => {
          const product = productsList.find(p => p.id === cartItem.product_id);
          if (product) {
            const availableStock = parseInt(product.stock_quantity) || 0;
            // If cart quantity exceeds new stock, adjust it
            const adjustedQuantity = Math.min(cartItem.quantity, availableStock);
            if (adjustedQuantity !== cartItem.quantity && availableStock > 0) {
              toast.warning(`${cartItem.product_name}: Quantity adjusted from ${cartItem.quantity} to ${adjustedQuantity} (available stock)`);
            }
            return {
              ...cartItem,
              stock_quantity: availableStock,
              quantity: availableStock > 0 ? adjustedQuantity : 0,
              subtotal: (availableStock > 0 ? adjustedQuantity : 0) * cartItem.unit_price
            };
          }
          return cartItem;
        }).filter(item => item.quantity > 0)); // Remove items with 0 quantity
      }
      
      // Load order history for each product
      loadProductOrderHistory(productsList);
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

  const loadProductOrderHistory = async (productsList) => {
    try {
      const historyPromises = productsList.map(async (product) => {
        try {
          const response = await orderService.getOrdersByProduct(product.id);
          return { productId: product.id, orders: response.orders || [] };
        } catch (error) {
          console.error(`Failed to load order history for product ${product.id}:`, error);
          return { productId: product.id, orders: [] };
        }
      });

      const historyResults = await Promise.all(historyPromises);
      const historyMap = {};
      historyResults.forEach(({ productId, orders }) => {
        historyMap[productId] = orders;
      });
      setProductOrderHistory(historyMap);
    } catch (error) {
      console.error('Failed to load product order history:', error);
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

  const handleAddToCart = (product, quantity = 1) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    const addQuantity = parseInt(quantity) || 1;
    const availableStock = parseInt(product.stock_quantity) || 0;
    
    // Check if product has stock
    if (availableStock === 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    
    if (existingItem) {
      // Check if adding this quantity would exceed available stock
      const newQuantity = existingItem.quantity + addQuantity;
      if (newQuantity > availableStock) {
        toast.error(`Cannot add ${addQuantity} more. Only ${availableStock} available in stock (${existingItem.quantity} already in cart)`);
        return;
      }
      // Increase quantity if product already in cart
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unit_price, stock_quantity: availableStock }
          : item
      ));
    } else {
      // Check if requested quantity exceeds available stock
      if (addQuantity > availableStock) {
        toast.error(`Cannot add ${addQuantity}. Only ${availableStock} available in stock`);
        return;
      }
      // Add new item to cart
      const newItem = {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: addQuantity,
        unit_price: parseFloat(product.price) || 0,
        subtotal: addQuantity * (parseFloat(product.price) || 0),
        stock_quantity: availableStock,
      };
      setCart([...cart, newItem]);
    }
    toast.success(`${product.name} ${addQuantity > 1 ? `(${addQuantity}x)` : ''} added to cart`);
    
    // On small screens, switch to cart view when item is added
    if (isSmallScreen && cart.length === 0) {
      setShowCartView(true);
    }
  };

  const handleRemoveFromCart = (productId) => {
    const itemToRemove = cart.find(item => item.product_id === productId);
    const newCart = cart.filter(item => item.product_id !== productId);
    setCart(newCart);
    
    // Show toast notification
    if (itemToRemove) {
      toast.success(`${itemToRemove.product_name} removed from cart`);
    }
    
    // On small screens, if cart becomes empty, show products view
    if (isSmallScreen && newCart.length === 0) {
      setShowCartView(false);
    }
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    
    const itemCount = cart.length;
    setCart([]);
    toast.success(`All ${itemCount} item${itemCount !== 1 ? 's' : ''} removed from cart`);
    
    // On small screens, show products view when cart is cleared
    if (isSmallScreen) {
      setShowCartView(false);
    }
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    
    const cartItem = cart.find(item => item.product_id === productId);
    if (!cartItem) return;
    
    const requestedQuantity = parseInt(newQuantity);
    const availableStock = cartItem.stock_quantity || 0;
    
    // Validate against available stock
    if (requestedQuantity > availableStock) {
      toast.error(`Cannot set quantity to ${requestedQuantity}. Only ${availableStock} available in stock`);
      // Reset to maximum available stock
      setCart(cart.map(item =>
        item.product_id === productId
          ? { ...item, quantity: availableStock, subtotal: availableStock * item.unit_price }
          : item
      ));
      return;
    }
    
    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity: requestedQuantity, subtotal: requestedQuantity * item.unit_price }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateTotalItems = () => {
    return cart.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
  };

  const loadUncompletedOrders = async () => {
    try {
      // Load all orders
      const response = await orderService.getAllOrders();
      const allOrders = response.orders || response.data || [];
      
      // Filter for uncompleted orders only (pending, processing)
      const uncompleted = allOrders.filter(order => 
        order.status === 'pending' || order.status === 'processing'
      );
      
      // Sort by date, most recent first
      uncompleted.sort((a, b) => {
        const dateA = new Date(a.order_date || a.created_at);
        const dateB = new Date(b.order_date || b.created_at);
        return dateB - dateA;
      });
      
      setUncompletedOrders(uncompleted);
    } catch (error) {
      console.error('Failed to load uncompleted orders:', error);
      setUncompletedOrders([]);
    }
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

    // Customer is now mandatory
    if (!selectedCustomer) {
      toast.error('Please select a customer to complete the sale');
      return;
    }

    // Validate stock availability before completing sale
    const stockErrors = [];
    for (const item of cart) {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        const availableStock = parseInt(product.stock_quantity) || 0;
        if (item.quantity > availableStock) {
          stockErrors.push(`${item.product_name}: Requested ${item.quantity}, but only ${availableStock} available`);
        }
      }
    }
    
    if (stockErrors.length > 0) {
      toast.error(`Stock validation failed: ${stockErrors.join('; ')}`);
      // Reload products to get latest stock
      await loadProducts();
      return;
    }

    setProcessing(true);
    try {
      const orderData = {
        customer_id: selectedCustomer,
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
      
      // Check if payment gateway is selected
      const isPaymentGateway = paymentMethod && ['pesapal', 'flutterwave', 'dpo'].includes(paymentMethod);
      
      if (isPaymentGateway) {
        // Initiate payment with gateway
        setInitiatingPayment(true);
        try {
          let paymentResponse;
          if (paymentMethod === 'pesapal') {
            paymentResponse = await pesapalService.initiatePayment(order.id);
          } else if (paymentMethod === 'flutterwave') {
            paymentResponse = await flutterwaveService.initiatePayment(order.id);
          } else if (paymentMethod === 'dpo') {
            paymentResponse = await dpoService.initiatePayment(order.id);
          }

          if (paymentResponse?.redirectUrl) {
            // Open payment gateway in new window
            window.open(paymentResponse.redirectUrl, '_blank');
            toast.success('Order created! Redirecting to payment gateway...');
            // Don't complete order or generate receipt - webhook will handle it
          } else {
            toast.error('Payment gateway did not return a redirect URL');
            // Fallback: complete order manually
            await orderService.completeOrder(order.id);
            await receiptService.generateReceipt(order.id, { templateType: 'thermal' });
          }
        } catch (error) {
          console.error('Failed to initiate payment:', error);
          toast.error(error.response?.data?.error || 'Failed to initiate payment. Order created but not paid.');
          // Don't complete order if payment fails
        } finally {
          setInitiatingPayment(false);
        }
      } else {
        // Regular payment method - complete order immediately
        try {
          await orderService.completeOrder(order.id);
        } catch (error) {
          console.error('Failed to complete order:', error);
        }

        // Automatically generate receipt
        try {
          await receiptService.generateReceipt(order.id, {
            templateType: 'thermal',
          });
          toast.success('Sale completed and receipt generated successfully!');
        } catch (error) {
          console.error('Failed to generate receipt:', error);
          toast.success('Sale completed! Receipt generation failed. You can generate it later.');
        }
      }
      
      // Clear cart and reset form
      setCart([]);
      setSelectedCustomer('');
      setPaymentMethod('cash');
      setSearchTerm('');
      setShowCartView(false); // Reset cart view on small screens
      
      // Reload orders and sales
      await loadUncompletedOrders();
      await loadCompletedSales();
      
      // Switch to orders tab to show the new order
      setActiveTab('orders');
      
    } catch (error) {
      console.error('Failed to complete sale:', error);
      
      // Handle different error types with more specific messages
      if (error.response?.status === 403) {
        toast.error('You do not have permission to create orders. Please contact your administrator.');
      } else if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Invalid order data. Please check your input.');
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to complete sale. Please try again.');
      }
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

  const filteredProducts = products.filter((product) => {
    // Exclude products with zero stock
    if ((product.stock_quantity || 0) === 0) {
      return false;
    }
    // Filter by search term
    return product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: '1px', sm: 0 }, mx: { xs: 0, sm: 0 } }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: { xs: 2, sm: 3 },
        gap: { xs: 2, sm: 0 },
        px: { xs: '1px', sm: 0 }
      }}>
        <Box sx={{ width: { xs: '100%', sm: 'auto' }, textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Sales
          </Typography>
        </Box>
        <Box sx={{ 
          display: { xs: 'flex', sm: 'flex' }, 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, 
          alignItems: { xs: 'stretch', sm: 'center' },
          width: { xs: '100%', sm: 'auto' }
        }}>
          {/* First Row for Small Screens: Cart Chip + Point of Sale */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'row', sm: 'row' },
            gap: 2,
            width: { xs: '100%', sm: 'auto' }
          }}>
            {activeTab === 'pos' && (
              <Chip
                icon={<ShoppingCart />}
                label={`${calculateTotalItems()} item${calculateTotalItems() !== 1 ? 's' : ''} in cart`}
                color="primary"
                variant="outlined"
                sx={{ 
                  alignSelf: 'center',
                  height: { xs: '32px', sm: '36.5px' },
                  flex: { xs: 1, sm: 'none' },
                  '& .MuiChip-label': {
                    px: { xs: 1, sm: 1.5 }
                  }
                }}
              />
            )}
            <Button
              variant={activeTab === 'pos' ? 'contained' : 'outlined'}
              onClick={() => {
                setActiveTab('pos');
                // Reset cart view when switching to POS tab
                if (isSmallScreen) {
                  setShowCartView(cart.length > 0);
                }
              }}
              startIcon={<PointOfSale />}
              size={isSmallScreen ? 'small' : 'medium'}
              sx={{ height: { xs: '32px', sm: '36.5px' }, flex: { xs: activeTab === 'pos' ? 1 : 'none', sm: 'none' }, minWidth: { xs: 0, sm: 'auto' } }}
            >
              Point of Sale
            </Button>
          </Box>
          
          {/* Second Row for Small Screens: Orders + Sales History */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'row', sm: 'row' },
            gap: 2,
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Button
              variant={activeTab === 'orders' ? 'contained' : 'outlined'}
              onClick={() => {
                setActiveTab('orders');
                loadUncompletedOrders();
              }}
              startIcon={<OrderIcon />}
              size={isSmallScreen ? 'small' : 'medium'}
              sx={{ height: { xs: '32px', sm: '36.5px' }, flex: { xs: 1, sm: 'none' }, minWidth: { xs: 0, sm: 'auto' } }}
            >
              Orders ({uncompletedOrders.length})
            </Button>
            <Button
              variant={activeTab === 'history' ? 'contained' : 'outlined'}
              onClick={() => {
                setActiveTab('history');
                loadCompletedSales();
              }}
              startIcon={<Receipt />}
              size={isSmallScreen ? 'small' : 'medium'}
              sx={{ height: { xs: '32px', sm: '36.5px' }, flex: { xs: 1, sm: 'none' }, minWidth: { xs: 0, sm: 'auto' } }}
            >
              Sales History
            </Button>
          </Box>
        </Box>
      </Box>

      {activeTab === 'pos' ? (
        <Grid container spacing={{ xs: 0.5, sm: 3 }}>
          {/* Products Section - Hidden on small screens when cart has items */}
          {(!isSmallScreen || !showCartView || cart.length === 0) && (
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: { xs: 1, sm: 2 }, mb: { xs: 0.5, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isSmallScreen && showCartView && cart.length > 0 && (
                    <IconButton
                      onClick={() => setShowCartView(false)}
                      color="primary"
                      aria-label="back to products"
                    >
                      <ArrowBack />
                    </IconButton>
                  )}
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
                </Box>
              </Paper>

              <Paper sx={{ p: { xs: 1, sm: 2 }, maxHeight: '60vh', overflow: 'auto' }}>
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
                  <Grid container spacing={{ xs: 0.5, sm: 2 }}>
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
                            {/* Order History */}
                            {productOrderHistory[product.id] && productOrderHistory[product.id].length > 0 && (
                              <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                  Recent Orders:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {productOrderHistory[product.id].slice(0, 3).map((order, idx) => (
                                    <Chip
                                      key={idx}
                                      label={order.order_number}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        fontSize: '0.65rem',
                                        height: '20px',
                                        cursor: 'pointer',
                                        '&:hover': {
                                          backgroundColor: 'primary.light',
                                          color: 'primary.contrastText',
                                          borderColor: 'primary.main'
                                        }
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Add product with the same quantity from that order
                                        const orderQuantity = order.quantity || 1;
                                        handleAddToCart(product, orderQuantity);
                                      }}
                                      title={`Order ${order.order_number} - Qty: ${order.quantity} - ${order.customer_name}`}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </Grid>
          )}

        {/* Cart Section */}
        <Grid item xs={12} md={isSmallScreen && showCartView && cart.length > 0 ? 12 : 4}>
          <Paper sx={{ p: { xs: 1, sm: 3 }, position: { md: 'sticky' }, top: { md: 80 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Cart {cart.length > 0 && `(${cart.length})`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {cart.length > 0 && (
                  <Tooltip title="Clear all items">
                    <IconButton
                      onClick={handleClearCart}
                      color="error"
                      size="small"
                      aria-label="clear cart"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                )}
                {isSmallScreen && showCartView && cart.length > 0 && (
                  <IconButton
                    onClick={() => setShowCartView(false)}
                    color="inherit"
                    aria-label="back to products"
                    size="small"
                  >
                    <Close />
                  </IconButton>
                )}
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />

            {cart.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShoppingCart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Cart is empty
                </Typography>
                {isSmallScreen && (
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={() => setShowCartView(false)}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    Back to Products
                  </Button>
                )}
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
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell>
                            <Typography variant="body2">{item.product_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.product_sku ? `SKU: ${item.product_sku}` : 'SKU: N/A'}
                            </Typography>
                            {item.stock_quantity !== undefined && (
                              <Typography 
                                variant="caption" 
                                color={item.quantity > item.stock_quantity ? 'error' : 'text.secondary'}
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                Stock: {item.stock_quantity} | Cart: {item.quantity}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.product_id, e.target.value)}
                              inputProps={{ 
                                min: 1, 
                                max: item.stock_quantity || 999999,
                                style: { textAlign: 'center', width: '50px' } 
                              }}
                              sx={{ width: '70px' }}
                              error={item.quantity > (item.stock_quantity || 0)}
                              helperText={item.stock_quantity !== undefined ? `Max: ${item.stock_quantity}` : ''}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.unit_price, currency)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.subtotal, currency)}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Remove from cart">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveFromCart(item.product_id)}
                                aria-label={`Remove ${item.product_name} from cart`}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth sx={{ mb: 2 }} required>
                    <InputLabel>Customer *</InputLabel>
                    <Select
                      value={selectedCustomer}
                      label="Customer *"
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      required
                      error={!selectedCustomer && cart.length > 0}
                    >
                      <MenuItem value="">
                        <em>Select Customer</em>
                      </MenuItem>
                      {customers.map((customer) => (
                        <MenuItem key={customer.id} value={customer.id}>
                          {customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()}
                        </MenuItem>
                      ))}
                    </Select>
                    {!selectedCustomer && cart.length > 0 && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        Customer selection is required to complete sale
                      </Typography>
                    )}
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
                      {activePaymentGateways.length > 0 && (
                        <>
                          <Divider sx={{ my: 0.5 }} />
                          {activePaymentGateways.map((gateway) => (
                            <MenuItem key={gateway.type} value={gateway.type}>
                              {gateway.name}
                            </MenuItem>
                          ))}
                        </>
                      )}
                    </Select>
                  </FormControl>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" color="text.secondary">Total Items:</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {calculateTotalItems()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Total Cost:</Typography>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {formatCurrency(calculateTotal(), currency)}
                    </Typography>
                  </Box>
                </Box>

                {isSmallScreen && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={() => setShowCartView(false)}
                    sx={{ mb: 2, py: 1.5 }}
                  >
                    Back to Products
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="contained"
                  size={isSmallScreen ? 'medium' : 'large'}
                  startIcon={<Payment />}
                  onClick={handleCompleteSale}
                  disabled={processing || initiatingPayment || cart.length === 0 || !selectedCustomer}
                  sx={{ py: { xs: 1.25, sm: 1.5 } }}
                >
                  {processing || initiatingPayment ? 'Processing...' : 'Complete Sale'}
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
      ) : activeTab === 'orders' ? (
        /* Uncompleted Orders Section */
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" gutterBottom>
            Uncompleted Orders
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Orders that are pending or in processing
          </Typography>
          <Divider sx={{ my: 2 }} />

          {loadingSales ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : uncompletedOrders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <OrderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No uncompleted orders
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                All orders have been completed
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uncompletedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.order_number || `#${order.id}`}</TableCell>
                      <TableCell>
                        {order.customer?.name || 
                         (order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 'Walk-in Customer') || 
                         'Walk-in Customer'}
                      </TableCell>
                      <TableCell>
                        {order.order_date || order.created_at ? (
                          <Box>
                            <Typography variant="body2">
                              {new Date(order.order_date || order.created_at).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(order.order_date || order.created_at).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {order.items && order.items.length > 0 ? (
                          <Box>
                            {order.items.slice(0, 2).map((item, idx) => (
                              <Typography key={idx} variant="caption" display="block">
                                {item.product?.name || item.description || 'Product'}
                                {item.product?.sku && ` (SKU: ${item.product.sku})`}
                                {item.quantity > 1 && ` x${item.quantity}`}
                              </Typography>
                            ))}
                            {order.items.length > 2 && (
                              <Typography variant="caption" color="text.secondary">
                                +{order.items.length - 2} more
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">No items</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(order.total_amount || 0, currency)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status || 'pending'}
                          size="small"
                          color={order.status === 'processing' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={async () => {
                            try {
                              await orderService.completeOrder(order.id);
                              toast.success('Order completed successfully');
                              await loadUncompletedOrders();
                              await loadCompletedSales();
                            } catch (error) {
                              toast.error(error.response?.data?.error || 'Failed to complete order');
                            }
                          }}
                        >
                          Complete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      ) : (
        /* Sales History Section */
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
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
                        <TableCell>Items</TableCell>
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
                             (sale.customer ? `${sale.customer.first_name || ''} ${sale.customer.last_name || ''}`.trim() : 'Walk-in Customer') || 
                             'Walk-in Customer'}
                          </TableCell>
                      <TableCell>
                        {sale.order_date 
                          ? new Date(sale.order_date).toLocaleString() 
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {sale.items && sale.items.length > 0 ? (
                          <Box>
                            {sale.items.slice(0, 2).map((item, idx) => (
                              <Typography key={idx} variant="caption" display="block">
                                {item.product?.name || item.description || 'Product'}
                                {item.product?.sku && ` (SKU: ${item.product.sku})`}
                                {item.quantity > 1 && ` x${item.quantity}`}
                              </Typography>
                            ))}
                            {sale.items.length > 2 && (
                              <Typography variant="caption" color="text.secondary">
                                +{sale.items.length - 2} more
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">No items</Typography>
                        )}
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
                              sx={{ padding: { xs: '4px', sm: '8px' } }}
                            >
                              <Print fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleDownloadReceipt(sale.receipt.id, sale.receipt.receipt_number, sale.id)}
                              title="Download Receipt"
                              sx={{ padding: { xs: '4px', sm: '8px' } }}
                            >
                              <GetApp fontSize="small" />
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

