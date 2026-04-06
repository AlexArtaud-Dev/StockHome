import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { api } from '../../services/api';
import styles from './BulkAdd.module.css';

export function BulkAddPage() {
  const { containerId } = useParams<{ containerId: string }>();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [added, setAdded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleAdd() {
    if (!name.trim() || !containerId) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.post('/items', {
        containerId,
        roomId: undefined,
        name: name.trim(),
        quantity: 1,
      });
      setAdded((prev) => [...prev, name.trim()]);
      setName('');
      inputRef.current?.focus();
    } catch {
      setError('Failed to add item. Try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd().catch(() => null);
    }
  }

  return (
    <Layout title="Bulk Add Items" showBack>
      <div className={styles.container}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Item name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
          />
          <button
            className={styles.addBtn}
            onClick={() => handleAdd().catch(() => null)}
            disabled={!name.trim() || isSaving}
          >
            Add
          </button>
        </div>

        <p className={styles.hint}>Press Enter or tap Add to quickly add items.</p>

        {added.length > 0 && (
          <div className={styles.addedList}>
            <h3 className={styles.addedTitle}>Added ({added.length})</h3>
            {[...added].reverse().map((item, i) => (
              <div key={i} className={styles.addedRow}>
                ✓ {item}
              </div>
            ))}
          </div>
        )}

        <button
          className={styles.doneBtn}
          onClick={() => navigate(`/containers/${containerId!}`)}
        >
          Done
        </button>
      </div>
    </Layout>
  );
}
