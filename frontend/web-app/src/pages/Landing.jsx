import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
} from '@mui/material';
import {
  Inventory2,
  Analytics,
  ShoppingCart,
  Warehouse,
  Security,
  Speed,
  Cloud,
  TrendingUp,
  CheckCircle,
  ArrowForward,
} from '@mui/icons-material';
import SEO from '../components/SEO';

const features = [
  {
    icon: <Inventory2 />,
    title: 'Smart Inventory',
    description: 'Intelligent tracking with real-time stock alerts and reorder level notifications.',
    color: '#667eea',
  },
  {
    icon: <Analytics />,
    title: 'Advanced Analytics',
    description: 'Comprehensive insights with detailed reports, sales analytics, and custom dashboards.',
    color: '#764ba2',
  },
  {
    icon: <ShoppingCart />,
    title: 'Order Automation',
    description: 'Streamlined order processing from creation to fulfillment.',
    color: '#f093fb',
  },
  {
    icon: <Warehouse />,
    title: 'Multi-Location',
    description: 'Seamless multi-warehouse management with location-based tracking.',
    color: '#4facfe',
  },
  {
    icon: <Security />,
    title: 'Enterprise Security',
    description: 'Enterprise-grade security with role-based access control and comprehensive audit trails.',
    color: '#43e97b',
  },
  {
    icon: <Speed />,
    title: 'Lightning Fast',
    description: 'Optimized performance with offline mode and efficient synchronization.',
    color: '#fa709a',
  },
];

const benefits = [
  'Reduce inventory costs and waste',
  'High availability and reliability',
  'Efficient data synchronization',
  'Scalable architecture',
  'Mobile-first design',
  '24/7 cloud access',
];

