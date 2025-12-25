import React, { useState } from 'react';
import { Box, Typography, Container, Grid, Paper } from '@mui/material';
import DateTimeCard from '../components/DateTimeCard';

/**
 * Demo page showcasing the DateTimeCard component
 * with mathematical precision and Excel-like formatting
 */
function DateTimeCardDemo() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessionTime, setSessionTime] = useState('00:01:00');

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleTimeChange = (newTime) => {
    setSessionTime(newTime);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          DateTime Card Component
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          A mathematically precise, Excel-like card component for date/time selection
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Default Usage */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Default Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Basic usage with default props
            </Typography>
            <DateTimeCard />
          </Paper>
        </Grid>

        {/* Custom Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Custom Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              With custom company name, date, and time handlers
            </Typography>
            <DateTimeCard
              companyName="Acme Corporation"
              initialDate={new Date('2025-12-24')}
              sessionOpeningTime="09:30:00"
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
            />
          </Paper>
        </Grid>

        {/* Usage Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Component Features
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Mathematical Precision:</strong> All date/time calculations use precise formatting
                with validation (HH:MM:SS format for time, ISO date format for dates)
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Excel-like Layout:</strong> Grid-based structure with consistent spacing and alignment
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Multiple Date Formats:</strong> Displays full date (Wednesday, December 24, 2025),
                short date (12/24/2025), and day of week
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Time Validation:</strong> Validates time input using regex pattern for 24-hour format
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Responsive Design:</strong> Adapts to different screen sizes with Material-UI breakpoints
              </Typography>
              <Typography component="li" variant="body2">
                <strong>Monospace Fonts:</strong> Uses monospace fonts for numerical data to ensure
                consistent character width (Excel-like precision)
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DateTimeCardDemo;

