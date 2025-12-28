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
  Email,
  Block,
  History,
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
  const [emailDialog, setEmailDialog] = useState({ open: false, receiptId: null, email: '' });
  const [voidDialog, setVoidDialog] = useState({ open: false, receiptId: null, reason: '' });
  const [auditDialog, setAuditDialog] = useState({ open: false, receiptId: null, auditTrail: [] });
  const [previewDialog, setPreviewDialog] = useState({ open: false, receiptId: null, previewData: null });
  const [loadingPreview, setLoadingPreview] = useState(false);

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

  const handleEmailReceipt = (receipt) => {
    setEmailDialog({
      open: true,
      receiptId: receipt.id,
      email: receipt.customer_email || receipt.customer?.email || ''
    });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailDialog.email || !emailDialog.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      await receiptService.emailReceipt(emailDialog.receiptId, emailDialog.email);
      toast.success('Receipt sent via email successfully');
      setEmailDialog({ open: false, receiptId: null, email: '' });
    } catch (error) {
      console.error('Failed to email receipt:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send receipt via email';
      
      // Check for SMTP/email configuration errors
      if (errorMessage.includes('BadCredentials') || 
          errorMessage.includes('Invalid login') || 
          errorMessage.includes('SMTP') ||
          errorMessage.includes('email service') ||
          error.response?.status === 500) {
        toast.error(
          'Email service is not configured correctly. Please contact your administrator to configure SMTP settings.',
          { autoClose: 5000 }
        );
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleVoidReceipt = (receipt) => {
    if (receipt.status === 'voided') {
      toast.info('This receipt is already voided');
      return;
    }
    setVoidDialog({
      open: true,
      receiptId: receipt.id,
      reason: ''
    });
  };

  const handleVoidSubmit = async (e) => {
    e.preventDefault();
    if (!voidDialog.reason.trim()) {
      toast.error('Please provide a reason for voiding the receipt');
      return;
    }

    if (!window.confirm('Are you sure you want to void this receipt? This action cannot be undone.')) {
      return;
    }

    try {
      await receiptService.voidReceipt(voidDialog.receiptId, voidDialog.reason);
      toast.success('Receipt voided successfully');
      setVoidDialog({ open: false, receiptId: null, reason: '' });
      loadReceipts();
      // Close view dialog if viewing this receipt
      if (viewDialog.receipt?.id === voidDialog.receiptId) {
        setViewDialog({ open: false, receipt: null });
      }
    } catch (error) {
      console.error('Failed to void receipt:', error);
      toast.error(error.response?.data?.error || 'Failed to void receipt');
    }
  };

  const handleViewAudit = async (receiptId) => {
    setAuditDialog({ open: true, receiptId, auditTrail: [] });
    try {
      const response = await receiptService.getReceiptAudit(receiptId);
      setAuditDialog({
        open: true,
        receiptId,
        auditTrail: response.audit_trail || response.data || []
      });
    } catch (error) {
      console.error('Failed to load receipt audit:', error);
      toast.error('Failed to load receipt audit trail');
    }
  };

  const handlePreviewReceipt = async (receiptId) => {
    setPreviewDialog({ open: true, receiptId, previewData: null });
    setLoadingPreview(true);
    try {
      const response = await receiptService.previewReceipt(receiptId);
      setPreviewDialog({
        open: true,
        receiptId,
        previewData: response.preview || response.data || response
      });
    } catch (error) {
      console.error('Failed to load receipt preview:', error);
      toast.error('Failed to load receipt preview');
      setPreviewDialog({ open: false, receiptId: null, previewData: null });
    } finally {
      setLoadingPreview(false);
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
                    {receipt.status !== 'voided' && (
                      <>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEmailReceipt(receipt)}
                          title="Email Receipt"
                          sx={{ padding: { xs: '4px', sm: '8px' } }}
                        >
                          <Email fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleVoidReceipt(receipt)}
                          title="Void Receipt"
                          sx={{ padding: { xs: '4px', sm: '8px' } }}
                        >
                          <Block fontSize="small" />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handlePreviewReceipt(receipt.id)}
                      title="Preview Receipt"
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => handleViewAudit(receipt.id)}
                      title="View Audit Trail"
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <History fontSize="small" />
                    </IconButton>
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

      {/* Email Receipt Dialog */}
      <Dialog
        open={emailDialog.open}
        onClose={() => setEmailDialog({ open: false, receiptId: null, email: '' })}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleEmailSubmit}>
          <DialogTitle>Email Receipt</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={emailDialog.email}
              onChange={(e) => setEmailDialog({ ...emailDialog, email: e.target.value })}
              required
              sx={{ mt: 1 }}
              helperText="Enter the email address to send the receipt to"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEmailDialog({ open: false, receiptId: null, email: '' })}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" startIcon={<Email />}>
              Send Receipt
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Void Receipt Dialog */}
      <Dialog
        open={voidDialog.open}
        onClose={() => setVoidDialog({ open: false, receiptId: null, reason: '' })}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleVoidSubmit}>
          <DialogTitle>Void Receipt</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Reason for Void"
              value={voidDialog.reason}
              onChange={(e) => setVoidDialog({ ...voidDialog, reason: e.target.value })}
              required
              multiline
              rows={4}
              sx={{ mt: 1 }}
              helperText="Please provide a reason for voiding this receipt"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVoidDialog({ open: false, receiptId: null, reason: '' })}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="error" startIcon={<Block />}>
              Void Receipt
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Audit Trail Dialog */}
      <Dialog
        open={auditDialog.open}
        onClose={() => setAuditDialog({ open: false, receiptId: null, auditTrail: [] })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Receipt Audit Trail</DialogTitle>
        <DialogContent>
          {auditDialog.auditTrail.length === 0 ? (
            <Typography color="text.secondary">No audit trail available</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditDialog.auditTrail.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip label={entry.action || 'N/A'} size="small" />
                      </TableCell>
                      <TableCell>{entry.user_email || entry.user || 'System'}</TableCell>
                      <TableCell>{entry.description || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditDialog({ open: false, receiptId: null, auditTrail: [] })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, receiptId: null, previewData: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Receipt Preview</span>
            {isSmallScreen && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => setPreviewDialog({ open: false, receiptId: null, previewData: null })}
                aria-label="close"
                size="small"
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingPreview ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : previewDialog.previewData ? (
            <Box>
              {previewDialog.previewData.html ? (
                <Box
                  dangerouslySetInnerHTML={{ __html: previewDialog.previewData.html }}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    bgcolor: 'background.paper',
                  }}
                />
              ) : previewDialog.previewData.url ? (
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <iframe
                    src={previewDialog.previewData.url}
                    style={{
                      width: '100%',
                      height: '600px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                    title="Receipt Preview"
                  />
                </Box>
              ) : (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Receipt #{previewDialog.previewData.receipt_number || previewDialog.receiptId}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                      <Typography variant="h6">
                        {formatCurrency(previewDialog.previewData.total_amount || 0, currency)}
                      </Typography>
                    </Grid>
                    {previewDialog.previewData.customer_name && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Customer</Typography>
                        <Typography variant="body1">{previewDialog.previewData.customer_name}</Typography>
                      </Grid>
                    )}
                    {previewDialog.previewData.issue_date && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Issue Date</Typography>
                        <Typography variant="body1">
                          {new Date(previewDialog.previewData.issue_date).toLocaleString()}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                  {previewDialog.previewData.items && previewDialog.previewData.items.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>Items</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Product</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Price</TableCell>
                              <TableCell align="right">Subtotal</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {previewDialog.previewData.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.product_name || item.name || 'N/A'}</TableCell>
                                <TableCell align="right">{item.quantity || 0}</TableCell>
                                <TableCell align="right">
                                  {formatCurrency(item.unit_price || 0, currency)}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(item.subtotal || 0, currency)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </Paper>
              )}
            </Box>
          ) : (
            <Typography color="text.secondary">No preview data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {previewDialog.previewData && (
            <>
              <Button
                onClick={() => {
                  if (previewDialog.receiptId) {
                    handleDownloadPDF(previewDialog.receiptId, previewDialog.previewData?.receipt_number, previewDialog.previewData?.order_id);
                  }
                }}
                startIcon={<GetApp />}
                size={isSmallScreen ? 'small' : 'medium'}
              >
                Download PDF
              </Button>
              <Button
                onClick={() => {
                  if (previewDialog.receiptId) {
                    handlePrintReceipt(previewDialog.receiptId, previewDialog.previewData?.order_id);
                  }
                }}
                startIcon={<Print />}
                size={isSmallScreen ? 'small' : 'medium'}
              >
                Print
              </Button>
            </>
          )}
          <Button
            onClick={() => setPreviewDialog({ open: false, receiptId: null, previewData: null })}
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
