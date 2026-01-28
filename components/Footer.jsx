import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from '../styles/Footer.module.css';
import {
  FaInfoCircle,
  FaWarehouse,
  FaSitemap,
  FaShieldAlt,
  FaFileContract,
  FaShippingFast,
  FaBoxOpen,
  FaConciergeBell,
  FaEnvelope,
  FaUser,
  FaUserShield,
  FaSignInAlt,
  FaSignOutAlt,
  FaShoppingCart,
} from 'react-icons/fa';

const Footer = () => {
  const [showButton, setShowButton] = useState(false);
  const { data: session, status } = useSession();
  const quantity = useSelector((state) => state.cart.quantity);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowButton(true);
      else setShowButton(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const c = document.documentElement.scrollTop || document.body.scrollTop;
    if (c > 0) {
      window.requestAnimationFrame(scrollToTop);
      window.scrollTo(0, c - c / 8);
    }
  };

  // Navbar-style menu items
  const navbarItems = [
    { href: '/products', icon: <FaBoxOpen />, label: 'Products' },
    { href: '/catering', icon: <FaConciergeBell />, label: 'Catering' },
    { href: '/contact', icon: <FaEnvelope />, label: 'Contact' },
  ];

  if (status === 'authenticated') {
    if (session?.user?.role === 'admin')
      navbarItems.push({ href: '/admin', icon: <FaUserShield />, label: 'Admin' });
    else if (session?.user?.role === 'user')
      navbarItems.push({ href: '/user', icon: <FaUser />, label: 'Account' });

    navbarItems.push({
      href: '#logout',
      icon: <FaSignOutAlt />,
      label: 'Logout',
      action: () => signOut({ callbackUrl: '/' }),
    });
  } else {
    navbarItems.push({ href: '/login', icon: <FaSignInAlt />, label: 'Login' });
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Arbirtage',
    name: 'Amazon Arbirtage',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '3548 Finish Line Dr',
      addressLocality: 'Gainesville',
      addressRegion: 'VA',
      postalCode: '20155',
      addressCountry: 'US',
    },
    telephone: '(571) 279-0444',
    servesCuisine: 'Turkish',
    hasMenu: 'https://www.Amazon.com/menu',
    sameAs: [
      'https://instagram.com/AmazonArbirtage',
      'https://facebook.com',
      'https://youtube.com/@AmazonArbirtage',
    ],
  };

  return (
    <footer className={styles.container}>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>


      {/* Bottom Strip */}
      <div className={styles.bottomStrip}>
        <p>© {new Date().getFullYear()} Amazon Arbirtage. All Rights Reserved.</p>
        <p>
          Powered by <a href="https://www.Amazon.com">Amazon LLC.</a>
        </p>
      </div>

      {/* Scroll to top button */}
      {showButton && (
        <button className={styles.scrollTop} onClick={scrollToTop}>
          ↑ Top
        </button>
      )}
    </footer>
  );
};

export default Footer;
