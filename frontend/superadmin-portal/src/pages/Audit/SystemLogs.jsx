import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Archive } from '@mui/icons-material';
import superAdminService from '../../services/superAdminService';
import { toast } from 'react-toastify';

function SystemLogs() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveType, setArchiveType] = useState('daysOld');
  const [daysOld, setDaysOld] = useState(90);
  const [beforeDate, setBeforeDate] = useState('');
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await superAdminService.getSystemLogs();
      setLogs(response.logs || []);
    } catch (error) {
      toast.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    // Validate input before starting
    if (archiveType === 'beforeDate' && !beforeDate) {
      toast.error('Please select a date');
      return;
    }
    
    if (archiveType === 'daysOld' && (!daysOld || daysOld < 1)) {
      toast.error('Please enter a valid number of days (must be at least 1)');
      return;
    }

    setArchiving(true);
    try {
      let archiveData;
      if (archiveType === 'daysOld') {
        archiveData = { daysOld: parseInt(daysOld) };
      } else {
        // Convert datetime-local format to ISO string
        // datetime-local format: "YYYY-MM-DDTHH:mm" (local time, no timezone)
        // We need to treat it as local time and convert to ISO
        // Create date from datetime-local string (treats as local time)
        const localDate = new Date(beforeDate);
        
        // Validate the date
        if (isNaN(localDate.getTime())) {
          toast.error('Invalid date format');
          setArchiving(false);
          return;
        }
        
        // Convert to ISO string for the API
        archiveData = { beforeDate: localDate.toISOString() };
      }

      const result = await superAdminService.archiveSystemLogs(archiveData);
      
      // Handle response - may have archivedCount or message
      const archivedCount = result.archivedCount || 0;
      if (archivedCount > 0) {
        toast.success(`Successfully archived ${archivedCount} log${archivedCount !== 1 ? 's' : ''}`);
      } else {
        toast.info(result.message || 'No logs found to archive');
      }
      
      setArchiveDialogOpen(false);
      setDaysOld(90);
      setBeforeDate('');
      setArchiveType('daysOld');
      
      // Reload logs after archiving
      await loadLogs();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to archive system logs';
      toast.error(errorMessage);
      console.error('Archive error:', error);
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 2,
        gap: { xs: 2, sm: 0 }
      }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            System Logs
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            SuperAdmin actions and system events
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<Archive />}
          onClick={() => setArchiveDialogOpen(true)}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Archive Logs
        </Button>
      </Box>

      <Dialog open={archiveDialogOpen} onClose={() => setArchiveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Archive System Logs</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Archived logs will be moved to the archive table and removed from the main logs view.
          </Alert>
          
          <TextField
            select
            fullWidth
            label="Archive Criteria"
            value={archiveType}
            onChange={(e) => setArchiveType(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="daysOld">Archive logs older than X days</MenuItem>
            <MenuItem value="beforeDate">Archive logs before a specific date</MenuItem>
          </TextField>

          {archiveType === 'daysOld' ? (
            <TextField
              fullWidth
              label="Days Old"
              type="number"
              value={daysOld}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (!isNaN(value) && parseInt(value) >= 1)) {
                  setDaysOld(value === '' ? '' : parseInt(value));
                }
              }}
              helperText="Logs older than this many days will be archived"
              inputProps={{ min: 1 }}
              error={daysOld < 1}
            />
          ) : (
            <TextField
              fullWidth
              label="Before Date"
              type="datetime-local"
              value={beforeDate}
              onChange={(e) => setBeforeDate(e.target.value)}
              helperText="Logs before this date and time will be archived"
              InputLabelProps={{ shrink: true }}
              required
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setArchiveDialogOpen(false)} 
            disabled={archiving}
            size={isSmallScreen ? 'small' : 'medium'}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleArchive} 
            variant="contained" 
            color="secondary"
            disabled={archiving || (archiveType === 'daysOld' && daysOld < 1) || (archiveType === 'beforeDate' && !beforeDate)}
            size={isSmallScreen ? 'small' : 'medium'}
          >
            {archiving ? 'Archiving...' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>

      <TableContainer component={Paper} sx={{ mt: 3, overflowX: 'auto', maxWidth: '100%' }}>
        <Table sx={{ minWidth: { xs: 700, sm: 'auto' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Timestamp</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>SuperAdmin</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Action</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>Target Tenant</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No system logs found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>{log.superadmin?.email || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <Chip label={log.action} size="small" color="primary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>{log.targetTenant?.name || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{log.description || 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default SystemLogs;

