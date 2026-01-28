// components/LoadingSpinner.jsx
import Image from 'next/image';
import { motion } from 'framer-motion';
import styles from '../styles/LoadingSpinner.module.css';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className={styles.wrapper}>
      {/* Spinning Outer Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
        className={styles.ring}
      >
        <Image
          src="/img/Amazon-outer.png"
          alt="Amazon Arbirtage Ring"
          fill
          className={styles.ringImg}
        />
      </motion.div>

      {/* Static Inner Woman */}
      <div className={styles.inner}>
        <Image src="/img/Amazon-inner.png" alt="Baker" fill className={styles.innerImg} />
      </div>

      {/* Loading Message */}
      <p className={styles.message}>{message}</p>
    </div>
  );
}
