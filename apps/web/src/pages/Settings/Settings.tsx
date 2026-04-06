import React from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import styles from './Settings.module.css';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <Layout title="Settings">
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Appearance</h2>
        <div className={styles.themeGroup}>
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              className={`${styles.themeBtn} ${theme === t ? styles.active : ''}`}
              onClick={() => setTheme(t)}
            >
              {t === 'light' ? '☀️ Light' : t === 'dark' ? '🌙 Dark' : '⚙️ System'}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <div className={styles.userInfo}>
          <p><strong>{user?.displayName ?? user?.username}</strong></p>
          <p className={styles.username}>@{user?.username}</p>
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          Sign out
        </button>
      </section>
    </Layout>
  );
}
