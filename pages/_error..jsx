import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/ErrorPage.module.css';

export default function ErrorPage({ statusCode }) {
  const is404 = statusCode === 404;

  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper}>
        <Image
          src={is404 ? '/img/404.png' : '/img/error.png'}
          alt={is404 ? '404 Not Found' : 'Error'}
          width={300}
          height={300}
          className={styles.image}
        />
      </div>
      <h1 className={styles.title}>
        {is404 ? 'Oops! Page Not Found' : `Error ${statusCode || ''}`}
      </h1>
      <p className={styles.message}>
        {is404
          ? 'The page you are looking for does not exist.'
          : 'Something went wrong. Please try again later.'}
      </p>
      <Link href="/products">
        <button className={styles.button}>Back to Shop</button>
      </Link>
    </div>
  );
}

// Get initial status code
ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
