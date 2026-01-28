// components/SEO.jsx
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function SEO({
  title,
  description,
  slug = '',
  image = '/img/Amazon.png',
  type = 'website', // "website" | "article" | "product"
  sku,
  price,
  currency = 'USD',
  inStock = true,
}) {
  const router = useRouter();
  const baseUrl = 'https://yourdomain.com';

  // ✅ Fallbacks
  const defaultTitle = 'Amazon Arbirtage – Fresh Cakes, Pastries & Bread';
  const defaultDescription =
    'Order fresh cakes, bread, and pastries from Amazon Arbirtage. Delicious, baked daily, and delivered to your door.';

  const seoTitle = title || defaultTitle;
  const seoDescription = (description || defaultDescription).slice(0, 155);

  // Auto-generate slug if not provided
  const autoSlug = slug || router.asPath.replace(/^\//, '');
  const url = autoSlug ? `${baseUrl}/${autoSlug}` : baseUrl;

  // Structured Data
  let jsonLd = null;
  if (type === 'product') {
    jsonLd = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: seoTitle,
      image: image,
      description: seoDescription,
      sku: sku || 'N/A',
      offers: {
        '@type': 'Offer',
        url: url,
        priceCurrency: currency,
        price: price || 0,
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    };
  } else if (type === 'article') {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: seoTitle,
      description: seoDescription,
      image: image,
      mainEntityOfPage: url,
      author: {
        '@type': 'Organization',
        name: 'Amazon Arbirtage',
      },
    };
  } else {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Amazon Arbirtage',
      url: baseUrl,
      description: seoDescription,
    };
  }

  return (
    <Head>
      {/* Basic SEO */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </Head>
  );
}
