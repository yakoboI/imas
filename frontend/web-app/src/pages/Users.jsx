import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Grid,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  People as PeopleIcon,
  Close,
} from '@mui/icons-material';
import userManagementService from '../services/userManagementService';
import { toast } from 'react-toastify';

function Users() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [userLimit, setUserLimit] = useState({ current: 0, max: 5, remaining: 5, canAddMore: true });
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loadingTenantInfo, setLoadingTenantInfo] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
  });
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    role: 'viewer',
    status: 'active',
    employee_id: '',
    department: '',
    position: '',
    employment_date: '',
    reports_to: '',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
      loadTenantInfo();
    }
  }, [user]);

  const loadTenantInfo = async () => {
    setLoadingTenantInfo(true);
    try {
      const response = await userManagementService.getTenantInfo();
      setTenantInfo(response);
      // Also update userLimit from tenant info if available
      if (response.userLimit) {
        setUserLimit(response.userLimit);
      }
    } catch (error) {
      console.error('Failed to load tenant info:', error);
    } finally {
      setLoadingTenantInfo(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userManagementService.getAllUsers();
      setUsers(response.users || response.data || []);
      
      // Update user limit info
      if (response.userLimit) {
        setUserLimit(response.userLimit);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.user) return;

    try {
      await userManagementService.deleteUser(deleteDialog.user.id);
      toast.success('User deleted successfully');
      loadUsers();
      setDeleteDialog({ open: false, user: null });
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleAdd = () => {
    setFormData({ email: '', password: '', first_name: '', last_name: '', role: 'viewer' });
    setAddDialog(true);
  };

  const handleEdit = async (userToEdit) => {
    try {
      // Fetch full user data including employment fields
      const userData = await userManagementService.getUserById(userToEdit.id);
      const user = userData.user || userData;
      
      setEditFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        role: user.role || 'viewer',
        status: user.status || 'active',
        employee_id: user.employee_id || '',
        department: user.department || '',
        position: user.position || '',
        employment_date: user.employment_date ? new Date(user.employment_date).toISOString().split('T')[0] : '',
        reports_to: user.reports_to || '',
      });
      setEditDialog({ open: true, user: userToEdit });
    } catch (error) {
      toast.error('Failed to load user data');
      console.error('Error loading user:', error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editDialog.user) return;
    
    try {
      await userManagementService.updateUser(editDialog.user.id, editFormData);
      toast.success('User updated successfully');
      setEditDialog({ open: false, user: null });
      loadUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update user';
      toast.error(errorMessage);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    // Check user limit before submitting
    if (!userLimit.canAddMore) {
      toast.error(`User limit reached. Maximum ${userLimit.max} users allowed for your plan.`);
      return;
    }
    
    try {
      const response = await userManagementService.createUser(formData);
      toast.success('User added successfully');
      setAddDialog(false);
      setFormData({ email: '', password: '', first_name: '', last_name: '', role: 'viewer' });
      
      // Update user limit from response if available
      if (response.userLimit) {
        setUserLimit(response.userLimit);
      }
      
      loadUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to add user';
      toast.error(errorMessage);
      
      // Update user limit if provided in error response
      if (error.response?.data?.userLimit) {
        setUserLimit(error.response.data.userLimit);
      }
    }
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />;
  }

  const filteredUsers = users.filter((u) =>
    `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {userLimit.current} of {userLimit.max} users ({userLimit.remaining} remaining)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user accounts and permissions
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleAdd}
          disabled={!userLimit.canAddMore}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add User
        </Button>
      </Box>
      
      {!userLimit.canAddMore && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have reached the maximum number of users ({userLimit.max}) allowed for your plan. 
          Please contact your administrator to upgrade your plan or increase the user limit.
        </Alert>
      )}

      {/* Tenant Information Section */}
      {tenantInfo && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Tenant Name
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {tenantInfo.tenant?.name || tenantInfo.tenantName || tenantInfo.name || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Users
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {tenantInfo.userCount || tenantInfo.userLimit?.current || tenantInfo.totalUsers || 0} / {tenantInfo.maxUsers === 999999 || tenantInfo.tenant?.maxUsers === 999999 ? 'Unlimited' : tenantInfo.maxUsers || tenantInfo.tenant?.maxUsers || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Plan Type
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {tenantInfo.tenant?.planType || tenantInfo.planType || tenantInfo.plan || 'Standard'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Status
              </Typography>
              <Chip 
                label={tenantInfo.tenant?.status || tenantInfo.status || 'active'} 
                size="small" 
                color={(tenantInfo.tenant?.status || tenantInfo.status || 'active') === 'active' ? 'success' : 'default'}
                sx={{ bgcolor: 'white', color: 'primary.main' }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      <TextField
        fullWidth
        placeholder="Search users by name, email, or role..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {filteredUsers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No users found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first user'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Name</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Role</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>Last Login</TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{`${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>{u.email || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <Chip label={u.role || 'user'} size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <Chip
                      label={u.status || 'active'}
                      size="small"
                      color={u.status === 'active' ? 'success' : 'default'}
                      sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleEdit(u)}
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    {u.id !== user?.id && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteDialog({ open: true, user: u })}
                        sx={{ padding: { xs: '4px', sm: '8px' } }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={addDialog}
        onClose={() => setAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleAddSubmit}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Add User</span>
              {isSmallScreen && (
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={() => setAddDialog(false)}
                  aria-label="close"
                  size="small"
                >
                  <Close />
                </IconButton>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="inventory_staff">Inventory Staff</option>
                  <option value="sales_staff">Sales Staff</option>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="sales_manager">Sales Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="admin">Admin</option>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setAddDialog(false)}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Add User
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleEditSubmit}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Edit User</span>
              {isSmallScreen && (
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={() => setEditDialog({ open: false, user: null })}
                  aria-label="close"
                  size="small"
                >
                  <Close />
                </IconButton>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Role"
                  name="role"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="inventory_staff">Inventory Staff</option>
                  <option value="sales_staff">Sales Staff</option>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="sales_manager">Sales Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="admin">Admin</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  name="employee_id"
                  value={editFormData.employee_id}
                  onChange={(e) => setEditFormData({ ...editFormData, employee_id: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Position"
                  name="position"
                  value={editFormData.position}
                  onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employment Date"
                  name="employment_date"
                  type="date"
                  value={editFormData.employment_date}
                  onChange={(e) => setEditFormData({ ...editFormData, employment_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reports To (User ID)"
                  name="reports_to"
                  value={editFormData.reports_to}
                  onChange={(e) => setEditFormData({ ...editFormData, reports_to: e.target.value })}
                  helperText="Enter the user ID of the manager this user reports to"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setEditDialog({ open: false, user: null })}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Update User
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Delete User</span>
            {isSmallScreen && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => setDeleteDialog({ open: false, user: null })}
                aria-label="close"
                size="small"
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, user: null })}
            size={isSmallScreen ? 'small' : 'medium'}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            size={isSmallScreen ? 'small' : 'medium'}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Users;
