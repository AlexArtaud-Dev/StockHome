import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Edit2, Package, Plus } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Container, Item } from '@stockhome/shared';
import { ItemForm } from './ItemForm';
import { ContainerForm } from '../Room/ContainerForm';
import styles from './Container.module.css';

export function ContainerPage() {
  const { id } = useParams<{ id: string }>();
  const [optimisticQuantities, setOptimisticQuantities] = useState<Record<string, number>>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [showEditContainer, setShowEditContainer] = useState(false);

  const { data: container, refetch: refetchContainer } = useApi<Container>(
    (signal) => api.get(`/containers/${id!}`, signal),
    [id],
  );

  const { data: items, isLoading, error, refetch } = useApi<Item[]>(
    (signal) => api.get(`/items?containerId=${id!}`, signal),
    [id],
  );

  async function adjustQuantity(item: Item, delta: number) {
    const prev = optimisticQuantities[item.id] ?? item.quantity;
    const next = Math.max(0, prev + delta);
    setOptimisticQuantities((s) => ({ ...s, [item.id]: next }));
    try {
      await api.patch(`/items/${item.id}/quantity`, { delta });
    } catch {
      setOptimisticQuantities((s) => ({ ...s, [item.id]: item.quantity }));
      refetch();
    }
  }

  return (
    <Layout
      title={container?.name ?? 'Container'}
      showBack
      actions={
        <>
          <button
            className={styles.iconBtn}
            onClick={() => setShowEditContainer(true)}
            aria-label="Edit container"
          >
            <Edit2 size={18} />
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => setShowAddItem(true)}
            aria-label="Add item"
          >
            <Plus size={20} />
          </button>
        </>
      }
    >
      {isLoading && <p className={styles.loading}>Loading…</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {!isLoading && !error && items?.length === 0 && (
        <div className={styles.empty}>
          <Package size={40} />
          <p>Empty container.</p>
          <button className={styles.emptyLink} onClick={() => setShowAddItem(true)}>
            Add items
          </button>
        </div>
      )}

      <div className={styles.itemList}>
        {items?.map((item) => {
          const qty = optimisticQuantities[item.id] ?? item.quantity;
          return (
            <div key={item.id} className={styles.itemRow}>
              <button
                className={styles.itemName}
                onClick={() => setEditItem(item)}
              >
                <span>{item.name}</span>
                {item.tags && item.tags.length > 0 && (
                  <span className={styles.itemTags}>
                    {item.tags.map((t) => t.name).join(', ')}
                  </span>
                )}
              </button>
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

      {showAddItem && container && (
        <ItemForm
          containerId={container.id}
          roomId={container.roomId}
          onClose={() => setShowAddItem(false)}
          onSaved={refetch}
        />
      )}
      {editItem && container && (
        <ItemForm
          containerId={container.id}
          roomId={container.roomId}
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={refetch}
        />
      )}
      {showEditContainer && container && (
        <ContainerForm
          roomId={container.roomId}
          container={container}
          onClose={() => setShowEditContainer(false)}
          onSaved={() => { refetchContainer(); refetch(); }}
        />
      )}
    </Layout>
  );
}
