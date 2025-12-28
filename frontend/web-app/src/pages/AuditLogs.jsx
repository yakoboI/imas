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
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Button,
  useMediaQuery,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Search,
  History as HistoryIcon,
  GetApp,
  Visibility,
  FilterList,
} from '@mui/icons-material';
import auditService from '../services/auditService';
import { toast } from 'react-toastify';

function AuditLogs() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('client'); // 'client' or 'server'
  const [viewDialog, setViewDialog] = useState({ open: false, log: null, details: null });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [entityHistoryDialog, setEntityHistoryDialog] = useState({ open: false, entityType: '', entityId: '', history: [] });
  const [loadingEntityHistory, setLoadingEntityHistory] = useState(false);
  const [statsDialog, setStatsDialog] = useState({ open: false, stats: null });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    loadAuditLogs();
    // Don't load stats on mount - only load when user clicks Statistics button
    // loadAuditStats();
  }, []);

  const loadAuditStats = async () => {
    try {
      const response = await auditService.getAuditStats();
      setStatsDialog({ open: false, stats: response.stats || response.data || null });
    } catch (error) {
      console.error('Failed to load audit stats:', error);
      // Don't show error on initial load, only when user explicitly requests stats
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await auditService.getAuditLogs();
      setLogs(response.logs || response.data || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setLogs([]);
      // Only show error toast if it's not a connection refused error (backend might be down)
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
        toast.error('Failed to load audit logs. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await auditService.exportAuditLogs();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Audit logs exported successfully');
    } catch (error) {
      toast.error('Failed to export audit logs');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadAuditLogs();
      return;
    }

    if (searchMode === 'server') {
      setLoading(true);
      try {
        const response = await auditService.searchAuditLogs(searchTerm);
        setLogs(response.logs || []);
      } catch (error) {
        console.error('Failed to search audit logs:', error);
        toast.error('Failed to search audit logs');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDetails = async (log) => {
    setViewDialog({ open: true, log, details: null });
    setLoadingDetails(true);
    try {
      const response = await auditService.getAuditLogById(log.id);
      setViewDialog({ open: true, log, details: response.log || response.data });
    } catch (error) {
      console.error('Failed to load log details:', error);
      // Show basic info even if API fails
      setViewDialog({ open: true, log, details: log });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewEntityHistory = async (entityType, entityId) => {
    setEntityHistoryDialog({ open: true, entityType, entityId, history: [] });
    setLoadingEntityHistory(true);
    try {
      const response = await auditService.getEntityHistory(entityType, entityId);
      setEntityHistoryDialog({
        open: true,
        entityType,
        entityId,
        history: response.history || response.logs || response.data || []
      });
    } catch (error) {
      console.error('Failed to load entity history:', error);
      toast.error('Failed to load entity history');
      setEntityHistoryDialog({ open: false, entityType: '', entityId: '', history: [] });
    } finally {
      setLoadingEntityHistory(false);
    }
  };

  const handleViewStats = async () => {
    setStatsDialog({ open: true, stats: null });
    setLoadingStats(true);
    try {
      const response = await auditService.getAuditStats();
      setStatsDialog({ open: true, stats: response.stats || response.data || null });
    } catch (error) {
      console.error('Failed to load audit stats:', error);
      toast.error('Failed to load audit statistics');
      setStatsDialog({ open: false, stats: null });
    } finally {
      setLoadingStats(false);
    }
  };

  // Client-side filtering (fallback)
  const filteredLogs = searchMode === 'client' && searchTerm
    ? logs.filter((log) =>
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : logs;

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
        mb: 3,
        gap: { xs: 2, sm: 0 }
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Audit Logs
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Track system activities and user actions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button 
            variant="outlined" 
            startIcon={<FilterList />} 
            onClick={handleViewStats}
            size={isSmallScreen ? 'small' : 'medium'}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Statistics
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<GetApp />} 
            onClick={handleExport}
            size={isSmallScreen ? 'small' : 'medium'}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField
          fullWidth
          placeholder="Search audit logs by action, entity type, description, or user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && searchMode === 'server') {
              handleSearch();
            }
          }}
          size={isSmallScreen ? 'small' : 'medium'}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        {searchMode === 'server' && (
          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<Search />}
            size={isSmallScreen ? 'small' : 'medium'}
            sx={{ minWidth: { xs: '100%', sm: '120px' } }}
          >
            Search
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={() => setSearchMode(searchMode === 'client' ? 'server' : 'client')}
          startIcon={<FilterList />}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{ minWidth: { xs: '100%', sm: '140px' } }}
        >
          {searchMode === 'client' ? 'Server Search' : 'Client Filter'}
        </Button>
      </Box>

      {filteredLogs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No audit logs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'Audit logs will appear here as system activities occur'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Timestamp</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>User</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Action</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>Entity Type</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Description</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>IP Address</TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>{log.user?.email || log.user_email || 'System'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <Chip label={log.action || 'N/A'} size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>{log.entity_type || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{log.description || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>{log.ip_address || 'N/A'}</TableCell>
                  <TableCell align="right">
                    {log.entity_type && log.entity_id && (
                      <IconButton
                        size="small"
                        onClick={() => handleViewEntityHistory(log.entity_type, log.entity_id)}
                        title="View Entity History"
                        sx={{ mr: 0.5 }}
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(log)}
                      title="View Details"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Log Details Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={() => setViewDialog({ open: false, log: null, details: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Audit Log Details
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : viewDialog.details ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Timestamp</Typography>
                <Typography variant="body1">
                  {viewDialog.details.timestamp ? new Date(viewDialog.details.timestamp).toLocaleString() : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Action</Typography>
                <Chip label={viewDialog.details.action || 'N/A'} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">User</Typography>
                <Typography variant="body1">
                  {viewDialog.details.user?.email || viewDialog.details.user_email || 'System'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Entity Type</Typography>
                <Typography variant="body1">{viewDialog.details.entity_type || 'N/A'}</Typography>
              </Grid>
              {viewDialog.details.entity_id && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Entity ID</Typography>
                  <Typography variant="body1">{viewDialog.details.entity_id}</Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">IP Address</Typography>
                <Typography variant="body1">{viewDialog.details.ip_address || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{viewDialog.details.description || 'N/A'}</Typography>
              </Grid>
              {viewDialog.details.old_values && Object.keys(viewDialog.details.old_values).length > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Old Values</Typography>
                  <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(viewDialog.details.old_values, null, 2)}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              {viewDialog.details.new_values && Object.keys(viewDialog.details.new_values).length > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">New Values</Typography>
                  <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(viewDialog.details.new_values, null, 2)}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          ) : (
            <Typography>No details available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog({ open: false, log: null, details: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Entity History Dialog */}
      <Dialog
        open={entityHistoryDialog.open}
        onClose={() => setEntityHistoryDialog({ open: false, entityType: '', entityId: '', history: [] })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Entity History - {entityHistoryDialog.entityType} #{entityHistoryDialog.entityId}
        </DialogTitle>
        <DialogContent>
          {loadingEntityHistory ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : entityHistoryDialog.history.length === 0 ? (
            <Typography color="text.secondary">No history available for this entity</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entityHistoryDialog.history.map((entry, index) => (
                    <TableRow key={entry.id || index}>
                      <TableCell>
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip label={entry.action || 'N/A'} size="small" />
                      </TableCell>
                      <TableCell>{entry.user?.email || entry.user_email || 'System'}</TableCell>
                      <TableCell>{entry.description || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntityHistoryDialog({ open: false, entityType: '', entityId: '', history: [] })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Audit Statistics Dialog */}
      <Dialog
        open={statsDialog.open}
        onClose={() => setStatsDialog({ open: false, stats: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Audit Statistics</DialogTitle>
        <DialogContent>
          {loadingStats ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : statsDialog.stats ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{statsDialog.stats.totalLogs || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Logs</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{statsDialog.stats.totalUsers || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Users</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{statsDialog.stats.totalActions || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Actions</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{statsDialog.stats.totalEntityTypes || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Entity Types</Typography>
                </Paper>
              </Grid>
              {statsDialog.stats.actionsByType && Object.keys(statsDialog.stats.actionsByType).length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Actions by Type</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Action Type</TableCell>
                          <TableCell align="right">Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(statsDialog.stats.actionsByType).map(([action, count]) => (
                          <TableRow key={action}>
                            <TableCell>{action}</TableCell>
                            <TableCell align="right">{count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
              {statsDialog.stats.entityTypesCount && Object.keys(statsDialog.stats.entityTypesCount).length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Entity Types Distribution</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Entity Type</TableCell>
                          <TableCell align="right">Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(statsDialog.stats.entityTypesCount).map(([type, count]) => (
                          <TableRow key={type}>
                            <TableCell>{type}</TableCell>
                            <TableCell align="right">{count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          ) : (
            <Typography color="text.secondary">No statistics available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialog({ open: false, stats: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AuditLogs;
