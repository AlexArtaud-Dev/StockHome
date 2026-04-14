import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ChevronDown,
  Home,
  Package,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingCart,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import styles from './Layout.module.css';

interface LayoutProps {
  title?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function Layout({ title, showBack, actions, children }: LayoutProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { households, selectedHousehold, setSelectedHousehold, hasHousehold } = useHousehold();
  const [showHouseholdDropdown, setShowHouseholdDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <div className={styles.shell}>
      {hasHousehold && <nav className={styles.nav} aria-label="Main navigation">
        <div className={styles.navBrand}>
          <Package size={22} />
          StockHome
        </div>

        {/* Household selector — desktop sidebar */}
        {households.length > 0 && (
          <div className={styles.householdSelector}>
            <button
              className={styles.householdBtn}
              onClick={() => setShowHouseholdDropdown((v) => !v)}
            >
              <span className={styles.householdName}>{selectedHousehold?.name ?? '—'}</span>
              <ChevronDown size={14} />
            </button>
            {showHouseholdDropdown && (
              <div className={styles.householdDropdown}>
                {households.map((h) => (
                  <button
                    key={h.id}
                    className={`${styles.householdOption} ${h.id === selectedHousehold?.id ? styles.householdOptionActive : ''}`}
                    onClick={() => { setSelectedHousehold(h.id); setShowHouseholdDropdown(false); }}
                  >
                    <span>{h.name}</span>
                    <span className={styles.householdBadge}>
                      {h.isOwner ? t('household.ownedLabel') : t('household.memberLabel')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <NavLink to="/" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} end>
          <Home size={20} />
          <span>{t('nav.home')}</span>
        </NavLink>

        {/* Search — desktop sidebar only; on mobile it lives in the header */}
        <NavLink to="/search" className={({ isActive }) => `${styles.navItem} ${styles.desktopOnly} ${isActive ? styles.active : ''}`}>
          <Search size={20} />
          <span>{t('nav.search')}</span>
        </NavLink>

        <NavLink to="/shopping-list" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <ShoppingCart size={20} />
          <span>{t('nav.shop')}</span>
        </NavLink>

        {/* QR Scan — center button on mobile */}
        <NavLink to="/scan" className={styles.scanBtn} aria-label={t('nav.scanQr')}>
          <QrCode size={20} />
          <span className={styles.scanBtnLabel}>{t('nav.scanQr')}</span>
        </NavLink>

        <NavLink to="/members" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <Users size={20} />
          <span>{t('nav.members')}</span>
        </NavLink>

        <div className={styles.navSpacer} />

        {user?.isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <ShieldCheck size={20} />
            <span>Admin</span>
          </NavLink>
        )}

        <NavLink to="/account" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <User size={20} />
          <span>{t('nav.account')}</span>
        </NavLink>
      </nav>}

      <div className={styles.mainArea}>
        {title !== undefined && (
          <>
            <header className={styles.header}>
              {showBack && (
                <button className={styles.headerBack} onClick={() => navigate(-1)} aria-label={t('common.back')}>
                  <ArrowLeft size={20} />
                </button>
              )}
              <h1 className={styles.headerTitle}>{title}</h1>
              {actions && <div className={styles.headerActions}>{actions}</div>}
              {/* Search icon — mobile only */}
              {hasHousehold && (
                <button
                  className={styles.mobileSearchBtn}
                  aria-label={t('nav.search')}
                  onClick={() => {
                    if (showMobileSearch) {
                      setShowMobileSearch(false);
                    } else {
                      setShowMobileSearch(true);
                    }
                  }}
                >
                  <Search size={20} />
                </button>
              )}
            </header>
            {/* Expandable mobile search bar */}
            {showMobileSearch && (
              <div className={styles.mobileSearchBar}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim();
                    if (val) navigate(`/search?q=${encodeURIComponent(val)}`);
                    setShowMobileSearch(false);
                  }}
                >
                  <input
                    name="q"
                    type="search"
                    className={styles.mobileSearchInput}
                    placeholder={t('nav.search') + '…'}
                    autoFocus
                  />
                </form>
              </div>
            )}
          </>
        )}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
