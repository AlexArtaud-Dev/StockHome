import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Item } from '@stockhome/shared';
import styles from './Expiring.module.css';

const FILTER_OPTIONS = [7, 14, 30, 90] as const;

function getDaysLeft(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getBadgeClass(daysLeft: number, s: typeof styles): string {
  if (daysLeft <= 0) return s.badgeExpired;
  if (daysLeft <= 3) return s.badgeCritical;
  if (daysLeft <= 7) return s.badgeWarning;
  return s.badgeOk;
}

export function ExpiringPage() {
  const { t } = useTranslation();
  const [days, setDays] = useState<number>(30);

  const { data: items, isLoading, error } = useApi<Item[]>(
    (signal) => api.get(`/items/expiring?days=${days}`, signal),
    [days],
  );

  return (
    <Layout title={t('expiring.title')}>
      <div className={styles.filters}>
        {FILTER_OPTIONS.map((d) => (
          <button
            key={d}
            className={`${styles.filterBtn} ${days === d ? styles.active : ''}`}
            onClick={() => setDays(d)}
          >
            {t(`expiring.filter${d}`)}
          </button>
        ))}
      </div>

      {isLoading && <p className={styles.hint}>{t('common.loading')}</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!isLoading && !error && items?.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.hint}>{t('expiring.empty')}</p>
          <p className={styles.hintSub}>{t('expiring.emptyDesc')}</p>
        </div>
      )}

      <div className={styles.list}>
        {items?.map((item) => {
          if (!item.expiresAt) return null;
          const daysLeft = getDaysLeft(item.expiresAt);
          return (
            <Link to={`/items/${item.id}`} key={item.id} className={styles.row}>
              <div className={styles.itemInfo}>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.date}>
                  {new Date(item.expiresAt).toLocaleDateString()}
                </span>
              </div>
              <span className={`${styles.badge} ${getBadgeClass(daysLeft, styles)}`}>
                {daysLeft <= 0
                  ? t('expiring.expired')
                  : t('expiring.daysLeft', { count: daysLeft })}
              </span>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
}
