import React from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { ShoppingListItem } from '@stockhome/shared';
import styles from './ShoppingList.module.css';

export function ShoppingListPage() {
  const { data: items, isLoading, error, refetch } = useApi<ShoppingListItem[]>(
    (signal) => api.get('/shopping-list', signal),
  );

  async function handleCheck(item: ShoppingListItem) {
    await api.post(`/items/${item.item.id}/stock-rule/renew`);
    await api.patch(`/items/${item.item.id}/quantity`, { delta: 1 });
    refetch();
  }

  return (
    <Layout title="Shopping List">
      {isLoading && <p className={styles.hint}>Loading…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!isLoading && !error && items?.length === 0 && (
        <p className={styles.hint}>All stocked up! Nothing to restock.</p>
      )}

      <div className={styles.list}>
        {items?.map((entry) => (
          <div key={entry.item.id} className={styles.row}>
            <button
              className={styles.checkBtn}
              onClick={() => handleCheck(entry)}
              aria-label={`Mark ${entry.item.name} as restocked`}
            >
              ○
            </button>
            <div className={styles.info}>
              <span className={styles.name}>{entry.item.name}</span>
              <span className={styles.reason}>
                {entry.reason === 'below_minimum'
                  ? `${entry.currentQuantity} / ${entry.minQuantity ?? '?'} minimum`
                  : 'Renewal due'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
