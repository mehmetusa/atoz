// pages/index.jsx
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { addProduct } from '../redux/cartSlice';
import dbConnect from '../utils/mongo';
import styles from '../styles/Home.module.css';

export default function Home({ products }) {
  const dispatch = useDispatch();

  const handleAddToCart = (product) => {
    const item = {
      ...product,
      size: 0,
      quantity: 1,
      price: Array.isArray(product.prices) ? product.prices[0] : product.price || 0,
      extras: [],
    };
    dispatch(addProduct(item));
  };

  const newProduct = Array.isArray(products)
    ? products
        .filter((p) => p.isNew && p.isLive)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null
    : null;

  const hotItems = Array.isArray(products) ? products.filter((p) => p.isHot).slice(0, 3) : [];

  return (
    <div className={styles.container}>
      {/* Top Banner */}
      <section className={styles.topBanner}>
        <Image
          src="/img/arbitrage1.avif"
          layout="fill"
          objectFit="cover"
          alt="Banner"
          priority
          className={styles.bannerImage}
        />
        <div className={styles.textWrapper}>
          <h1>
            WE ARE THE ONLY PLACE TO FIND
            <br /> THE BEST PRODUCTS, 
          </h1>
          <p>Amazon Arbitrage</p>
        </div>
      </section>

      {/* New Product Highlight */}
      {newProduct && (
        <section className={styles.newProduct}>
          <h2>New Product Highlight</h2>
          <div className={styles.productCard}>
            <Link href={`/product/${newProduct._id}`}>
              <div className={styles.productImage}>
                <Image
                  src={newProduct.imgs?.[0] || '/img/placeholder.png'}
                  layout="fill"
                  objectFit="cover"
                  alt={newProduct.title}
                />
              </div>
            </Link>
            <div className={styles.productInfo}>
              <h3>{newProduct.title}</h3>
              <p>
                $
                {(Array.isArray(newProduct.prices)
                  ? newProduct.prices[0]
                  : newProduct.price || 0
                ).toFixed(2)}
              </p>
              <button className={styles.addToCartBtn} onClick={() => handleAddToCart(newProduct)}>
                Add to Cart
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Hot Items */}
      {hotItems.length > 0 && (
        <section className={styles.hotItems}>
          <h2>Hot Items</h2>
          <div className={styles.hotGrid}>
            {hotItems.map((item) => (
              <div key={item._id} className={styles.productCard}>
                <Link href={`/product/${item._id}`}>
                  <div className={styles.productImage}>
                    <Image
                      src={item.imgs?.[0] || '/img/placeholder.png'}
                      layout="fill"
                      objectFit="cover"
                      alt={item.title}
                    />
                  </div>
                </Link>
                <div className={styles.productInfo}>
                  <h3>{item.title}</h3>
                  <p>
                    ${(Array.isArray(item.prices) ? item.prices[0] : item.price || 0).toFixed(2)}
                  </p>
                  <button className={styles.addToCartBtn} onClick={() => handleAddToCart(item)}>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

// Fetch products server-side
export async function getServerSideProps() {
  try {
    await dbConnect();
    const products = await Product.find({}).lean();

    // Serialize dates to pass to React
    const serializedProducts = JSON.parse(
      JSON.stringify(products, (key, value) =>
        value instanceof Date ? value.toISOString() : value,
      ),
    );

    return {
      props: { products: serializedProducts },
    };
  } catch (err) {
    console.error('SSR / fetch products error:', err);
    return { props: { products: [] } };
  }
}
