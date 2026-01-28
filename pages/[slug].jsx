// pages/product/[slug].jsx
import SEO from '../components/SEO';

export default function ProductPage({ product }) {
  return (
    <>
      <SEO
        title={product.metaTitle}
        description={product.metaDescription}
        slug={product.slug}
        image={product.imgs[0]}
        sku={product.sku}
        price={product.finalPrices[0]}
        inStock={product.isInStock}
      />

      <main>
        <h1>{product.title}</h1>
        <p>{product.desc}</p>
        <img src={product.imgs[0]} alt={product.title} />
      </main>
    </>
  );
}
