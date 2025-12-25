import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Drawer, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const drawerWidth = 280;

function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg')); // Changed from 'md' to 'lg' to include iPad
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      <Navbar onMenuClick={handleDrawerToggle} />
      <Box
        component="nav"
        sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              top: 64, // Start below the AppBar on all screen sizes
              height: 'calc(100% - 64px)', // Full height minus AppBar
            },
          }}
        >
          <Sidebar onItemClick={() => setMobileOpen(false)} />
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          mt: { xs: 7, sm: 8 }, // Margin-top to account for fixed AppBar
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 64px)', // Full height minus AppBar
          minWidth: 0, // Fix flexbox min-width issue - allows flex items to shrink below content size
          maxWidth: '100%', // Prevent overflow
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;

