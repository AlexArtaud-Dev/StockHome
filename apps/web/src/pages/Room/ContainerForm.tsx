import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/Modal/Modal';
import { api, ApiError } from '../../services/api';
import { Container, ContainerType } from '@stockhome/shared';
import formStyles from '../../components/Form/Form.module.css';

interface Props {
  roomId: string;
  container?: Container;
  parentContainerId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ContainerForm({ roomId, container, parentContainerId, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const isEdit = Boolean(container);
  const [name, setName] = useState(container?.name ?? '');
  const [type, setType] = useState<ContainerType>(container?.type ?? 'box');
  const [description, setDescription] = useState(container?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const CONTAINER_TYPES: { value: ContainerType; label: string }[] = [
    { value: 'box', label: t('containerTypes.box') },
    { value: 'shelf', label: t('containerTypes.shelf') },
    { value: 'drawer', label: t('containerTypes.drawer') },
    { value: 'bag', label: t('containerTypes.bag') },
    { value: 'other', label: t('containerTypes.other') },
  ];

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
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!container) return;
    if (!window.confirm(t('containerForm.confirmDelete', { name: container.name }))) return;
    setIsDeleting(true);
    try {
      await api.delete(`/containers/${container.id}`);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
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
      setError(err instanceof ApiError ? err.message : t('common.error'));
      setIsDuplicating(false);
    }
  }

  const title = isEdit
    ? t('containerForm.editTitle')
    : parentContainerId
    ? t('containerForm.subTitle')
    : t('containerForm.newTitle');

  return (
    <Modal title={title} onClose={onClose}>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        {error && <div className={formStyles.error}>{error}</div>}

        <div className={formStyles.field}>
          <label htmlFor="containerName">{t('containerForm.name')}</label>
          <input
            id="containerName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={parentContainerId ? t('containerForm.namePlaceholderSub') : t('containerForm.namePlaceholderTop')}
            autoFocus
            required
          />
        </div>

        <div className={formStyles.field}>
          <label htmlFor="containerType">{t('containerForm.type')}</label>
          <select
            id="containerType"
            value={type}
            onChange={(e) => setType(e.target.value as ContainerType)}
          >
            {CONTAINER_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>{ct.label}</option>
            ))}
          </select>
        </div>

        <div className={formStyles.field}>
          <label htmlFor="containerDesc">{t('containerForm.description')} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>{t('common.optional')}</span></label>
          <textarea
            id="containerDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('containerForm.descPlaceholder')}
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
                {isDeleting ? '…' : t('common.delete')}
              </button>
              <button
                type="button"
                className={formStyles.duplicateBtn}
                onClick={handleDuplicate}
                disabled={isDuplicating}
              >
                {isDuplicating ? '…' : t('common.duplicate')}
              </button>
            </>
          )}
          <button type="submit" className={formStyles.submitBtn} disabled={isSaving}>
            {isSaving ? t('common.saving') : isEdit ? t('common.save') : t('containerForm.createBtn')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
