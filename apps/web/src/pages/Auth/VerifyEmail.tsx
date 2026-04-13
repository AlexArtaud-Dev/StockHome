import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../../services/api';
import styles from './Auth.module.css';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token');

  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  // Prevent React Strict Mode from calling the API twice — the first call clears
  // the token from the DB, so the second call would fail with "not found".
  const didVerify = useRef(false);

  // If token is in URL, verify immediately
  useEffect(() => {
    if (!token || didVerify.current) return;
    didVerify.current = true;
    setVerifyState('verifying');
    api.post('/auth/verify-email', { token })
      .then(() => setVerifyState('success'))
      .catch(() => setVerifyState('error'));
  }, [token]);

  async function handleResend() {
    if (!email) return;
    setResendError(null);
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setResendCountdown(300); // 5 minutes in seconds
    } catch (err) {
      setResendError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setResending(false);
    }
  }

  // Countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  if (token) {
    if (verifyState === 'verifying') {
      return (
        <div className={styles.page}>
          <div className={styles.card}>
            <p className={styles.verifyText}>{t('common.loading')}</p>
          </div>
        </div>
      );
    }
    if (verifyState === 'success') {
      return (
        <div className={styles.page}>
          <div className={styles.card}>
            <div className={styles.verifyIcon}>✅</div>
            <h1 className={styles.title}>StockHome</h1>
            <p className={styles.verifyText}>{t('auth.verifyEmailSuccess')}</p>
            <Link to="/auth/login" className={styles.submitBtn} style={{ textAlign: 'center', display: 'block' }}>
              {t('auth.signIn')}
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.verifyIcon}>❌</div>
          <h1 className={styles.title}>StockHome</h1>
          <p className={styles.verifyText}>{t('auth.verifyEmailError')}</p>
          <Link to="/auth/login" className={styles.submitBtn} style={{ textAlign: 'center', display: 'block' }}>
            {t('auth.signIn')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.verifyIcon}>📧</div>
        <h1 className={styles.title}>{t('auth.verifyEmailTitle')}</h1>
        {email && (
          <p className={styles.verifyText}>
            {t('auth.verifyEmailMessage', { email })}
          </p>
        )}

        {resendError && <div className={styles.error}>{resendError}</div>}

        <div className={styles.form}>
          <button
            className={styles.resendBtn}
            onClick={handleResend}
            disabled={resending || resendCountdown > 0}
          >
            {resending
              ? t('auth.verifyEmailResending')
              : resendCountdown > 0
              ? t('auth.verifyEmailResendIn', { seconds: resendCountdown })
              : t('auth.verifyEmailResend')}
          </button>

          <p className={styles.switchLink}>
            <Link to="/auth/login">{t('auth.signInLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
