import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/Layout/Layout';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import styles from './Settings.module.css';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <Layout title={t('settings.title')}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('settings.theme')}</h2>
        <div className={styles.themeGroup}>
          {(['light', 'dark', 'system'] as const).map((themeOption) => (
            <button
              key={themeOption}
              className={`${styles.themeBtn} ${theme === themeOption ? styles.active : ''}`}
              onClick={() => setTheme(themeOption)}
            >
              {themeOption === 'light' ? `☀️ ${t('settings.light')}` : themeOption === 'dark' ? `🌙 ${t('settings.dark')}` : `⚙️ ${t('settings.system')}`}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('settings.language')}</h2>
        <div className={styles.themeGroup}>
          {(['en', 'fr'] as const).map((lang) => (
            <button
              key={lang}
              className={`${styles.themeBtn} ${i18n.language === lang || i18n.language.startsWith(lang + '-') ? styles.active : ''}`}
              onClick={() => i18n.changeLanguage(lang)}
            >
              {lang === 'en' ? t('settings.english') : t('settings.french')}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('account.title')}</h2>
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
