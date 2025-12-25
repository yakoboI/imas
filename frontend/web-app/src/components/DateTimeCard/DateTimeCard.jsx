import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material';
import { format, parse, isValid } from 'date-fns';
import tenantSettingsService from '../../services/tenantSettingsService';

/**
 * DateTimeCard Component
 * 
 * A mathematically precise, Excel-like card component for displaying
 * and selecting date/time information with consistent formatting patterns.
 * 
 * Features:
 * - Precise date formatting (full date, short date, day of week)
 * - Mathematical time precision (HH:MM:SS format)
 * - Excel-like grid layout with consistent spacing
 * - Date picker with validation
 */
function DateTimeCard({ 
  companyName: propCompanyName,
  initialDate = new Date(),
  sessionOpeningTime = '00:01:00',
  onDateChange,
  onTimeChange,
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [timeValue, setTimeValue] = useState(sessionOpeningTime);
  const [companyName, setCompanyName] = useState(propCompanyName || 'Company');
  const [loadingCompany, setLoadingCompany] = useState(!propCompanyName);

  // Mathematical date calculations and formatting
  const formatFullDate = (date) => {
    if (!isValid(date)) return '';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const formatShortDate = (date) => {
    if (!isValid(date)) return '';
    return format(date, 'MM/dd/yyyy');
  };

  const formatDayOfWeek = (date) => {
    if (!isValid(date)) return '';
    return format(date, 'EEEE');
  };

  // Validate and parse time (HH:MM:SS format)
  const validateTime = (timeString) => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
    return timeRegex.test(timeString);
  };

  const handleDateChange = (event) => {
    const newDate = parse(event.target.value, 'yyyy-MM-dd', new Date());
    if (isValid(newDate)) {
      setSelectedDate(newDate);
      if (onDateChange) {
        onDateChange(newDate);
      }
    }
  };

  const handleTimeChange = (event) => {
    let newTime = event.target.value.replace(/[^0-9:]/g, ''); // Remove non-numeric and non-colon characters
    
    // Auto-format as user types (mathematical pattern: HH:MM:SS)
    if (newTime.length <= 8) {
      // Remove existing colons for processing
      const digits = newTime.replace(/:/g, '');
      
      // Add colons at appropriate positions (mathematical pattern)
      let formatted = '';
      for (let i = 0; i < digits.length; i++) {
        if (i === 2 || i === 4) {
          formatted += ':';
        }
        formatted += digits[i];
      }
      
      // Limit to HH:MM:SS format (8 characters max)
      if (formatted.length <= 8) {
        setTimeValue(formatted);
        if (validateTime(formatted) && onTimeChange) {
          onTimeChange(formatted);
        }
      }
    }
  };

  // Fetch company name from server
  useEffect(() => {
    const fetchCompanyName = async () => {
      if (propCompanyName) {
        // If company name is provided as prop, use it
        setCompanyName(propCompanyName);
        return;
      }

      try {
        setLoadingCompany(true);
        const response = await tenantSettingsService.getSettings();
        if (response?.company?.name) {
          setCompanyName(response.company.name);
        } else if (response?.company?.name === '') {
          // If company name is empty string, keep default
          setCompanyName('Company');
        }
      } catch (error) {
        console.error('Failed to fetch company name:', error);
        // Keep default company name on error
        setCompanyName('Company');
      } finally {
        setLoadingCompany(false);
      }
    };

    fetchCompanyName();
  }, [propCompanyName]);

  // Mathematical calculations for display
  const getDateInputValue = () => {
    if (!isValid(selectedDate)) return '';
    return format(selectedDate, 'yyyy-MM-dd');
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        minWidth: { xs: '100%', sm: 400 },
        maxWidth: 600,
      }}
    >
      {/* Header Section - Company Name */}
      <Box
        sx={{
          mb: 2.5,
          pb: 1.5,
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 40,
        }}
      >
        {loadingCompany ? (
          <CircularProgress size={24} />
        ) : (
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              color: 'text.primary',
              letterSpacing: '0.02em',
              textAlign: 'center',
            }}
          >
            {companyName}
          </Typography>
        )}
      </Box>

      {/* Date Information Grid - Excel-like structure */}
      <Grid container spacing={2.5}>
        {/* Full Date Display */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Date
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', sm: '1.125rem' },
                fontWeight: 500,
                color: 'text.primary',
                fontFamily: 'monospace',
              }}
            >
              {formatFullDate(selectedDate)}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        {/* Session Opening Time */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Session Opening Time
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', sm: '1.125rem' },
                fontWeight: 500,
                color: 'text.primary',
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
              }}
            >
              {timeValue}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        {/* Date Picker Section */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 0.5,
              }}
            >
              Select Date
            </Typography>
            <TextField
              type="date"
              value={getDateInputValue()}
              onChange={handleDateChange}
              fullWidth
              variant="outlined"
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                style: {
                  fontFamily: 'monospace',
                  fontSize: '0.9375rem',
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            {/* Display formatted date below picker */}
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                mt: 0.5,
                fontStyle: 'italic',
              }}
            >
              Selected: {formatShortDate(selectedDate)}
            </Typography>
          </Box>
        </Grid>

        {/* Time Input Section */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 0.5,
              }}
            >
              Session Opening Time (HH:MM:SS)
            </Typography>
            <TextField
              type="text"
              value={timeValue}
              onChange={handleTimeChange}
              placeholder="00:01:00"
              fullWidth
              variant="outlined"
              size="small"
              inputProps={{
                maxLength: 8,
                pattern: '^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$',
                style: {
                  fontFamily: 'monospace',
                  fontSize: '0.9375rem',
                  letterSpacing: '0.1em',
                },
              }}
              helperText="Format: HH:MM:SS (24-hour format)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Footer with mathematical precision info */}
      <Box
        sx={{
          mt: 2.5,
          pt: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
          }}
        >
          Day of Week: {formatDayOfWeek(selectedDate)} | 
          Date Format: {formatShortDate(selectedDate)} | 
          Time: {timeValue}
        </Typography>
      </Box>
    </Paper>
  );
}

export default DateTimeCard;

