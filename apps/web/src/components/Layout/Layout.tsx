import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  QrCode,
  Search,
  Settings,
  ShoppingCart,
} from 'lucide-react';
import styles from './Layout.module.css';

interface LayoutProps {
  title?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function Layout({ title, showBack, actions, children }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.shell}>
      {title !== undefined && (
        <header className={styles.header}>
          {showBack && (
            <button
              className={styles.headerBack}
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className={styles.headerTitle}>{title}</h1>
          {actions && <div className={styles.headerActions}>{actions}</div>}
        </header>
      )}

      <main className={styles.content}>{children}</main>

      <nav className={styles.nav} aria-label="Main navigation">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
          end
        >
          <Home size={22} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <Search size={22} />
          <span>Search</span>
        </NavLink>

        <Link to="/scan" className={styles.scanBtn} aria-label="Scan QR code">
          <QrCode size={24} />
        </Link>

        <NavLink
          to="/shopping-list"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <ShoppingCart size={22} />
          <span>Shop</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <Settings size={22} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
