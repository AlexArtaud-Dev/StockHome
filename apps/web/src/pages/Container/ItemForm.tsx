import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
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

export function ItemForm({ containerId, roomId, item, onClose, onSaved }: Props) {
  const isEdit = Boolean(item);
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [isConsumable, setIsConsumable] = useState(item?.isConsumable ?? false);
  const [minQuantity, setMinQuantity] = useState(String(item?.stockRule?.minQuantity ?? ''));
  const [tags, setTags] = useState<string[]>(item?.tags?.map((t) => t.name) ?? []);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const val = raw.trim();
    if (val && !tags.includes(val)) setTags((prev) => [...prev, val]);
    setTagInput('');
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
    else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) setTags((prev) => prev.slice(0, -1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tagInput.trim()) addTag(tagInput);
    setError(null);
    setIsSaving(true);
    try {
      let savedId: string;

      if (isEdit && item) {
        await api.patch(`/items/${item.id}`, {
          name,
          description: description || null,
          quantity: parseInt(quantity, 10) || 1,
          isConsumable,
          tagNames: tags,
          containerId,
        });
        savedId = item.id;
      } else {
        const created = await api.post<Item>('/items', {
          name,
          description: description || null,
          quantity: parseInt(quantity, 10) || 1,
          isConsumable,
          tagNames: tags,
          containerId,
          roomId,
        });
        savedId = created.id;
      }

      // Upsert stock rule when consumable with a minQuantity
      if (isConsumable && minQuantity !== '') {
        const min = parseInt(minQuantity, 10);
        if (!isNaN(min) && min >= 0) {
          await api.put(`/items/${savedId}/stock-rule`, { minQuantity: min });
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/items/${item.id}`);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete item');
      setIsDeleting(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit item' : 'Add item'} onClose={onClose}>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        {error && <div className={formStyles.error}>{error}</div>}

        <div className={formStyles.field}>
          <label htmlFor="itemName">Name</label>
          <input
            id="itemName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Screwdriver, Winter jacket…"
            autoFocus
            required
          />
        </div>

        <div className={formStyles.field}>
          <label htmlFor="itemDesc">Description <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span></label>
          <textarea
            id="itemDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brand, size, color…"
          />
        </div>

        <div className={formStyles.field}>
          <label htmlFor="itemQty">Quantity</label>
          <input
            id="itemQty"
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className={formStyles.field}>
          <label>Tags</label>
          <div
            className={formStyles.tagInput}
            onClick={() => tagInputRef.current?.focus()}
          >
            {tags.map((tag) => (
              <span key={tag} className={formStyles.tag}>
                {tag}
                <span
                  className={formStyles.tagRemove}
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  role="button"
                  aria-label={`Remove ${tag}`}
                >
                  <X size={11} />
                </span>
              </span>
            ))}
            <input
              ref={tagInputRef}
              className={formStyles.tagRawInput}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
              placeholder={tags.length === 0 ? 'Add tags…' : ''}
            />
          </div>
          <span className={formStyles.hint}>Press Enter or comma to add a tag</span>
        </div>

        {/* Consumable toggle */}
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
            Consumable — track stock level
          </label>
        </div>

        {/* Minimum stock — shown only when consumable */}
        {isConsumable && (
          <div className={formStyles.subSection}>
            <div className={formStyles.field}>
              <label htmlFor="minQty">Minimum stock</label>
              <input
                id="minQty"
                type="number"
                min="0"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                placeholder="e.g. 2"
              />
              <span className={formStyles.hint}>
                Item appears in Shop when quantity drops below this value.
              </span>
            </div>
          </div>
        )}

        <div className={formStyles.actions}>
          {isEdit && (
            <button
              type="button"
              className={formStyles.deleteBtn}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '…' : 'Delete'}
            </button>
          )}
          <button type="submit" className={formStyles.submitBtn} disabled={isSaving}>
            {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
