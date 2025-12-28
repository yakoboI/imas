import { Helmet } from 'react-helmet-async';

const SEO = ({
  title = 'IMAS - Inventory Management',
  description = 'Manage inventory, products, orders, and warehouses. Track revenue, manage budgets, and optimize financial performance with real-time analytics.',
  keywords = 'imas, IMAS, IMS, ims, system, management, inventory, business ideas, enterprise inventory, inventory management, real-time analytics, multi-warehouse, inventory synchronization, business operations, stock management, warehouse management, inventory system, order management, business management software, finance software, financial management, budget software, money management, business finance, revenue tracking, financial reporting, expense tracking, cash flow management, business budgeting, financial analytics, accounting software, business intelligence, financial planning, cost management, profit tracking, sales revenue, payment processing, financial dashboard, business accounting, financial control, money tracking, budget planning, financial software for business, inventory finance, warehouse finance, business money management, cloud-based inventory, SaaS inventory, web-based inventory, online inventory system, multitenant software, multi-tenant platform, cloud inventory platform, real-time inventory, live inventory tracking, instant inventory updates, mobile inventory app, responsive inventory, PWA inventory, API integration, inventory API, business software integration, retail inventory management, ecommerce inventory, online store inventory, manufacturing inventory, production inventory, supply chain management, wholesale inventory, distributor inventory, B2B inventory, small business inventory, startup inventory, SMB inventory software, enterprise inventory solution, large business inventory, automated reordering, stock alerts, low stock notifications, barcode scanning, QR code inventory, product scanning, order fulfillment, order tracking, order management system, receipt generation, invoice management, sales receipts, audit trail, activity log, compliance tracking, role-based access, user permissions, security controls, cost savings calculator, ROI calculator, inventory optimization, supplier management, vendor management, purchase orders, customer management, CRM integration, sales tracking, track inventory, manage stock, control inventory, optimize inventory, reduce waste, minimize costs, automate inventory, streamline operations, monitor inventory, analyze sales, forecast demand, scale business, grow operations, expand inventory, best inventory management software for small business, free inventory management system with finance tracking, cloud-based inventory software with multi-warehouse support, inventory management with budget planning, real-time inventory tracking software, inventory system with financial reporting, multi-location inventory management, inventory software with revenue tracking, business inventory management with analytics, inventory management for retail stores',
  image = 'https://app.inventora.store/og-image.jpg',
  url = 'https://app.inventora.store',
  type = 'website',
  noindex = false,
}) => {
  // Keep titles concise - max 60 characters for browser tabs
  const fullTitle = title.includes('IMAS') ? title : `${title} | IMAS`;
  const fullUrl = url.startsWith('http') ? url : `https://app.inventora.store${url}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <>
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
          <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        </>
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="IMAS - Modern Enterprise Inventory Management System" />
      <meta property="og:site_name" content="IMAS" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'IMAS Inventory',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: description,
          url: fullUrl,
          featureList: [
            'Inventory Management',
            'Financial Reporting',
            'Revenue Tracking',
            'Budget Management',
            'Multi-Warehouse Support',
            'Real-time Analytics',
            'Payment Processing',
            'Cost Management',
            'Financial Dashboard',
            'Business Intelligence'
          ],
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Adventora',
            url: 'https://app.inventora.store',
          },
          about: {
            '@type': 'Thing',
            name: 'Business Finance Software',
            description: 'Financial management and budgeting software for businesses'
          },
          keywords: 'finance software, financial management, budget software, money management, business finance, revenue tracking, financial reporting, inventory management'
        })}
      </script>
      
      {/* Additional Structured Data for Financial Software */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'IMAS - Business Finance & Budget Software',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web',
          description: 'Financial management software for businesses with revenue tracking, budget planning, expense management, and financial reporting capabilities.',
          url: fullUrl,
          featureList: [
            'Revenue Tracking and Analytics',
            'Budget Planning and Management',
            'Financial Reporting',
            'Expense Tracking',
            'Cash Flow Management',
            'Payment Processing',
            'Financial Dashboard',
            'Cost Management',
            'Profit Analysis',
            'Business Financial Planning'
          ],
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock'
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Adventora',
            url: 'https://app.inventora.store',
          },
          category: 'Finance Software',
          keywords: 'finance software, budget software, money management, financial management, business finance, revenue tracking, financial reporting, expense tracking, cash flow, business budgeting'
        })}
      </script>
      
      {/* Organization Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Adventora',
          url: 'https://app.inventora.store',
          logo: 'https://app.inventora.store/logo.png',
          description: 'Provider of IMAS - Modern Enterprise Inventory Management System with financial tracking and multi-warehouse support',
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            availableLanguage: 'English'
          },
          sameAs: [
            'https://app.inventora.store'
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEO;

