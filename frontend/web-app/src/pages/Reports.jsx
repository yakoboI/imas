import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Button,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Assessment as ReportsIcon,
  Print as PrintIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import reportService from '../services/reportService';
import userService from '../services/userService';
import { formatCurrency } from '../utils/currency';
import { exportReportToCSV } from '../utils/csvExport';

function Reports() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState(null);
  const [allReportsData, setAllReportsData] = useState(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [tenantName, setTenantName] = useState('');

  const reportTypes = [
    { value: 'sales', label: 'Sales report' },
    { value: 'inventory', label: 'Inventory report' },
    { value: 'orders', label: 'Orders report' },
    { value: 'customers', label: 'Customers report' },
    { value: 'products', label: 'Products report' },
  ];

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
    { value: 'quarter', label: 'This quarter' },
    { value: 'year', label: 'This year' },
    { value: 'custom', label: 'Custom range' },
  ];

  useEffect(() => {
    const loadTenantName = async () => {
      try {
        const response = await userService.getProfile();
        const tenant = response?.user?.tenant;
        const name =
          tenant?.company_name ||
          tenant?.name ||
          '';
        setTenantName(name);
      } catch (error) {
        // If tenant name cannot be loaded, we simply omit it from the report
        console.error('Failed to load tenant name for reports:', error);
      }
    };

    loadTenantName();
  }, []);

  const buildFilters = () => {
    if (dateRange === 'custom') {
      const filters = {};
      if (customStart) filters.startDate = customStart;
      if (customEnd) filters.endDate = customEnd;
      return filters;
    }
    
    // Build date filters for predefined ranges
    const now = new Date();
    const filters = {};
    
    if (dateRange === 'today') {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      filters.startDate = today.toISOString().split('T')[0];
      filters.endDate = now.toISOString().split('T')[0];
    } else if (dateRange === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      filters.startDate = weekStart.toISOString().split('T')[0];
      filters.endDate = now.toISOString().split('T')[0];
    } else if (dateRange === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filters.startDate = monthStart.toISOString().split('T')[0];
      filters.endDate = now.toISOString().split('T')[0];
    } else if (dateRange === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
      filters.startDate = quarterStart.toISOString().split('T')[0];
      filters.endDate = now.toISOString().split('T')[0];
    } else if (dateRange === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filters.startDate = yearStart.toISOString().split('T')[0];
      filters.endDate = now.toISOString().split('T')[0];
    }
    
    return filters;
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setData(null);
      setAllReportsData(null); // Clear all reports data when generating specific report

      const filters = buildFilters();
      console.log('[Reports] Generating report:', { reportType, filters });

      let response;
      if (reportType === 'sales') {
        response = await reportService.getSalesReport(filters);
      } else if (reportType === 'inventory') {
        response = await reportService.getInventoryReport(filters);
      } else if (reportType === 'orders') {
        response = await reportService.getOrdersReport(filters);
      } else if (reportType === 'customers') {
        response = await reportService.getCustomersReport(filters);
      } else if (reportType === 'products') {
        response = await reportService.getProductsReport(filters);
      }

      console.log('[Reports] Report data received:', response);
      setData(response || {});
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('[Reports] Failed to load report:', error);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to load report. Please check your connection and try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAllReports = async () => {
    try {
      setLoadingAll(true);
      setAllReportsData(null);
      setData(null); // Clear specific report data when printing all reports

      const filters = buildFilters();

      // Load all reports in parallel for better performance
      const [sales, orders, products, inventory, customers] = await Promise.all([
        reportService.getSalesReport(filters).catch(() => ({})),
        reportService.getOrdersReport(filters).catch(() => ({})),
        reportService.getProductsReport(filters).catch(() => ({})),
        reportService.getInventoryReport(filters).catch(() => ({})),
        reportService.getCustomersReport(filters).catch(() => ({})),
      ]);

      setAllReportsData({
        sales,
        orders,
        products,
        inventory,
        customers,
        generatedAt: new Date().toLocaleString(),
        dateRange: dateRange === 'custom' 
          ? `${customStart || 'N/A'} to ${customEnd || 'N/A'}`
          : dateRanges.find(r => r.value === dateRange)?.label || dateRange,
      });

      toast.success('All reports generated successfully');
      
      // Small delay to ensure state is updated before printing
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (error) {
      console.error('Failed to load all reports:', error);
      toast.error(error.response?.data?.error || 'Failed to load all reports');
    } finally {
      setLoadingAll(false);
    }
  };

  const renderSectionTitle = (index, title) => (
    <Typography
      variant="subtitle1"
      sx={{ fontWeight: 600, mb: 1, mt: index === 1 ? 0 : 3 }}
    >
      {index}. {title}
    </Typography>
  );

  const tablePaperSx = {
    p: 2,
    borderRadius: 0,
    border: '1px solid #e0e0e0',
    boxShadow: 'none',
  };

  const headerCellSx = {
    fontWeight: 600,
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
  };

  const bodyCellSx = {
    borderBottom: '1px solid #f0f0f0',
  };

  const renderSalesReport = (reportData) => {
    if (!reportData) return null;

    return (
      <Box>
        {renderSectionTitle(1, 'Sales overview')}
        <Paper sx={tablePaperSx}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Total revenue
              </Typography>
              <Typography variant="h6" sx={{ color: '#1976d2' }}>
                {formatCurrency(reportData.totalRevenue || 0)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Total days
              </Typography>
              <Typography variant="h6">
                {Array.isArray(reportData.revenueByDate) ? reportData.revenueByDate.length : 0}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Total receipts
              </Typography>
              <Typography variant="h6">
                {Array.isArray(reportData.revenueByDate)
                  ? reportData.revenueByDate.reduce((sum, r) => sum + (r.count || 0), 0)
                  : 0}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Payment methods
              </Typography>
              <Typography variant="h6">
                {Array.isArray(reportData.paymentMethods) ? reportData.paymentMethods.length : 0}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {renderSectionTitle(2, 'Revenue by date')}
        <Paper sx={{ ...tablePaperSx, mb: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>#</TableCell>
                  <TableCell sx={headerCellSx}>Date</TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    Revenue
                  </TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    Receipts
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(reportData.revenueByDate || []).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                    <TableCell sx={bodyCellSx}>{row.date}</TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {formatCurrency(row.revenue || 0)}
                    </TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {row.count || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {renderSectionTitle(3, 'Top products by revenue')}
            <Paper sx={tablePaperSx}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>#</TableCell>
                      <TableCell sx={headerCellSx}>Product</TableCell>
                      <TableCell sx={headerCellSx}>SKU</TableCell>
                      <TableCell sx={headerCellSx} align="right">
                        Qty
                      </TableCell>
                      <TableCell sx={headerCellSx} align="right">
                        Revenue
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                  {(reportData.topProducts || []).map((p, index) => (
                      <TableRow key={index}>
                        <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                        <TableCell sx={bodyCellSx}>{p.productName}</TableCell>
                        <TableCell sx={bodyCellSx}>{p.sku}</TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {p.quantity || 0}
                        </TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {formatCurrency(p.revenue || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            {renderSectionTitle(4, 'Top customers by revenue')}
            <Paper sx={tablePaperSx}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>#</TableCell>
                      <TableCell sx={headerCellSx}>Customer</TableCell>
                      <TableCell sx={headerCellSx}>Email</TableCell>
                      <TableCell sx={headerCellSx} align="right">
                        Orders
                      </TableCell>
                      <TableCell sx={headerCellSx} align="right">
                        Revenue
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                  {(reportData.topCustomers || []).map((c, index) => (
                      <TableRow key={index}>
                        <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                        <TableCell sx={bodyCellSx}>{c.customerName}</TableCell>
                        <TableCell sx={bodyCellSx}>{c.email}</TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {c.orderCount || 0}
                        </TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {formatCurrency(c.revenue || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {renderSectionTitle(5, 'Payment methods')}
        <Paper sx={tablePaperSx}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>#</TableCell>
                  <TableCell sx={headerCellSx}>Method</TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    Receipts
                  </TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    Revenue
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {(reportData.paymentMethods || []).map((pm, index) => (
                  <TableRow key={index}>
                    <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                    <TableCell sx={bodyCellSx}>{pm.method}</TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {pm.count || 0}
                    </TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {formatCurrency(pm.revenue || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  };

  const renderInventoryReport = (reportData) => {
    if (!reportData) return null;

    return (
      <Box>
        {renderSectionTitle(1, 'Inventory overview')}
        <Paper sx={tablePaperSx}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Total stock value
              </Typography>
              <Typography variant="h6" sx={{ color: '#2e7d32' }}>
                {formatCurrency(reportData.totalStockValue || 0)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Low stock items
              </Typography>
              <Typography variant="h6">
                {Array.isArray(reportData.lowStockItems) ? reportData.lowStockItems.length : 0}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Out of stock items
              </Typography>
              <Typography variant="h6">
                {Array.isArray(reportData.outOfStockItems) ? reportData.outOfStockItems.length : 0}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {renderSectionTitle(2, 'Low stock items')}
        <Paper sx={{ ...tablePaperSx, mb: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>#</TableCell>
                  <TableCell sx={headerCellSx}>Product</TableCell>
                  <TableCell sx={headerCellSx}>SKU</TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    Qty
                  </TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    Reorder level
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {(reportData.lowStockItems || []).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                    <TableCell sx={bodyCellSx}>{item.productName}</TableCell>
                    <TableCell sx={bodyCellSx}>{item.sku}</TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {item.quantity}
                    </TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {item.reorderLevel}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {renderSectionTitle(3, 'Stock value by category')}
            <Paper sx={tablePaperSx}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>#</TableCell>
                      <TableCell sx={headerCellSx}>Category</TableCell>
                      <TableCell sx={headerCellSx} align="right">
                        Quantity
                      </TableCell>
                      <TableCell sx={headerCellSx} align="right">
                        Value
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                  {(reportData.stockByCategory || []).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                        <TableCell sx={bodyCellSx}>{row.categoryName}</TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {row.totalQuantity}
                        </TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {formatCurrency(row.totalValue || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            {renderSectionTitle(4, 'Out of stock items')}
            <Paper sx={tablePaperSx}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>#</TableCell>
                      <TableCell sx={headerCellSx}>Product</TableCell>
                      <TableCell sx={headerCellSx}>SKU</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                  {(reportData.outOfStockItems || []).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                        <TableCell sx={bodyCellSx}>{item.productName}</TableCell>
                        <TableCell sx={bodyCellSx}>{item.sku}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderOrdersReport = (reportData) => {
    if (!reportData) return null;

    return (
      <Box>
        {renderSectionTitle(1, 'Orders overview')}
        <Paper sx={tablePaperSx}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Total orders
              </Typography>
              <Typography variant="h6" sx={{ color: '#1976d2' }}>
                {(reportData.ordersByStatus || []).reduce(
                  (sum, o) => sum + (o.count || 0),
                  0
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Average order value
              </Typography>
              <Typography variant="h6">
                {formatCurrency(reportData.averageOrderValue || 0)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Days in range
              </Typography>
              <Typography variant="h6">
                {Array.isArray(reportData.ordersByDate) ? reportData.ordersByDate.length : 0}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {renderSectionTitle(2, 'Orders by status')}
        <Paper sx={{ ...tablePaperSx, mb: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>#</TableCell>
                  <TableCell sx={headerCellSx}>Status</TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    Orders
                  </TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    Revenue
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {(reportData.ordersByStatus || []).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                    <TableCell sx={bodyCellSx}>{row.status}</TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {row.count || 0}
                    </TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {formatCurrency(row.revenue || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {renderSectionTitle(3, 'Orders by payment method')}
            <Paper sx={tablePaperSx}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>#</TableCell>
                      <TableCell sx={headerCellSx}>Method</TableCell>
                      <TableCell sx={headerCellSx} align="right">
                        Orders
                      </TableCell>
                      <TableCell sx={headerCellSx} align="right">
                        Revenue
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                {(reportData.ordersByPayment || []).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                        <TableCell sx={bodyCellSx}>{row.method}</TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {row.count || 0}
                        </TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {formatCurrency(row.revenue || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            {renderSectionTitle(4, 'Orders by date')}
            <Paper sx={tablePaperSx}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>#</TableCell>
                      <TableCell sx={headerCellSx}>Date</TableCell>
                      <TableCell sx={headerCellSx} align="right">
                        Orders
                      </TableCell>
                      <TableCell sx={headerCellSx} align="right">
                        Revenue
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
              {(reportData.ordersByDate || []).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                        <TableCell sx={bodyCellSx}>{row.date}</TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {row.count || 0}
                        </TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {formatCurrency(row.revenue || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderCustomersReport = (reportData) => {
    if (!reportData) return null;

    return (
      <Box>
        {renderSectionTitle(1, 'Customer overview')}
        <Paper sx={tablePaperSx}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Total customers
              </Typography>
              <Typography variant="h6" sx={{ color: '#1976d2' }}>
                {reportData.totalCustomers || 0}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Active (with orders)
              </Typography>
              <Typography variant="h6">
                {Array.isArray(reportData.topCustomers) ? reportData.topCustomers.length : 0}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Days with new customers
              </Typography>
              <Typography variant="h6">
                {Array.isArray(reportData.newCustomersByDate)
                  ? reportData.newCustomersByDate.length
                  : 0}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {renderSectionTitle(2, 'Top customers by revenue')}
        <Paper sx={{ ...tablePaperSx, mb: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>#</TableCell>
                  <TableCell sx={headerCellSx}>Customer</TableCell>
                  <TableCell sx={headerCellSx}>Email</TableCell>
                  <TableCell sx={headerCellSx}>Phone</TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    Orders
                  </TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    Revenue
                  </TableCell>
                  <TableCell sx={headerCellSx}>Last order</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {(reportData.topCustomers || []).map((c, index) => (
                  <TableRow key={index}>
                    <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                    <TableCell sx={bodyCellSx}>{c.customerName}</TableCell>
                    <TableCell sx={bodyCellSx}>{c.email}</TableCell>
                    <TableCell sx={bodyCellSx}>{c.phone}</TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {c.orderCount || 0}
                    </TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {formatCurrency(c.totalRevenue || 0)}
                    </TableCell>
                    <TableCell sx={bodyCellSx}>
                      {c.lastOrderDate
                        ? new Date(c.lastOrderDate).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {renderSectionTitle(3, 'New customers by date')}
        <Paper sx={tablePaperSx}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>#</TableCell>
                  <TableCell sx={headerCellSx}>Date</TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    New customers
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {(reportData.newCustomersByDate || []).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                    <TableCell sx={bodyCellSx}>{row.date}</TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {row.count || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  };

  const renderProductsReport = (reportData) => {
    if (!reportData) return null;

    return (
      <Box>
        {renderSectionTitle(1, 'Product overview')}
        <Paper sx={tablePaperSx}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Best sellers
              </Typography>
              <Typography variant="h6" sx={{ color: '#1976d2' }}>
                {Array.isArray(reportData.bestSellers) ? reportData.bestSellers.length : 0}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Categories
              </Typography>
              <Typography variant="h6">
                {Array.isArray(reportData.productsByCategory)
                  ? reportData.productsByCategory.length
                  : 0}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Slow moving products
              </Typography>
              <Typography variant="h6">
                {Array.isArray(reportData.slowMovingProducts)
                  ? reportData.slowMovingProducts.length
                  : 0}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {renderSectionTitle(2, 'Best selling products')}
        <Paper sx={{ ...tablePaperSx, mb: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>#</TableCell>
                  <TableCell sx={headerCellSx}>Product</TableCell>
                  <TableCell sx={headerCellSx}>SKU</TableCell>
                  <TableCell sx={headerCellSx}>Category</TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    Qty
                  </TableCell>
                  <TableCell sx={headerCellSx} align="right">
                    Revenue
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {(reportData.bestSellers || []).map((p, index) => (
                  <TableRow key={index}>
                    <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                    <TableCell sx={bodyCellSx}>{p.productName}</TableCell>
                    <TableCell sx={bodyCellSx}>{p.sku}</TableCell>
                    <TableCell sx={bodyCellSx}>{p.category}</TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {p.totalQuantity || 0}
                    </TableCell>
                    <TableCell sx={bodyCellSx} align="right">
                      {formatCurrency(p.totalRevenue || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {renderSectionTitle(3, 'Products by category')}
            <Paper sx={tablePaperSx}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>#</TableCell>
                      <TableCell sx={headerCellSx}>Category</TableCell>
                      <TableCell sx={headerCellSx} align="right">
                        Products
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
              {(reportData.productsByCategory || []).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                        <TableCell sx={bodyCellSx}>{row.categoryName}</TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {row.count || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            {renderSectionTitle(4, 'Slow moving products (no sales)')}
            <Paper sx={tablePaperSx}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>#</TableCell>
                      <TableCell sx={headerCellSx}>Product</TableCell>
                      <TableCell sx={headerCellSx}>SKU</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
              {(reportData.slowMovingProducts || []).map((p, index) => (
                      <TableRow key={index}>
                        <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                        <TableCell sx={bodyCellSx}>{p.productName}</TableCell>
                        <TableCell sx={bodyCellSx}>{p.sku}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderAllReports = () => {
    if (!allReportsData) return null;

    return (
      <Box
        id="all-reports-container"
        sx={{
          '@media print': {
            '& .no-print': { display: 'none' },
            '& .page-break': { pageBreakAfter: 'always' },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center', borderBottom: '2px solid #1976d2', pb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
            Comprehensive Business Analytics Report
          </Typography>
          {tenantName && (
            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 600 }}>
              {tenantName}
            </Typography>
          )}
          <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
            Date Range: {allReportsData.dateRange}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            Generated: {allReportsData.generatedAt}
          </Typography>
        </Box>

        {/* Report 1: Sales */}
        <Box className="page-break" sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1976d2', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
            REPORT 1: SALES ANALYTICS
          </Typography>
          {renderSalesReport(allReportsData.sales)}
        </Box>

        {/* Report 2: Orders */}
        <Box className="page-break" sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1976d2', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
            REPORT 2: ORDERS ANALYTICS
          </Typography>
          {renderOrdersReport(allReportsData.orders)}
        </Box>

        {/* Report 3: Products */}
        <Box className="page-break" sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1976d2', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
            REPORT 3: PRODUCTS ANALYTICS
          </Typography>
          {renderProductsReport(allReportsData.products)}
        </Box>

        {/* Report 4: Inventory */}
        <Box className="page-break" sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1976d2', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
            REPORT 4: INVENTORY ANALYTICS
          </Typography>
          {renderInventoryReport(allReportsData.inventory)}
        </Box>

        {/* Report 5: Customers */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1976d2', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
            REPORT 5: CUSTOMERS ANALYTICS
          </Typography>
          {renderCustomersReport(allReportsData.customers)}
        </Box>
      </Box>
    );
  };

  const renderReportContent = () => {
    // Show all reports if available
    if (allReportsData) {
      return renderAllReports();
    }

    if (loading || loadingAll) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="320px">
          <CircularProgress />
        </Box>
      );
    }

    if (!data) {
      return (
        <Box
          sx={{
            minHeight: 320,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <ReportsIcon sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No report generated yet
          </Typography>
          <Typography variant="body2">
            Select a report type and date range, then click
            {' '}
            <strong>Generate report</strong>
            {' '}
            to see analytics here.
          </Typography>
        </Box>
      );
    }

    if (reportType === 'sales') return renderSalesReport(data);
    if (reportType === 'inventory') return renderInventoryReport(data);
    if (reportType === 'orders') return renderOrdersReport(data);
    if (reportType === 'customers') return renderCustomersReport(data);
    if (reportType === 'products') return renderProductsReport(data);

    return null;
  };

  const showCustomRange = dateRange === 'custom';

  return (
    <Box>
      {/* Page title and description - shown on screen, hidden in print */}
      <Box
        sx={{
          mb: 3,
          '@media print': {
            display: 'none',
          },
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Reports
        </Typography>
        {tenantName && (
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Tenant: {tenantName}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          Well structured analytics based on your sales, orders, customers, products and stock.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left configuration panel - do not print */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            '@media print': {
              display: 'none',
            },
          }}
        >
          <Paper
            sx={{
              p: 3,
              borderRadius: 0,
              border: '1px solid #e0e0e0',
              boxShadow: 'none',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Report configuration
            </Typography>

            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Report type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                {reportTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                select
                size="small"
                label="Date range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                {dateRanges.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              {showCustomRange && (
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Start date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="End date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </Grid>
                </Grid>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={handleGenerateReport}
                disabled={loading || loadingAll}
                size={isSmallScreen ? 'small' : 'medium'}
                sx={{ mb: 1 }}
              >
                Generate report
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PrintIcon />}
                onClick={handlePrintAllReports}
                disabled={loading || loadingAll}
                size={isSmallScreen ? 'small' : 'medium'}
                sx={{ mb: 1 }}
              >
                Print all reports
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<DownloadIcon />}
                onClick={() => {
                  if (data) {
                    exportReportToCSV(data, reportType, dateRange === 'custom' ? `${customStart}-${customEnd}` : dateRange);
                    toast.success('Report exported to CSV');
                  } else {
                    toast.info('Please generate a report first');
                  }
                }}
                disabled={loading || loadingAll || !data}
                size={isSmallScreen ? 'small' : 'medium'}
              >
                Export to CSV
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Right analytics panel - this is what gets printed */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 0,
              border: '1px solid #e0e0e0',
              boxShadow: 'none',
              minHeight: 360,
              '@media print': {
                border: 'none',
                boxShadow: 'none',
                p: 2,
              },
            }}
          >
            {renderReportContent()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Reports;
