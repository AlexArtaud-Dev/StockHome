import React, { useState } from 'react';
import styles from './ConfirmDeleteModal.module.css';

interface Props {
  title: string;
  step1Body: string;
  step2Body: string;
  confirmName: string;
  confirmPlaceholder: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  title,
  step1Body,
  step2Body,
  confirmName,
  confirmPlaceholder,
  onConfirm,
  onCancel,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleFinalConfirm() {
    if (typed !== confirmName) return;
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </div>

        {step === 1 ? (
          <>
            <p className={styles.body}>{step1Body}</p>
            <div className={styles.warning}>
              ⚠ This action cannot be undone.
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onCancel}>
                Cancel
              </button>
              <button type="button" className={styles.dangerBtn} onClick={() => setStep(2)}>
                Yes, delete it
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.body}>{step2Body}</p>
            <input
              type="text"
              className={styles.confirmInput}
              placeholder={confirmPlaceholder}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
            />
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onCancel}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={handleFinalConfirm}
                disabled={typed !== confirmName || loading}
              >
                {loading ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
