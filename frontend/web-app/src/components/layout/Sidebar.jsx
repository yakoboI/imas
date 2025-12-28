import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from '@mui/material';
import {
  Dashboard,
  Person,
  Inventory,
  ShoppingCart,
  Receipt,
  Warehouse,
  People,
  LocalShipping,
  Assessment,
  Settings,
  History,
  Category,
  PointOfSale,
  PersonAdd,
  Link as LinkIcon,
} from '@mui/icons-material';

// Central definition of what each role can see in the sidebar
// (backend still enforces data-level permissions)
const menuItems = [
  // Everyone gets Dashboard
  { text: 'Dashboard', icon: <Dashboard />, path: '/app/dashboard' },

  // Sales-related
  {
    text: 'Sales',
    icon: <PointOfSale />,
    path: '/app/sales',
    roles: ['admin', 'sales_manager', 'sales_staff', 'accountant', 'viewer'],
  },
  {
    text: 'Orders',
    icon: <ShoppingCart />,
    path: '/app/orders',
    roles: ['admin', 'sales_manager', 'sales_staff', 'accountant'],
  },
  {
    text: 'Receipts',
    icon: <Receipt />,
    path: '/app/receipts',
    roles: ['admin', 'sales_manager', 'sales_staff', 'accountant'],
  },
  {
    text: 'Customers',
    icon: <PersonAdd />,
    path: '/app/customers',
    roles: ['admin', 'sales_manager', 'sales_staff', 'accountant', 'viewer'],
  },

  // Inventory-related
  {
    text: 'Products',
    icon: <Inventory />,
    path: '/app/products',
    roles: ['admin', 'inventory_manager', 'inventory_staff', 'viewer'],
  },
  {
    text: 'Categories',
    icon: <Category />,
    path: '/app/categories',
    roles: ['admin', 'inventory_manager', 'inventory_staff'],
  },
  {
    text: 'Inventory',
    icon: <Warehouse />,
    path: '/app/inventory',
    roles: ['admin', 'inventory_manager', 'inventory_staff'],
  },
  {
    text: 'Warehouses',
    icon: <Warehouse />,
    path: '/app/warehouses',
    roles: ['admin', 'inventory_manager', 'inventory_staff'],
  },
  {
    text: 'Suppliers',
    icon: <LocalShipping />,
    path: '/app/suppliers',
    roles: ['admin', 'inventory_manager', 'inventory_staff'],
  },

  // Reporting / audit
  {
    text: 'Reports',
    icon: <Assessment />,
    path: '/app/reports',
    roles: ['admin', 'sales_manager', 'inventory_manager', 'accountant', 'viewer'],
  },
  {
    text: 'Audit Logs',
    icon: <History />,
    path: '/app/audit-logs',
    roles: ['admin'],
  },

  // User management (admin only)
  {
    text: 'Users',
    icon: <People />,
    path: '/app/users',
    roles: ['admin'],
  },

  // Settings (admin + managers)
  {
    text: 'Settings',
    icon: <Settings />,
    path: '/app/settings',
    roles: ['admin', 'sales_manager', 'inventory_manager'],
  },
  {
    text: 'Integrations',
    icon: <LinkIcon />,
    path: '/app/integrations',
    roles: ['admin'],
  },
];

function Sidebar({ onItemClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const handleItemClick = (path) => {
    navigate(path);
    onItemClick();
  };

  const filteredMenuItems = menuItems.filter((item) => {
    // Items without a roles array are visible to everyone
    if (!item.roles || item.roles.length === 0) return true;
    // Hide if we don't know the user role yet
    if (!user?.role) return false;
    // Show only if the user's role is allowed for this item
    return item.roles.includes(user.role);
  });

  return (
    <Box sx={{ pt: 2 }}>
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleItemClick(item.path)}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleItemClick('/app/profile')}>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText primary="My Profile" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}

export default Sidebar;

