import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Business,
  People,
  History,
  Assessment,
  Settings,
  Security,
} from '@mui/icons-material';

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Tenants', icon: <Business />, path: '/tenants' },
  { text: 'Users', icon: <People />, path: '/users' },
  { text: 'Audit Logs', icon: <History />, path: '/audit-logs' },
  { text: 'System Logs', icon: <Security />, path: '/system-logs' },
  { text: 'Analytics', icon: <Assessment />, path: '/analytics' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

function Sidebar({ onItemClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (path) => {
    navigate(path);
    onItemClick();
  };

  return (
    <Box sx={{ pt: 2 }}>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path || 
                       (item.path === '/tenants' && location.pathname.startsWith('/tenants'))}
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
    </Box>
  );
}

export default Sidebar;

