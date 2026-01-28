// components/Toast.jsx
import { useEffect } from 'react';
import styles from '../styles/Toast.module.css';

const Toast = ({ message, show, setShow }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setShow(false), 3000); // hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [show, setShow]);

  return show && <div className={styles.toast}>{message}</div>;
};

export default Toast;
