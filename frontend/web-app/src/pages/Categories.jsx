import React, { useEffect, useState } from 'react';
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Category as CategoryIcon,
  Close,
} from '@mui/icons-material';
import categoryService from '../services/categoryService';
import { toast } from 'react-toastify';

function Categories() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null });
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, category: null });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryService.getAllCategories();
      setCategories(response.categories || response.data || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load categories:', error);
        toast.error('Failed to load categories');
      }
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.category) return;

    try {
      await categoryService.deleteCategory(deleteDialog.category.id);
      toast.success('Category deleted successfully');
      loadCategories();
      setDeleteDialog({ open: false, category: null });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete category');
    }
  };

  const handleAdd = () => {
    setFormData({ name: '', description: '', parent_id: '' });
    setAddDialog(true);
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name || '',
      description: category.description || '',
      parent_id: category.parent_id || '',
    });
    setEditDialog({ open: true, category });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        name: formData.name,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
      };
      await categoryService.createCategory(dataToSend);
      toast.success('Category added successfully');
      setAddDialog(false);
      loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add category');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editDialog.category) return;

    try {
      const dataToSend = {
        name: formData.name,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
      };
      await categoryService.updateCategory(editDialog.category.id, dataToSend);
      toast.success('Category updated successfully');
      setEditDialog({ open: false, category: null });
      loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update category');
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get top-level categories (no parent) for parent dropdown
  const topLevelCategories = categories.filter((cat) => !cat.parent_id);

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
            Categories
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Organize your products with categories and subcategories
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleAdd}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Category
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search categories by name or description..."
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

      {filteredCategories.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CategoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No categories found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first category'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Name</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Description</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>Parent Category</TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{category.name || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>{category.description || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>{category.parent?.name || 'N/A'}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleEdit(category)}
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, category })}
                      sx={{ padding: { xs: '4px', sm: '8px' } }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Category Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAddSubmit}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Add Category</span>
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
                  label="Category Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Parent Category (Optional)"
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">None</option>
                  {topLevelCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
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
              Add Category
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, category: null })} maxWidth="sm" fullWidth>
        <form onSubmit={handleEditSubmit}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Edit Category</span>
              {isSmallScreen && (
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={() => setEditDialog({ open: false, category: null })}
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
                  label="Category Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Parent Category (Optional)"
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">None</option>
                  {topLevelCategories
                    .filter((cat) => cat.id !== editDialog.category?.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setEditDialog({ open: false, category: null })}
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              size={isSmallScreen ? 'small' : 'medium'}
            >
              Update Category
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, category: null })}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Delete Category</span>
            {isSmallScreen && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => setDeleteDialog({ open: false, category: null })}
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
            Are you sure you want to delete "{deleteDialog.category?.name}"? This action cannot be undone.
            {deleteDialog.category?.parent && (
              <Box component="span" sx={{ display: 'block', mt: 1, color: 'warning.main' }}>
                Note: This category has a parent category.
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, category: null })}
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

export default Categories;

