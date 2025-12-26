import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import { formatCurrency } from '../../utils/currency';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1.5, bgcolor: 'rgba(255, 255, 255, 0.95)', boxShadow: 3 }}>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{ color: entry.color }}
          >
            {entry.name}: {formatCurrency(entry.value || 0)}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

function RevenueChart({ data = [], currency = 'USD' }) {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No revenue data available
        </Typography>
      </Paper>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => {
    const dateStr = item.date;
    let formattedDate = dateStr;
    try {
      // Handle both date strings and Date objects
      const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (e) {
      // Keep original if parsing fails
      formattedDate = dateStr;
    }
    return {
      date: formattedDate,
      revenue: parseFloat(item.revenue || 0),
      receipts: parseInt(item.count || 0),
    };
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TrendingUp sx={{ color: 'primary.main' }} />
        <Typography variant="h6" fontWeight={600}>
          Revenue Trend
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            stroke="#666"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#666"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => formatCurrency(value, currency)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#1976d2"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}

export default RevenueChart;

