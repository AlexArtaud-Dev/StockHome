import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/api';
import styles from './Auth.module.css';

export function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    displayName: '',
    householdName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await register({
        username: form.username,
        password: form.password,
        displayName: form.displayName || undefined,
        householdName: form.householdName,
      });
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
        <p className={styles.subtitle}>{t('auth.registerSubtitle')}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="householdName">Household name</label>
            <input
              id="householdName"
              name="householdName"
              type="text"
              value={form.householdName}
              onChange={handleChange}
              placeholder="e.g. Smith Family"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="displayName">Your name {t('common.optional')}</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={form.displayName}
              onChange={handleChange}
              placeholder="e.g. Alex"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="username">{t('auth.email')}</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? t('auth.creating') : t('auth.createAccount')}
          </button>
        </form>

        <p className={styles.switchLink}>
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/auth/login">{t('auth.signInLink')}</Link>
        </p>
      </div>
    </div>
  );
}
