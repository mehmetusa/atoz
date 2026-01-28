import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import LoadingSpinner from '../components/LoadingSpinner';
import { styles } from '../styles/Signin.module.css';

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect after login
  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user.role === 'admin') router.replace('/admin');
      else router.replace('/user');
    }
  }, [status, session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      user: email, // CredentialsProvider expects "username", so map email
      password,
    });

    setLoading(false);

    if (res?.error) {
      alert('Invalid credentials');
    }
  };

  const handleGoogleLogin = () => signIn('google', { callbackUrl: '/user' });

  if (status === 'loading') return <LoadingSpinner message="Baking something fresh for you..." />;

  return (
    <div style={styles.container}>
      <div style={styles.formBox}>
        <h1>Login</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <button style={styles.googleButton} onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
        <p style={styles.signupText}>
          Don't have an account? <Link href="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
