import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { MovementLogEnriched } from '@stockhome/shared';
import styles from './History.module.css';

const LIMIT = 50;

async function downloadExport(format: 'csv' | 'json') {
  const householdId = localStorage.getItem('selectedHouseholdId');
  const headers: Record<string, string> = {};
  if (householdId) headers['X-Household-Id'] = householdId;

  const response = await fetch(`/api/v1/history/export?format=${format}`, {
    credentials: 'include',
    headers,
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `history.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function HistoryPage() {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);

  const { data: logs, isLoading, error } = useApi<MovementLogEnriched[]>(
    (signal) => api.get(`/history?limit=${LIMIT}&offset=${offset}`, signal),
    [offset],
  );

  const hasPrev = offset > 0;
  const hasNext = (logs?.length ?? 0) === LIMIT;

  return (
    <Layout title={t('history.title')}>
      <div className={styles.toolbar}>
        <button className={styles.exportBtn} onClick={() => downloadExport('csv')}>
          <Download size={14} />
          {t('history.csv')}
        </button>
        <button className={styles.exportBtn} onClick={() => downloadExport('json')}>
          <Download size={14} />
          {t('history.json')}
        </button>
      </div>

      {isLoading && <p className={styles.hint}>{t('common.loading')}</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!isLoading && !error && (!logs || logs.length === 0) && (
        <p className={styles.hint}>{t('history.empty')}</p>
      )}

      <div className={styles.list}>
        {logs?.map((log) => (
          <div key={log.id} className={styles.row}>
            <span className={`${styles.action} ${styles[log.action.replace('_', '') as keyof typeof styles]}`}>
              {t(`history.actions.${log.action}`)}
            </span>
            <div className={styles.info}>
              <span className={styles.itemName}>{log.itemName}</span>
              <span className={styles.meta}>
                {log.userName} · {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {(hasPrev || hasNext) && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={!hasPrev}
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
          >
            ← Previous
          </button>
          <button
            className={styles.pageBtn}
            disabled={!hasNext}
            onClick={() => setOffset(offset + LIMIT)}
          >
            Next →
          </button>
        </div>
      )}
    </Layout>
  );
}
