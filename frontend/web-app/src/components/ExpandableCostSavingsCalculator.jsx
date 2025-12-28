import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Calculate,
  Close,
} from '@mui/icons-material';
import CostSavingsCalculator from './CostSavingsCalculator';

function ExpandableCostSavingsCalculator() {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Box>
      {!expanded ? (
        <Paper
          elevation={2}
          onClick={handleToggle}
          sx={{
            p: 2,
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calculate sx={{ color: 'primary.main', fontSize: { xs: 24, sm: 28 } }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Cost Savings Calculator
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Click to expand
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calculate sx={{ color: 'primary.main' }} />
              <Typography variant="h6">
                Cost Savings Calculator
              </Typography>
            </Box>
            <IconButton
              onClick={handleToggle}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>
          <CostSavingsCalculator />
        </Paper>
      )}
    </Box>
  );
}

export default ExpandableCostSavingsCalculator;

