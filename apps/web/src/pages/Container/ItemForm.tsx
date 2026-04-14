import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CreatableSelect from 'react-select/creatable';
import { Modal } from '../../components/Modal/Modal';
import { api, ApiError } from '../../services/api';
import { Item } from '@stockhome/shared';
import formStyles from '../../components/Form/Form.module.css';

interface Props {
  containerId: string;
  roomId: string;
  item?: Item;
  onClose: () => void;
  onSaved: () => void;
}

type TagOption = { label: string; value: string };

const selectStyles = {
  control: (base: object, state: { isFocused: boolean }) => ({
    ...base,
    backgroundColor: 'var(--color-bg-elevated)',
    borderColor: state.isFocused ? 'var(--color-primary)' : 'var(--color-border)',
    borderWidth: '1.5px',
    borderRadius: '8px',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
    minHeight: '44px',
    '&:hover': { borderColor: 'var(--color-border-strong)' },
  }),
  menu: (base: object) => ({
    ...base,
    backgroundColor: 'var(--color-bg-elevated)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 9999,
  }),
  option: (base: object, state: { isFocused: boolean }) => ({
    ...base,
    backgroundColor: state.isFocused ? 'rgba(99,102,241,0.08)' : 'transparent',
    color: 'var(--color-text)',
    cursor: 'pointer',
    ':active': { backgroundColor: 'rgba(99,102,241,0.12)' },
  }),
  multiValue: (base: object) => ({
    ...base,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderRadius: '100px',
    border: '1px solid rgba(99,102,241,0.25)',
  }),
  multiValueLabel: (base: object) => ({
    ...base,
    color: 'var(--color-primary)',
    fontWeight: '600',
    fontSize: '12px',
    paddingLeft: '8px',
    paddingRight: '4px',
  }),
  multiValueRemove: (base: object) => ({
    ...base,
    color: 'var(--color-primary)',
    opacity: 0.55,
    borderRadius: '0 100px 100px 0',
    paddingRight: '6px',
    ':hover': {
      backgroundColor: 'rgba(99,102,241,0.2)',
      color: 'var(--color-primary)',
      opacity: 1,
    },
  }),
  input: (base: object) => ({
    ...base,
    color: 'var(--color-text)',
    fontFamily: 'var(--font-sans)',
  }),
  placeholder: (base: object) => ({
    ...base,
    color: 'var(--color-text-subtle)',
    fontSize: 'var(--font-size-sm)',
  }),
  noOptionsMessage: (base: object) => ({
    ...base,
    color: 'var(--color-text-muted)',
    fontSize: 'var(--font-size-sm)',
  }),
};

export function ItemForm({ containerId, roomId, item, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const isEdit = Boolean(item);
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [isConsumable, setIsConsumable] = useState(item?.isConsumable ?? false);
  const [minQuantity, setMinQuantity] = useState(String(item?.stockRule?.minQuantity ?? ''));
  const [tags, setTags] = useState<TagOption[]>(
    item?.tags?.map((tag) => ({ label: tag.name, value: tag.name })) ?? [],
  );
  const [expiresAt, setExpiresAt] = useState(
    item?.expiresAt ? item.expiresAt.substring(0, 10) : '',
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      let savedId: string;

      const parsedQty = parseInt(quantity, 10);
      const safeQty = Number.isNaN(parsedQty) ? 1 : Math.max(0, parsedQty);
      const tagNames = tags.map((tag) => tag.value);

      if (isEdit && item) {
        await api.patch(`/items/${item.id}`, {
          name,
          description: description || null,
          quantity: safeQty,
          isConsumable,
          tagNames,
          containerId,
          expiresAt: expiresAt || null,
        });
        savedId = item.id;
      } else {
        const created = await api.post<Item>('/items', {
          name,
          description: description || null,
          quantity: safeQty,
          isConsumable,
          tagNames,
          containerId,
          roomId,
          expiresAt: expiresAt || null,
        });
        savedId = created.id;
      }

      if (isConsumable && minQuantity !== '') {
        const min = parseInt(minQuantity, 10);
        if (!isNaN(min) && min >= 0) {
          await api.put(`/items/${savedId}/stock-rule`, { minQuantity: min });
        }
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
    if (!item) return;
    if (!window.confirm(t('itemForm.confirmDelete', { name: item.name }))) return;
    setIsDeleting(true);
    try {
      await api.delete(`/items/${item.id}`);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
      setIsDeleting(false);
    }
  }

  async function handleDuplicate() {
    if (!item) return;
    setIsDuplicating(true);
    try {
      await api.post(`/items/${item.id}/duplicate`, {});
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
      setIsDuplicating(false);
    }
  }

  return (
    <Modal title={isEdit ? t('itemForm.editTitle') : t('itemForm.addTitle')} onClose={onClose}>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        {error && <div className={formStyles.error}>{error}</div>}

        <div className={formStyles.field}>
          <label htmlFor="itemName">{t('itemForm.name')}</label>
          <input
            id="itemName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('itemForm.namePlaceholder')}
            autoFocus
            required
          />
        </div>

        <div className={formStyles.field}>
          <label htmlFor="itemDesc">{t('itemForm.description')} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>{t('common.optional')}</span></label>
          <textarea
            id="itemDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('itemForm.descPlaceholder')}
          />
        </div>

        <div className={formStyles.field}>
          <label htmlFor="itemQty">{t('itemForm.quantity')}</label>
          <input
            id="itemQty"
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className={formStyles.field}>
          <label>{t('itemForm.tags')}</label>
          <CreatableSelect
            isMulti
            isClearable={false}
            value={tags}
            onChange={(vals) => setTags(vals as TagOption[])}
            placeholder={t('itemForm.tagPlaceholder')}
            formatCreateLabel={(input) => t('itemForm.tagCreate', { label: input })}
            noOptionsMessage={() => t('itemForm.tagNoOptions')}
            styles={selectStyles as object}
          />
        </div>

        <div
          className={formStyles.checkRow}
          onClick={() => setIsConsumable((v) => !v)}
        >
          <input
            id="isConsumable"
            type="checkbox"
            checked={isConsumable}
            onChange={(e) => setIsConsumable(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
          <label htmlFor="isConsumable" onClick={(e) => e.stopPropagation()}>
            {t('itemForm.consumable')}
          </label>
        </div>

        {isConsumable && (
          <div className={formStyles.subSection}>
            <div className={formStyles.field}>
              <label htmlFor="minQty">{t('itemForm.minStock')}</label>
              <input
                id="minQty"
                type="number"
                min="0"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                placeholder={t('itemForm.minStockPlaceholder')}
              />
              <span className={formStyles.hint}>
                {t('itemForm.minStockHint')}
              </span>
            </div>
          </div>
        )}

        <div className={formStyles.field}>
          <label htmlFor="expiresAt">
            {t('itemForm.expiresAt')}{' '}
            <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>{t('common.optional')}</span>
          </label>
          <input
            id="expiresAt"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <span className={formStyles.hint}>{t('itemForm.expiresAtHint')}</span>
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
            {isSaving ? t('common.saving') : isEdit ? t('common.save') : t('itemForm.addBtn')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
