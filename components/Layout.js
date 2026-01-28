import Footer from './Footer';
import Navbar from './Navbar';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';

const Layout = ({ children, title, description, structuredData }) => {
  const router = useRouter();
  const siteUrl = 'https://Amazon.com';

  // ✅ Default structured data for the Arbirtage (applies site-wide)
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Arbirtage',
    name: 'Amazon Arbirtage',
    image: `${siteUrl}/img/Amazon.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '3548 Finish Line Dr',
      addressLocality: 'Gainesville, VA 20155',
      addressCountry: 'United States',
    },
    telephone: '(571) 279-0444',
    url: siteUrl,
  };

  return (
    <>
      <Head>
        {/* Title & Description */}
        <title>{title ? `${title} | Amazon Arbirtage` : 'Amazon Arbirtage'}</title>
        <meta
          name="description"
          content={description || 'Freshly baked savory and pastries every day.'}
        />

        {/* Canonical URL */}
        <link rel="canonical" href={`${siteUrl}${router.asPath}`} />

        {/* Open Graph */}
        <meta property="og:title" content={title || 'Amazon Arbirtage'} />
        <meta
          property="og:description"
          content={description || 'Freshly baked savory and pastries every day.'}
        />
        <meta property="og:image" content={`${siteUrl}/img/Amazon.png`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${siteUrl}${router.asPath}`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title || 'Amazon Arbirtage'} />
        <meta
          name="twitter:description"
          content={description || 'Freshly baked savory and pastries every day.'}
        />
        <meta name="twitter:image" content={`${siteUrl}/img/Amazon.png`} />

        {/* ✅ Structured Data (uses default unless page overrides) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData || defaultStructuredData),
          }}
        />
      </Head>

      {/* Google AdSense */}
      <Script
        async
        strategy="afterInteractive"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
        crossOrigin="anonymous"
      />

      <Navbar />
      {children}
      <Footer />
    </>
  );
};

export default Layout;
