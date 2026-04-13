import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  Package,
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
      <nav className={styles.nav} aria-label="Main navigation">
        <div className={styles.navBrand}>
          <Package size={22} />
          StockHome
        </div>

        <NavLink to="/" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} end>
          <Home size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <Search size={20} />
          <span>Search</span>
        </NavLink>

        <NavLink to="/scan" className={styles.scanBtn} aria-label="Scan QR code">
          <QrCode size={20} />
        </NavLink>

        <NavLink to="/shopping-list" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <ShoppingCart size={20} />
          <span>Shop</span>
        </NavLink>

        <div className={styles.navSpacer} />

        <NavLink to="/settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className={styles.mainArea}>
        {title !== undefined && (
          <header className={styles.header}>
            {showBack && (
              <button className={styles.headerBack} onClick={() => navigate(-1)} aria-label="Go back">
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className={styles.headerTitle}>{title}</h1>
            {actions && <div className={styles.headerActions}>{actions}</div>}
          </header>
        )}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
