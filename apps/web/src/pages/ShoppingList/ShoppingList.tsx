import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { ShoppingListItem } from '@stockhome/shared';
import styles from './ShoppingList.module.css';

export function ShoppingListPage() {
  const { t } = useTranslation();
  const { data: items, isLoading, error, refetch } = useApi<ShoppingListItem[]>(
    (signal) => api.get('/shopping-list', signal),
  );

  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState('1');

  function startRestock(itemId: string) {
    setRestockingId(itemId);
    setRestockQty('1');
  }

  async function confirmRestock(entry: ShoppingListItem) {
    const qty = Math.max(1, parseInt(restockQty, 10) || 1);
    setRestockingId(null);
    await api.post(`/items/${entry.item.id}/stock-rule/renew`);
    await api.patch(`/items/${entry.item.id}/quantity`, { delta: qty });
    refetch();
  }

  return (
    <Layout title={t('shoppingList.title')}>
      {isLoading && <p className={styles.hint}>{t('common.loading')}</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!isLoading && !error && items?.length === 0 && (
        <>
          <p className={styles.hint}>{t('shoppingList.empty')}</p>
          <p className={styles.hint}>{t('shoppingList.emptyDesc')}</p>
        </>
      )}

      <div className={styles.list}>
        {items?.map((entry) => (
          <div key={entry.item.id} className={styles.row}>
            {restockingId === entry.item.id ? (
              <div className={styles.restockInline}>
                <input
                  type="number"
                  min="1"
                  className={styles.qtyInput}
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  autoFocus
                  aria-label={t('shoppingList.addQty')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRestock(entry);
                    if (e.key === 'Escape') setRestockingId(null);
                  }}
                />
                <button
                  className={styles.confirmBtn}
                  onClick={() => confirmRestock(entry)}
                  aria-label={t('shoppingList.confirm')}
                >
                  ✓
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setRestockingId(null)}
                  aria-label={t('common.cancel')}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                className={styles.checkBtn}
                onClick={() => startRestock(entry.item.id)}
                aria-label={`Restock ${entry.item.name}`}
              >
                ○
              </button>
            )}
            <div className={styles.info}>
              <span className={styles.name}>{entry.item.name}</span>
              <span className={styles.reason}>
                {entry.reason === 'below_minimum'
                  ? `${t('shoppingList.currentQty', { qty: entry.currentQuantity })} · ${t('shoppingList.minQty', { min: entry.minQuantity ?? '?' })}`
                  : t('shoppingList.renewalDue')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
