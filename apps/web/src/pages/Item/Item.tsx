import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2 } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Item, StockRule } from '@stockhome/shared';
import { ItemForm } from '../Container/ItemForm';
import styles from './Item.module.css';

export function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);
  const [qty, setQty] = useState<number | null>(null);

  const { data: item, isLoading, error, refetch } = useApi<Item>(
    (signal) => api.get(`/items/${id!}`, signal),
    [id],
  );

  const displayQty = qty ?? item?.quantity ?? 0;

  async function adjustQuantity(delta: number) {
    if (!item) return;
    const next = Math.max(0, displayQty + delta);
    setQty(next);
    try {
      await api.patch(`/items/${item.id}/quantity`, { delta });
    } catch {
      setQty(item.quantity);
      refetch();
    }
  }

  async function handleDeleted() {
    navigate(-1);
  }

  if (isLoading) return <Layout title="Item" showBack><p className={styles.hint}>Loading…</p></Layout>;
  if (error || !item) return <Layout title="Item" showBack><p className={styles.error}>{error ?? 'Not found'}</p></Layout>;

  return (
    <Layout
      title={item.name}
      showBack
      actions={
        <button className={styles.iconBtn} onClick={() => setShowEdit(true)} aria-label="Edit item">
          <Edit2 size={18} />
        </button>
      }
    >
      <div className={styles.page}>
        {item.description && (
          <p className={styles.description}>{item.description}</p>
        )}

        <div className={styles.quantityCard}>
          <span className={styles.qtyLabel}>Quantity</span>
          <div className={styles.qtyControl}>
            <button
              className={styles.qtyBtn}
              onClick={() => adjustQuantity(-1)}
              disabled={displayQty === 0}
              aria-label="Decrease"
            >
              −
            </button>
            <span className={styles.qtyValue}>{displayQty}</span>
            <button
              className={styles.qtyBtn}
              onClick={() => adjustQuantity(1)}
              aria-label="Increase"
            >
              +
            </button>
          </div>
        </div>

        {(item.tags && item.tags.length > 0) && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tags</h3>
            <div className={styles.tagList}>
              {item.tags.map((t) => (
                <span key={t.id} className={styles.tag}>{t.name}</span>
              ))}
            </div>
          </div>
        )}

        {item.isConsumable && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Stock rule</h3>
            <StockRulePanel item={item} onUpdated={refetch} />
          </div>
        )}

        {item.expiresAt && (
          <ExpiryBadge expiresAt={item.expiresAt} />
        )}

        <div className={styles.meta}>
          <span>Added {new Date(item.createdAt).toLocaleDateString()}</span>
          {item.updatedAt !== item.createdAt && (
            <span>· Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {showEdit && item.containerId && (
        <ItemForm
          containerId={item.containerId}
          roomId={item.roomId}
          item={item}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            refetch();
            handleDeleted().catch(() => null);
          }}
        />
      )}
    </Layout>
  );
}

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const label = daysLeft <= 0
    ? 'Expired'
    : daysLeft === 1
    ? 'Expires tomorrow'
    : `Expires in ${daysLeft} days`;
  const color = daysLeft <= 0 ? '#dc2626' : daysLeft <= 3 ? '#ea580c' : daysLeft <= 7 ? '#d97706' : '#16a34a';
  return (
    <div className={styles.expiryBadge} style={{ borderColor: color, color }}>
      <span>{label}</span>
      <span style={{ opacity: 0.7, fontSize: '11px' }}>
        {new Date(expiresAt).toLocaleDateString()}
      </span>
    </div>
  );
}

function StockRulePanel({ item, onUpdated }: { item: Item; onUpdated: () => void }) {
  const rule = item.stockRule;
  const [minQty, setMinQty] = useState(String(rule?.minQuantity ?? ''));
  const [interval, setInterval] = useState(String(rule?.renewalIntervalDays ?? ''));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      await api.put(`/items/${item.id}/stock-rule`, {
        minQuantity: minQty ? parseInt(minQty, 10) : undefined,
        renewalIntervalDays: interval ? parseInt(interval, 10) : undefined,
      });
      setMsg('Saved');
      onUpdated();
    } catch {
      setMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.stockRuleForm}>
      <div className={styles.ruleRow}>
        <label>Alert below</label>
        <input
          type="number"
          min="0"
          value={minQty}
          onChange={(e) => setMinQty(e.target.value)}
          placeholder="—"
        />
        <span>units</span>
      </div>
      <div className={styles.ruleRow}>
        <label>Renew every</label>
        <input
          type="number"
          min="1"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          placeholder="—"
        />
        <span>days</span>
      </div>
      <button className={styles.saveRuleBtn} onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save rule'}
      </button>
      {msg && <p className={styles.ruleMsg}>{msg}</p>}
    </div>
  );
}
