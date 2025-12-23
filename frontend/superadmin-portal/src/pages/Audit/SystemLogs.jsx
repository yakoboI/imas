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
} from '@mui/material';
import { Archive } from '@mui/icons-material';
import superAdminService from '../../services/superAdminService';
import { toast } from 'react-toastify';

function SystemLogs() {
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
    setArchiving(true);
    try {
      let archiveData;
      if (archiveType === 'daysOld') {
        archiveData = { daysOld };
      } else {
        // Convert datetime-local format to ISO string
        const date = new Date(beforeDate);
        archiveData = { beforeDate: date.toISOString() };
      }

      const result = await superAdminService.archiveSystemLogs(archiveData);
      
      toast.success(`Successfully archived ${result.archivedCount} logs`);
      setArchiveDialogOpen(false);
      setDaysOld(90);
      setBeforeDate('');
      setArchiveType('daysOld');
      
      // Reload logs after archiving
      await loadLogs();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to archive system logs';
      toast.error(errorMessage);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
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
              onChange={(e) => setDaysOld(parseInt(e.target.value) || 90)}
              helperText="Logs older than this many days will be archived"
              inputProps={{ min: 1 }}
            />
          ) : (
            <TextField
              fullWidth
              label="Before Date"
              type="datetime-local"
              value={beforeDate}
              onChange={(e) => setBeforeDate(e.target.value)}
              helperText="Logs before this date will be archived"
              InputLabelProps={{ shrink: true }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialogOpen(false)} disabled={archiving}>
            Cancel
          </Button>
          <Button 
            onClick={handleArchive} 
            variant="contained" 
            color="secondary"
            disabled={archiving || (archiveType === 'daysOld' && daysOld < 1) || (archiveType === 'beforeDate' && !beforeDate)}
          >
            {archiving ? 'Archiving...' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>

      <TableContainer component={Paper} sx={{ mt: 3, overflowX: 'auto', maxWidth: '100%' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>SuperAdmin</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Target Tenant</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{log.superadmin?.email || 'N/A'}</TableCell>
                <TableCell>
                  <Chip label={log.action} size="small" color="primary" />
                </TableCell>
                <TableCell>{log.targetTenant?.name || 'N/A'}</TableCell>
                <TableCell>{log.description || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default SystemLogs;

