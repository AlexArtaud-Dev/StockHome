import React, { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { api, ApiError } from '../../services/api';
import { Container, ContainerType } from '@stockhome/shared';
import formStyles from '../../components/Form/Form.module.css';

const CONTAINER_TYPES: { value: ContainerType; label: string }[] = [
  { value: 'box', label: '📦 Box' },
  { value: 'shelf', label: '🗄️ Shelf' },
  { value: 'drawer', label: '🗂️ Drawer' },
  { value: 'bag', label: '👜 Bag' },
  { value: 'other', label: '📁 Other' },
];

interface Props {
  roomId: string;
  container?: Container;
  parentContainerId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ContainerForm({ roomId, container, parentContainerId, onClose, onSaved }: Props) {
  const isEdit = Boolean(container);
  const [name, setName] = useState(container?.name ?? '');
  const [type, setType] = useState<ContainerType>(container?.type ?? 'box');
  const [description, setDescription] = useState(container?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      if (isEdit && container) {
        await api.patch(`/containers/${container.id}`, {
          name,
          type,
          description: description || null,
        });
      } else {
        await api.post('/containers', {
          roomId,
          parentContainerId: parentContainerId ?? null,
          name,
          type,
          description: description || null,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save container');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!container) return;
    if (!window.confirm(`Delete "${container.name}"? All items inside will also be deleted.`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/containers/${container.id}`);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete container');
      setIsDeleting(false);
    }
  }

  async function handleDuplicate() {
    if (!container) return;
    setIsDuplicating(true);
    try {
      await api.post(`/containers/${container.id}/duplicate`, {});
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to duplicate container');
      setIsDuplicating(false);
    }
  }

  const title = isEdit
    ? 'Edit container'
    : parentContainerId
    ? 'Add sub-container'
    : 'New container';

  return (
    <Modal title={title} onClose={onClose}>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        {error && <div className={formStyles.error}>{error}</div>}

        <div className={formStyles.field}>
          <label htmlFor="containerName">Name</label>
          <input
            id="containerName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={parentContainerId ? 'e.g. Shelf A, Compartment 1…' : 'e.g. Winter clothes, Power tools…'}
            autoFocus
            required
          />
        </div>

        <div className={formStyles.field}>
          <label htmlFor="containerType">Type</label>
          <select
            id="containerType"
            value={type}
            onChange={(e) => setType(e.target.value as ContainerType)}
          >
            {CONTAINER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className={formStyles.field}>
          <label htmlFor="containerDesc">Description <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span></label>
          <textarea
            id="containerDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's stored here…"
          />
        </div>

        <div className={formStyles.actions}>
          {isEdit && (
            <>
              <button
                type="button"
                className={formStyles.deleteBtn}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '…' : 'Delete'}
              </button>
              <button
                type="button"
                className={formStyles.duplicateBtn}
                onClick={handleDuplicate}
                disabled={isDuplicating}
              >
                {isDuplicating ? '…' : 'Duplicate'}
              </button>
            </>
          )}
          <button type="submit" className={formStyles.submitBtn} disabled={isSaving}>
            {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
