import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import { Assessment } from '@mui/icons-material';
import { formatCurrency } from '../../utils/currency';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#0288d1'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <Paper sx={{ p: 1.5, bgcolor: 'rgba(255, 255, 255, 0.95)', boxShadow: 3 }}>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          {data.name}
        </Typography>
        <Typography variant="body2" sx={{ color: data.color }}>
          Count: {data.value}
        </Typography>
        {data.payload.revenue && (
          <Typography variant="body2" sx={{ color: data.color }}>
            Revenue: {formatCurrency(data.payload.revenue)}
          </Typography>
        )}
      </Paper>
    );
  }
  return null;
};

function StatusDistributionChart({ data = [], title = 'Status Distribution', currency = 'USD' }) {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Paper>
    );
  }

  // Format data for chart
  const chartData = data.map((item, index) => {
    // Handle different field names: status, method, payment_method
    let displayName = item.status || item.method || item.payment_method || 'Unknown';
    
    // Format payment method names for better display
    if (item.payment_method) {
      if (displayName === 'not_specified') {
        displayName = 'Not Specified';
      } else {
        displayName = displayName
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }
    
    return {
      name: displayName,
      value: parseInt(item.count || 0),
      revenue: parseFloat(item.revenue || 0),
      color: COLORS[index % COLORS.length],
    };
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Assessment sx={{ color: 'primary.main' }} />
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
}

export default StatusDistributionChart;

