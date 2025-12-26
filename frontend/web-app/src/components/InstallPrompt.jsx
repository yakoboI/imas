import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Slide,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  GetApp,
  Close,
  PhoneAndroid,
  Computer,
} from '@mui/icons-material';

function InstallPrompt() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if already installed via localStorage
    const installDismissed = localStorage.getItem('pwa-install-dismissed');
    const installTime = localStorage.getItem('pwa-install-dismissed-time');
    
    // Show prompt if not dismissed in last 7 days
    if (installDismissed && installTime) {
      const daysSinceDismissed = (Date.now() - parseInt(installTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-dismissed-time');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Slide direction="up" in={showPrompt} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 'auto' },
          maxWidth: { xs: 'calc(100% - 32px)', sm: 400 },
          p: { xs: 2, sm: 3 },
          zIndex: 1300,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {isMobile ? (
                <PhoneAndroid sx={{ fontSize: 24 }} />
              ) : (
                <Computer sx={{ fontSize: 24 }} />
              )}
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Install IMAS App
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Install our app for a better experience! Get quick access, offline support, and faster performance.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="contained"
                startIcon={<GetApp />}
                onClick={handleInstall}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
                size={isMobile ? 'small' : 'medium'}
                fullWidth={isMobile}
              >
                Install Now
              </Button>
              <Button
                variant="text"
                onClick={handleDismiss}
                sx={{
                  color: 'white',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
                size={isMobile ? 'small' : 'medium'}
                fullWidth={isMobile}
              >
                Maybe Later
              </Button>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={handleDismiss}
            sx={{
              color: 'white',
              alignSelf: 'flex-start',
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Slide>
  );
}

export default InstallPrompt;