function Landing() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Don't check isAuthenticated - always show landing page
  // const { isAuthenticated } = useSelector((state) => state.auth);

  // Landing page should ALWAYS show - no redirects, no checks, no API calls
  useEffect(() => {
    const currentPath = window.location.pathname;
    console.log('[Landing] ✅ Component mounted - will always display');
    console.log('[Landing] Current path:', currentPath);
    
    // CRITICAL: If we're not on root, something redirected us
    if (currentPath !== '/') {
      console.error('[Landing] ❌ ERROR: Not on root path! Something redirected us to:', currentPath);
      // Force navigation back to root
      if (currentPath !== window.location.pathname) {
        window.history.replaceState(null, '', '/');
      }
    } else {
      console.log('[Landing] ✅ On correct root path');
    }
  }, []);

  console.log('[Landing] ✅ Component rendering - Landing page content should appear');

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', position: 'relative', bgcolor: '#fafbfc' }}>
      <SEO
        title="Modern Enterprise Inventory - IMAS"
        description="Scale operations with real-time analytics and multi-warehouse synchronization. Track revenue, manage budgets, and optimize financial performance with comprehensive business finance software."
        keywords="imas, IMAS, IMS, ims, system, management, inventory, business ideas, enterprise inventory, inventory management, real-time analytics, multi-warehouse, inventory synchronization, business operations, stock management, warehouse management, inventory system, order management, business management software, finance software, financial management, budget software, money management, business finance, revenue tracking, financial reporting, expense tracking, cash flow management, business budgeting, financial analytics, accounting software, business intelligence, financial planning, cost management, profit tracking, sales revenue, payment processing, financial dashboard, business accounting, financial control, money tracking, budget planning, financial software for business, inventory finance, warehouse finance, business money management, cloud-based inventory, SaaS inventory, web-based inventory, online inventory system, multitenant software, multi-tenant platform, cloud inventory platform, real-time inventory, live inventory tracking, instant inventory updates, mobile inventory app, responsive inventory, PWA inventory, API integration, inventory API, business software integration, retail inventory management, ecommerce inventory, online store inventory, manufacturing inventory, production inventory, supply chain management, wholesale inventory, distributor inventory, B2B inventory, small business inventory, startup inventory, SMB inventory software, enterprise inventory solution, large business inventory, automated reordering, stock alerts, low stock notifications, barcode scanning, QR code inventory, product scanning, order fulfillment, order tracking, order management system, receipt generation, invoice management, sales receipts, audit trail, activity log, compliance tracking, role-based access, user permissions, security controls, cost savings calculator, ROI calculator, inventory optimization, supplier management, vendor management, purchase orders, customer management, CRM integration, sales tracking, track inventory, manage stock, control inventory, optimize inventory, reduce waste, minimize costs, automate inventory, streamline operations, monitor inventory, analyze sales, forecast demand, scale business, grow operations, expand inventory, best inventory management software for small business, free inventory management system with finance tracking, cloud-based inventory software with multi-warehouse support, inventory management with budget planning, real-time inventory tracking software, inventory system with financial reporting, multi-location inventory management, inventory software with revenue tracking, business inventory management with analytics, inventory management for retail stores"
      />

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          color: 'white',
          py: { xs: 6, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', maxWidth: '800px', mx: 'auto' }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              Modern Enterprise Inventory
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', md: '1.125rem' },
                mb: 4,
                opacity: 0.9,
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              Scale operations with real-time analytics and multi-warehouse synchronization.
            </Typography>
            <Stack
              direction="row"
              spacing={{ xs: 1.5, sm: 2 }}
              justifyContent="center"
              sx={{ mb: 4, flexWrap: 'wrap' }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                endIcon={<ArrowForward />}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: { xs: 2.5, sm: 3, md: 4 },
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Start Free Trial
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  borderWidth: 2,
                  color: 'white',
                  px: { xs: 2.5, sm: 3, md: 4 },
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  fontWeight: 600,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Sign In
              </Button>
            </Stack>
            <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', mt: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: "'Courier New', monospace" }}>
                  Multi-Tenant
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: "'Courier New', monospace" }}>
                  Optimized
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: "'Courier New', monospace" }}>
                  Cloud-Native
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 1.5,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Powerful Features
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: '600px', mx: 'auto', fontSize: '1.1rem' }}
          >
            Everything you need to streamline operations and scale your business
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {features.map((feature, index) => (
            <Grid item xs={4} sm={4} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${feature.color} 0%, ${feature.color}dd 100%)`,
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.3s ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                    borderColor: feature.color,
                    '&::before': {
                      transform: 'scaleX(1)',
                    },
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: { xs: 40, sm: 48, md: 56 },
                      height: { xs: 40, sm: 48, md: 56 },
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}25 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: { xs: 1, sm: 1.5, md: 2 },
                      color: feature.color,
                      transition: 'transform 0.3s ease',
                      mx: 'auto',
                      '& svg': {
                        fontSize: { xs: 20, sm: 24, md: 28 },
                      },
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: { xs: 0.5, sm: 0.75, md: 1 },
                      fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      letterSpacing: '0.02em',
                      textAlign: 'center',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ 
                      lineHeight: 1.7, 
                      fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.95rem' },
                      textAlign: 'center',
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      fontWeight: 400,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box
        sx={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
          py: { xs: 6, md: 8 },
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip
                label="Why IMAS?"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  mb: 3,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  fontFamily: '"Lucida Handwriting", cursive',
                }}
              >
                Built for Modern Businesses
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ 
                  mb: 4, 
                  fontSize: '1.1rem', 
                  lineHeight: 1.8,
                  fontFamily: '"Lucida Handwriting", cursive',
                }}
              >
                Experience enterprise-grade inventory management with comprehensive features,
                designed to help you scale efficiently and make informed decisions with real-time data.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {benefits.map((benefit, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <CheckCircle
                      sx={{
                        color: 'primary.main',
                        fontSize: 28,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="body1"
                      sx={{ 
                        fontSize: '1.05rem', 
                        fontWeight: 500,
                        fontFamily: '"Lucida Handwriting", cursive',
                      }}
                    >
                      {benefit}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(102,126,234,0.1) 0%, transparent 70%)',
                  },
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 3,
                    position: 'relative',
                    zIndex: 1,
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                  }}
                >
                  Trusted by Businesses
                </Typography>
                <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ position: 'relative', zIndex: 1 }}>
                  {[
                    { label: 'Startups', desc: 'Launch faster with instant setup' },
                    { label: 'SMBs', desc: 'Scale without complexity' },
                    { label: 'Enterprises', desc: 'Multi-warehouse at scale' },
                    { label: 'Retailers', desc: 'Real-time inventory control' },
                  ].map((item, idx) => (
                    <Grid item xs={6} sm={6} md={12} key={idx}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: { xs: 1, sm: 1.5, md: 2 },
                          p: { xs: 1.5, sm: 1.75, md: 2 },
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.6)',
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.2s ease',
                          height: '100%',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.8)',
                            transform: { xs: 'translateY(-2px)', md: 'translateX(4px)' },
                          },
                        }}
                      >
                        <TrendingUp sx={{ color: 'primary.main', mt: 0.5, fontSize: { xs: 18, sm: 20, md: 24 } }} />
                        <Box>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 600, 
                              mb: 0.5,
                              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' }
                            }}
                          >
                            {item.label}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' } }}
                          >
                            {item.desc}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          color: 'white',
          py: { xs: 6, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
            }}
          >
            Ready to Transform Your Business?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              opacity: 0.95,
              fontWeight: 300,
              fontSize: { xs: '1rem', md: '1.25rem' },
            }}
          >
            Join forward-thinking businesses using IMAS to streamline operations
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            endIcon={<ArrowForward />}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 6,
              py: 1.75,
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#f5f5f5',
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Get Started Free
          </Button>
          <Typography
            variant="body2"
            sx={{
              mt: 3,
              opacity: 0.8,
              fontSize: '0.9rem',
            }}
          >
            No credit card required • Free plan available • Upgrade anytime
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default Landing;

