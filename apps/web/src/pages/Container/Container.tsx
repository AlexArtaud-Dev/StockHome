import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Package, Plus, QrCode } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Container, Item } from '@stockhome/shared';
import styles from './Container.module.css';

export function ContainerPage() {
  const { id } = useParams<{ id: string }>();
  const [optimisticQuantities, setOptimisticQuantities] = useState<Record<string, number>>({});

  const { data: container } = useApi<Container>(
    (signal) => api.get(`/containers/${id!}`, signal),
    [id],
  );

  const {
    data: items,
    isLoading,
    error,
    refetch,
  } = useApi<Item[]>(
    (signal) => api.get(`/items?containerId=${id!}`, signal),
    [id],
  );

  async function adjustQuantity(item: Item, delta: number) {
    const newQty = Math.max(0, (optimisticQuantities[item.id] ?? item.quantity) + delta);
    setOptimisticQuantities((prev) => ({ ...prev, [item.id]: newQty }));
    try {
      await api.patch(`/items/${item.id}/quantity`, { delta });
    } catch {
      setOptimisticQuantities((prev) => ({ ...prev, [item.id]: item.quantity }));
      refetch();
    }
  }

  return (
    <Layout
      title={container?.name ?? 'Container'}
      showBack
      actions={
        <Link
          to={`/containers/${id!}/bulk-add`}
          className={styles.bulkBtn}
          aria-label="Bulk add items"
        >
          <Plus size={20} />
        </Link>
      }
    >
      {container && (
        <div className={styles.qrSection}>
          <Link to={`/qr-export?containerIds=${container.id}`} className={styles.qrLink}>
            <QrCode size={16} />
            <span>View QR code</span>
          </Link>
        </div>
      )}

      {isLoading && <p className={styles.loading}>Loading…</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {!isLoading && !error && items?.length === 0 && (
        <div className={styles.empty}>
          <Package size={40} />
          <p>Empty container.</p>
          <Link to={`/containers/${id!}/bulk-add`} className={styles.emptyLink}>
            Add items
          </Link>
        </div>
      )}

      <div className={styles.itemList}>
        {items?.map((item) => {
          const qty = optimisticQuantities[item.id] ?? item.quantity;
          return (
            <div key={item.id} className={styles.itemRow}>
              <Link to={`/items/${item.id}`} className={styles.itemName}>
                {item.name}
              </Link>
              <div className={styles.quantityControl}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => adjustQuantity(item, -1)}
                  disabled={qty === 0}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className={styles.qty}>{qty}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => adjustQuantity(item, 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
