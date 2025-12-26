import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import {
  Calculate,
  TrendingDown,
  Inventory2,
  Speed,
  CheckCircle,
} from '@mui/icons-material';
import dashboardService from '../services/dashboardService';
import { formatCurrency } from '../utils/currency';

function CostSavingsCalculator() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState({
    manualHoursPerWeek: 10,
    hourlyWage: 20,
    wasteReductionPercent: 5,
    efficiencyGainPercent: 15,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardService.getDashboardStats();
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSavings = () => {
    if (!stats) return null;

    const {
      manualHoursPerWeek,
      hourlyWage,
      wasteReductionPercent,
      efficiencyGainPercent,
    } = inputs;

    // Time savings from automation
    const hoursPerYear = manualHoursPerWeek * 52;
    const timeSavingsValue = hoursPerYear * hourlyWage * (efficiencyGainPercent / 100);

    // Waste reduction savings (based on inventory value)
    const totalInventoryValue = parseFloat(stats.totalRevenue) || 0;
    const wasteSavings = totalInventoryValue * (wasteReductionPercent / 100) * 0.1; // Assume 10% of revenue is inventory cost

    // Reduced errors and rework
    const errorReductionSavings = timeSavingsValue * 0.2; // 20% of time savings

    // Total annual savings
    const totalSavings = timeSavingsValue + wasteSavings + errorReductionSavings;

    // Monthly savings
    const monthlySavings = totalSavings / 12;

    return {
      timeSavings: timeSavingsValue,
      wasteSavings,
      errorReductionSavings,
      totalSavings,
      monthlySavings,
      hoursSaved: hoursPerYear * (efficiencyGainPercent / 100),
    };
  };

  const savings = calculateSavings();

  const handleInputChange = (field) => (e) => {
    setInputs({
      ...inputs,
      [field]: parseFloat(e.target.value) || 0,
    });
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Loading calculator...</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Calculate sx={{ color: 'primary.main' }} />
        Cost Savings Calculator
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Estimate potential cost savings from using IMAS inventory management system
      </Typography>

      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Your Business Metrics
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Manual Hours per Week"
                type="number"
                value={inputs.manualHoursPerWeek}
                onChange={handleInputChange('manualHoursPerWeek')}
                helperText="Hours spent on manual inventory tasks"
                inputProps={{ min: 0, step: 1 }}
              />
              <TextField
                fullWidth
                label="Average Hourly Wage ($)"
                type="number"
                value={inputs.hourlyWage}
                onChange={handleInputChange('hourlyWage')}
                helperText="Average cost per hour for inventory management"
                inputProps={{ min: 0, step: 0.5 }}
              />
              <TextField
                fullWidth
                label="Expected Waste Reduction (%)"
                type="number"
                value={inputs.wasteReductionPercent}
                onChange={handleInputChange('wasteReductionPercent')}
                helperText="Estimated reduction in inventory waste"
                inputProps={{ min: 0, max: 100, step: 1 }}
              />
              <TextField
                fullWidth
                label="Efficiency Gain (%)"
                type="number"
                value={inputs.efficiencyGainPercent}
                onChange={handleInputChange('efficiencyGainPercent')}
                helperText="Expected improvement in operational efficiency"
                inputProps={{ min: 0, max: 100, step: 1 }}
              />
            </Stack>
          </Paper>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={6}>
          {savings && (
            <Box>
              <Card sx={{ mb: 2, bgcolor: 'primary.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Annual Savings
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatCurrency(savings.totalSavings)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    {formatCurrency(savings.monthlySavings)} per month
                  </Typography>
                </CardContent>
              </Card>

              <Stack spacing={2}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Speed sx={{ color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Time Savings
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="primary.main">
                    {formatCurrency(savings.timeSavings)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(savings.hoursSaved)} hours saved annually
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Inventory2 sx={{ color: 'success.main' }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Waste Reduction
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(savings.wasteSavings)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reduced inventory waste and spoilage
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircle sx={{ color: 'info.main' }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Error Reduction
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="info.main">
                    {formatCurrency(savings.errorReductionSavings)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fewer errors and less rework
                  </Typography>
                </Paper>
              </Stack>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingDown sx={{ color: 'success.dark' }} />
                  <Typography variant="subtitle2" fontWeight={600} color="success.dark">
                    ROI Estimate
                  </Typography>
                </Box>
                <Typography variant="body2" color="success.dark">
                  Based on typical implementation costs, you could see a positive ROI within
                  {' '}
                  <strong>3-6 months</strong> of implementation.
                </Typography>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default CostSavingsCalculator;

