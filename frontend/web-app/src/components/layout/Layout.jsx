import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Drawer, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const drawerWidth = 260;

function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      {/* Top navigation - hidden when printing reports */}
      <Box
        sx={{
          '@media print': {
            display: 'none',
          },
        }}
      >
        <Navbar onMenuClick={handleDrawerToggle} />
      </Box>
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          '@media print': {
            display: 'none',
          },
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
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
          '@media print': {
            mt: 0,
            p: 2,
            backgroundColor: '#ffffff',
          },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;

