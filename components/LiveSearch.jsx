import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/Products.module.css';

export default function LiveSearch({ activeCategory = 'All' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) return setResults([]);

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await axios.get('/api/products', {
          params: {
            search: query,
            category: activeCategory !== 'All' ? activeCategory : undefined,
            limit: 5,
          },
        });
        setResults(res.data.products || []);
      } catch (err) {
        console.error('LiveSearch error:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, activeCategory]);

  const handleSelect = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.liveSearchInput}
        />
        <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
      </div>
      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((product) => (
            <li key={product._id}>
              <Link
                href={`/product/${product._id}`}
                className={styles.resultLink}
                onClick={handleSelect}
              >
                <span className={styles.resultTitle}>{product.title}</span>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {product.prices?.length && (
                    <span className={styles.resultPrice}>${product.prices[0]}</span>
                  )}
                  {product.category && (
                    <span className={styles.resultCategory}>{product.category}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
