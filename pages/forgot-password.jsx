import { useState } from 'react';
import Link from 'next/link';
import styles from '../styles/Login.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong');
      } else {
        setMessage('If an account exists, a reset link has been sent to your email.');
        setEmail('');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Forgot Password</h1>

        {error && <p className={styles.error}>{error}</p>}

        {message ? (
          <p style={{ color: 'green' }}>{message}</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
            <button type="submit" className={styles.loginButton}>
              Send Reset Link
            </button>
          </form>
        )}
        <p className={styles.signupText}>
          Remember your password? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
