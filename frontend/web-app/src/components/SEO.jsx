import { Helmet } from 'react-helmet-async';

const SEO = ({
  title = 'IMAS - Inventory Management',
  description = 'Manage inventory, products, orders, and warehouses. Real-time analytics and reporting for your business.',
  keywords = 'inventory management, stock management, warehouse management, inventory system, order management, business management software',
  image = 'https://app.adventora.store/og-image.jpg',
  url = 'https://app.adventora.store',
  type = 'website',
  noindex = false,
}) => {
  // Keep titles concise - max 60 characters for browser tabs
  const fullTitle = title.includes('IMAS') ? title : `${title} | IMAS`;
  const fullUrl = url.startsWith('http') ? url : `https://app.adventora.store${url}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="IMAS" />
      
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
            url: 'https://app.adventora.store',
          },
        })}
      </script>
    </Helmet>
  );
};

export default SEO;

