import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/api';
import styles from './Auth.module.css';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({ username, password });
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
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
            <label htmlFor="username">{t('auth.email')}</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
