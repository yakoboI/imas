/**
 * CSV Export Utility
 * Converts data arrays to CSV format and triggers download
 */

export const exportToCSV = (data, filename, headers = null) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Determine headers
  let csvHeaders = headers;
  if (!csvHeaders && data.length > 0) {
    csvHeaders = Object.keys(data[0]);
  }

  // Create CSV content
  let csvContent = '';

  // Add headers
  if (csvHeaders) {
    csvContent += csvHeaders.map((h) => `"${h}"`).join(',') + '\n';
  }

  // Add data rows
  data.forEach((row) => {
    const values = csvHeaders
      ? csvHeaders.map((header) => {
          const value = row[header];
          // Handle null/undefined
          if (value === null || value === undefined) return '';
          // Handle objects/arrays
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          // Escape quotes and wrap in quotes
          return `"${String(value).replace(/"/g, '""')}"`;
        })
      : Object.values(row).map((v) => `"${String(v || '').replace(/"/g, '""')}"`);
    csvContent += values.join(',') + '\n';
  });

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `export-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Export report data to CSV
 */
export const exportReportToCSV = (reportData, reportType, dateRange) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${reportType}-report-${dateRange}-${timestamp}.csv`;
  
  let dataToExport = [];
  let headers = [];

  switch (reportType) {
    case 'sales':
      // Export revenue by date
      if (reportData.revenueByDate && reportData.revenueByDate.length > 0) {
        dataToExport = reportData.revenueByDate;
        headers = ['Date', 'Revenue', 'Receipts'];
      }
      break;
    case 'inventory':
      // Export low stock items
      if (reportData.lowStockItems && reportData.lowStockItems.length > 0) {
        dataToExport = reportData.lowStockItems;
        headers = ['Product Name', 'SKU', 'Quantity', 'Reorder Level'];
      }
      break;
    case 'orders':
      // Export orders by date
      if (reportData.ordersByDate && reportData.ordersByDate.length > 0) {
        dataToExport = reportData.ordersByDate;
        headers = ['Date', 'Orders', 'Revenue'];
      }
      break;
    case 'customers':
      // Export top customers
      if (reportData.topCustomers && reportData.topCustomers.length > 0) {
        dataToExport = reportData.topCustomers;
        headers = ['Customer Name', 'Email', 'Phone', 'Orders', 'Revenue', 'Last Order'];
      }
      break;
    case 'products':
      // Export best sellers
      if (reportData.bestSellers && reportData.bestSellers.length > 0) {
        dataToExport = reportData.bestSellers;
        headers = ['Product Name', 'SKU', 'Category', 'Quantity', 'Revenue'];
      }
      break;
    default:
      console.warn('Unknown report type:', reportType);
      return;
  }

  if (dataToExport.length === 0) {
    console.warn('No data to export for report type:', reportType);
    return;
  }

  // Map data to match headers
  const mappedData = dataToExport.map((row) => {
    const mapped = {};
    headers.forEach((header) => {
      // Map header names to data keys
      const keyMap = {
        'Date': 'date',
        'Revenue': 'revenue',
        'Receipts': 'count',
        'Product Name': 'productName',
        'SKU': 'sku',
        'Quantity': 'quantity',
        'Reorder Level': 'reorderLevel',
        'Orders': 'count',
        'Customer Name': 'customerName',
        'Email': 'email',
        'Phone': 'phone',
        'Last Order': 'lastOrderDate',
        'Category': 'category',
      };
      const key = keyMap[header] || header.toLowerCase().replace(/\s+/g, '');
      mapped[header] = row[key] || '';
    });
    return mapped;
  });

  exportToCSV(mappedData, filename, headers);
};

