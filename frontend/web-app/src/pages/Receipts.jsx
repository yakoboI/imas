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
  Grid,
  Chip,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search,
  Receipt as ReceiptIcon,
  GetApp,
  Visibility,
  Print,
  Close,
} from '@mui/icons-material';
import receiptService from '../services/receiptService';
import tenantSettingsService from '../services/tenantSettingsService';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/currency';

function Receipts() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [viewDialog, setViewDialog] = useState({ open: false, receipt: null });
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState(null);

  useEffect(() => {
    loadReceipts();
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

  const loadReceipts = async () => {
    try {
      const response = await receiptService.listReceipts();
      setReceipts(response.receipts || response.data || []);
    } catch (error) {
      console.error('Failed to load receipts:', error);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (id, receiptNumber, orderId) => {
    try {
      // First, try to get the receipt to check if PDF exists
      let receipt;
      try {
        const receiptResponse = await receiptService.getReceipt(id);
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
      const blob = await receiptService.downloadPDF(id);
      if (!blob || blob.size === 0) {
        toast.error('Receipt PDF is not available. The PDF may still be generating. Please try again in a moment.');
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receiptNumber || id}.pdf`;
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
        // If PDF doesn't exist, try using preview as fallback
        if (orderId) {
          toast.info('PDF not found. Attempting to generate receipt...');
          try {
            await receiptService.generateReceipt(orderId, { templateType: 'thermal' });
            toast.info('Receipt regenerated. Please try downloading again.');
          } catch (genError) {
            toast.error('Receipt PDF is not available. Please generate the receipt first from the Sales page.');
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

  const handlePrintReceipt = async (id, orderId) => {
    try {
      // First, try to get the receipt to check if PDF exists
      let receipt;
      try {
        const receiptResponse = await receiptService.getReceipt(id);
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
      const blob = await receiptService.downloadPDF(id);
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
        // If PDF doesn't exist, try using preview as fallback
        if (orderId) {
          toast.info('PDF not found. Attempting to generate receipt...');
          try {
            await receiptService.generateReceipt(orderId, { templateType: 'thermal' });
            toast.info('Receipt regenerated. Please try printing again.');
          } catch (genError) {
            toast.error('Receipt PDF is not available. Please generate the receipt first from the Sales page.');
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

  const handleViewReceipt = async (receipt) => {
    setViewDialog({ open: true, receipt });
    setLoadingReceipt(true);
    try {
      const response = await receiptService.getReceipt(receipt.id);
      setReceiptDetails(response.receipt || response.data);
    } catch (error) {
      console.error('Failed to load receipt details:', error);
      // Use the receipt from the list if API fails
      setReceiptDetails(receipt);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const filteredReceipts = receipts.filter((receipt) =>
    receipt.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Receipts
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          View and manage sales receipts and invoices
        </Typography>
      </Box>

      <TextField
        fullWidth
        placeholder="Search receipts by receipt number, order number, or customer..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        size={isSmallScreen ? 'small' : 'medium'}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {filteredReceipts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No receipts found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'Receipts will appear here once orders are completed'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Receipt Number</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Order Number</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Customer</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Amount</TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{receipt.receipt_number || `#${receipt.id}`}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>{receipt.order_number || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{receipt.customer_name || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                    {receipt.issue_date ? new Date(receipt.issue_date).toLocaleDateString() : (receipt.created_at ? new Date(receipt.created_at).toLocaleDateString() : 'N/A')}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {formatCurrency(receipt.total_amount || 0, currency)}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handlePrintReceipt(receipt.id, receipt.order_id)}
                      title="Print Receipt"
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <Print fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleDownloadPDF(receipt.id, receipt.receipt_number, receipt.order_id)}
                      title="Download Receipt"
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <GetApp fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => handleViewReceipt(receipt)}
                      title="View Receipt"
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

      {/* View Receipt Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={() => setViewDialog({ open: false, receipt: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Receipt Details - {receiptDetails?.receipt_number || viewDialog.receipt?.receipt_number}</span>
            {isSmallScreen && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => setViewDialog({ open: false, receipt: null })}
                aria-label="close"
                size="small"
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingReceipt ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : receiptDetails ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Receipt Number</Typography>
                <Typography variant="body1" fontWeight="bold">{receiptDetails.receipt_number}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Order Number</Typography>
                <Typography variant="body1">{receiptDetails.order_number || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Issue Date</Typography>
                <Typography variant="body1">
                  {receiptDetails.issue_date || receiptDetails.created_at
                    ? new Date(receiptDetails.issue_date || receiptDetails.created_at).toLocaleString()
                    : 'N/A'}
                </Typography>
              </Grid>
              {receiptDetails.customer_name && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Customer</Typography>
                  <Typography variant="body1">{receiptDetails.customer_name}</Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom>Amount Details</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(receiptDetails.total_amount || 0, currency)}
                </Typography>
              </Grid>
              {receiptDetails.tax_amount > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Tax Amount</Typography>
                  <Typography variant="body1">
                    {formatCurrency(receiptDetails.tax_amount || 0, currency)}
                  </Typography>
                </Grid>
              )}
              {receiptDetails.discount_amount > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Discount</Typography>
                  <Typography variant="body1">
                    {formatCurrency(receiptDetails.discount_amount || 0, currency)}
                  </Typography>
                </Grid>
              )}
              {receiptDetails.payment_method && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                  <Chip
                    label={receiptDetails.payment_method.replace('_', ' ').toUpperCase()}
                    size="small"
                    color="default"
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip
                  label={receiptDetails.status || 'active'}
                  size="small"
                  color={receiptDetails.status === 'active' ? 'success' : 'default'}
                />
              </Grid>
            </Grid>
          ) : (
            <Typography>No receipt details available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {receiptDetails && (
            <>
              <Button
                onClick={() => handlePrintReceipt(receiptDetails.id, receiptDetails.order_id)}
                startIcon={<Print />}
                size={isSmallScreen ? 'small' : 'medium'}
              >
                Print
              </Button>
              <Button
                onClick={() => handleDownloadPDF(receiptDetails.id, receiptDetails.receipt_number, receiptDetails.order_id)}
                startIcon={<GetApp />}
                size={isSmallScreen ? 'small' : 'medium'}
              >
                Download
              </Button>
            </>
          )}
          <Button 
            onClick={() => setViewDialog({ open: false, receipt: null })}
            size={isSmallScreen ? 'small' : 'medium'}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Receipts;
