// pages/login.jsx
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { setUser, resetUser } from '../redux/userSlice';
import styles from '../styles/Login.module.css';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';
import { useSelector } from 'react-redux';

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingUser, setLoadingUser] = useState(false);
  const user = useSelector((state) => state.user);

  // Sync NextAuth -> Redux
  useEffect(() => {
    const syncUser = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        setLoadingUser(true);
        try {
          const emailNormalized = session.user.email.toLowerCase();
          const { data } = await axios.get(`/api/user/${emailNormalized}`);
          console.log('Fetched user data:', data);

          // Pass the API response directly
          const userAddress = data.addresses?.find((addr) => addr.isDefault) ||
            data.addresses?.[0] || {
              street: '',
              city: '',
              state: '',
              zip: '',
              country: 'USA',
            };

          dispatch(
            setUser({
              id: data._id,
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              role: data.role || 'user',
              address: data.addresses?.find((a) => a.isDefault) ||
                data.addresses?.[0] || {
                  street: '',
                  city: '',
                  state: '',
                  zip: '',
                  country: 'USA',
                  isDefault: false,
                },
              addresses: data.addresses || [],
              isLoggedIn: true,
            }),
          );

          // ✅ Redirect AFTER user is synced
          router.replace(data.role === 'admin' ? '/admin' : '/user');
        } catch (err) {
          console.error('Failed to fetch user details:', err);
          setError('Failed to load user details. Please try again.');
        } finally {
          setLoadingUser(false);
        }
      } else if (status === 'unauthenticated') {
        dispatch(resetUser());
      }
    };

    syncUser();
  }, [status, session, dispatch, router]);

  // Email/password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoadingUser(true);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError('Invalid email or password');
      setLoadingUser(false);
    }
  };

  // Google login
  const handleGoogleLogin = () => {
    setLoadingUser(true);
    signIn('google', { redirect: false });
  };

  if (status === 'loading' || loadingUser)
    return <LoadingSpinner message="Baking something fresh for you..." />;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Login</h1>

        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          <button type="submit" className={styles.loginButton}>
            Login
          </button>
        </form>

        <p className={styles.forgotPassword}>
          <Link href="/forgot-password">Forgot password?</Link>
        </p>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <button type="button" className={styles.googleButton} onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <p className={styles.signupText}>
          Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
