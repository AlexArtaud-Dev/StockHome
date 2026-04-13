import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { ApiError } from '../../services/api';
import styles from './Auth.module.css';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { refreshHouseholds } = useHousehold();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({ email, password });
      await refreshHouseholds();
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError && err.message === 'EMAIL_NOT_VERIFIED') {
        setError(t('auth.emailNotVerifiedMessage'));
      } else {
        setError(err instanceof ApiError ? err.message : t('common.error'));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>StockHome</h1>
        <p className={styles.subtitle}>{t('auth.loginSubtitle')}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <p className={styles.switchLink}>
          {t('auth.noAccount')}{' '}
          <Link to="/auth/register">{t('auth.createOne')}</Link>
        </p>
      </div>
    </div>
  );
}
