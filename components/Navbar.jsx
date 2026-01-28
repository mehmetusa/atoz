import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSession, signOut } from 'next-auth/react';
import {
  FaBars,
  FaTimes,
  FaBoxOpen,
  FaConciergeBell,
  FaEnvelope,
  FaUser,
  FaUserShield,
  FaSignInAlt,
  FaSignOutAlt,
  FaShoppingCart,
} from 'react-icons/fa';
import { resetUser } from '../redux/userSlice';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
  const quantity = useSelector((state) => state.cart.quantity);
  const { data: session, status } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dispatch = useDispatch();

  const baseMenu = [
    { href: '/about', icon: <FaEnvelope />, label: 'About' },
    { href: '/contact', icon: <FaEnvelope />, label: 'Contact' },
  ];

  const authMenu = () => {
    if (status !== 'authenticated') {
      return [{ href: '/login', icon: <FaSignInAlt />, label: 'Login' }];
    }

    const items = [];
    if (session.user.role === 'admin')
      items.push({ href: '/admin', icon: <FaUserShield />, label: 'Admin' });
    else items.push({ href: '/user', icon: <FaUser />, label: 'Account' });

    // Logout as a button
    items.push({
      href: '#logout',
      icon: <FaSignOutAlt />,
      label: 'Logout',
      action: () => {
        dispatch(resetUser()); // 🔥 clear Redux user
        signOut({ callbackUrl: '/' }); // NextAuth logout
      },
    });

    return items;
  };

  const menuItems = [ ...authMenu(),...baseMenu];

  const handleLinkClick = (action) => {
    if (action) action();
    setDrawerOpen(false);
  };

  return (
    <nav className={styles.container}>
      {/* Mobile hamburger */}
      <div className={styles.mobileMenuIcon} onClick={() => setDrawerOpen(true)}>
        <FaBars size={36} color="#333" />
      </div>

      {/* Logo */}
      <div className={styles.logoWrapper}>
        <Link href="/" className={styles.logo}>
          <Image src="/img/logo.png" alt="Amazon Logo" width={100} height={100} />
        </Link>
      </div>

      {/* Desktop Links */}
      <ul className={styles.desktopLinks}>
        {menuItems.map((item) =>
          item.href === '#logout-mehmet' ? (
            <li key={item.href} className={styles.linkItem}>
              <button onClick={item.action} className={styles.linkButton}>
                {item.icon} {item.label}
              </button>
            </li>
          ) : (
            <li key={item.href} className={styles.linkItem}>
              <Link
                href={item.href}
                className={styles.link}
                onClick={() => item.action && item.action()}
              >
                {item.icon} {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>

      {/* Right icons */}
      <div className={styles.rightIcons}>
        <Link href="/cart" className={styles.cart}>
          <FaShoppingCart className={styles.cartIcon} size={30} />
          {quantity > 0 && <div className={styles.counter}>{quantity}</div>}
        </Link>

        <Link
          href={
            status === 'authenticated'
              ? session.user.role === 'admin'
                ? '/admin'
                : '/user'
              : '/login'
          }
          className={styles.accountLinkMobile}
        >
          <FaUser className={styles.accountIcon} />
        </Link>
      </div>

      {/* Mobile Overlay */}
      <div
        className={`${styles.overlay} ${drawerOpen ? styles.active : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Mobile Drawer */}
      <ul className={`${styles.mobileDrawer} ${drawerOpen ? styles.open : ''}`}>
        <li className={styles.closeBtn} onClick={() => setDrawerOpen(false)}>
          <FaTimes size={26} />
        </li>

        {menuItems.map((item) => (
          <li
            key={item.href}
            className={styles.linkItem}
            onClick={() => handleLinkClick(item.action)}
          >
            <Link href={item.href} className={styles.link}>
              {item.icon} {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
