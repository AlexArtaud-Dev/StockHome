import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Smile, X } from 'lucide-react';
import { EmojiPickerPortal } from '../../components/EmojiPickerPortal/EmojiPickerPortal';
import { Modal } from '../../components/Modal/Modal';
import { api, ApiError } from '../../services/api';
import { Room } from '@stockhome/shared';
import formStyles from '../../components/Form/Form.module.css';
import styles from './RoomForm.module.css';

const PRESET_COLORS = [
  '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
  '#475569', '#78716c',
];

interface Props {
  room?: Room;
  onClose: () => void;
  onSaved: () => void;
}

export function RoomForm({ room, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const isEdit = Boolean(room);
  const [name, setName] = useState(room?.name ?? '');
  const [color, setColor] = useState(room?.color ?? PRESET_COLORS[0]!);
  const [icon, setIcon] = useState<string>(room?.icon ?? '');
  const [photoPath, setPhotoPath] = useState<string | null>(room?.photoPath ?? null);
  const [showPicker, setShowPicker] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.postForm<{ path: string }>('/upload/photo', form);
      setPhotoPath(res.path);
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const payload = { name, color, icon: icon || null, photoPath: photoPath ?? null };
      if (isEdit && room) {
        await api.patch(`/rooms/${room.id}`, payload);
      } else {
        await api.post('/rooms', payload);
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
    if (!room) return;
    if (!window.confirm(t('roomForm.confirmDelete', { name: room.name }))) return;
    setIsDeleting(true);
    try {
      await api.delete(`/rooms/${room.id}`);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
      setIsDeleting(false);
    }
  }

  async function handleDuplicate() {
    if (!room) return;
    setIsDuplicating(true);
    try {
      await api.post(`/rooms/${room.id}/duplicate`, {});
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
      setIsDuplicating(false);
    }
  }

  return (
    <Modal title={isEdit ? t('roomForm.editTitle') : t('roomForm.newTitle')} onClose={onClose}>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        {error && <div className={formStyles.error}>{error}</div>}

        <div className={formStyles.field}>
          <label htmlFor="roomName">{t('roomForm.name')}</label>
          <input
            id="roomName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('roomForm.namePlaceholder')}
            autoFocus
            required
          />
        </div>

        {/* Photo upload */}
        <div className={formStyles.field}>
          <label>{t('roomForm.photo')} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>{t('common.optional')}</span></label>
          <div className={styles.photoRow}>
            {photoPath && (
              <div className={styles.photoPreview}>
                <img src={photoPath} alt="Room photo" className={styles.photoImg} />
                <button
                  type="button"
                  className={styles.photoRemove}
                  onClick={() => setPhotoPath(null)}
                  aria-label="Remove photo"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <button
              type="button"
              className={styles.photoUploadBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? t('common.uploading') : photoPath ? t('roomForm.changePhoto') : t('roomForm.uploadPhoto')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />
          </div>
        </div>

        {/* Emoji picker */}
        <div className={formStyles.field}>
          <label>{t('roomForm.icon')} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>{t('common.optional')}</span></label>
          <div className={styles.emojiRow}>
            <button
              ref={emojiButtonRef}
              type="button"
              className={`${styles.emojiBtn} ${icon ? styles.emojiBtnActive : ''}`}
              onClick={() => setShowPicker((v) => !v)}
            >
              {icon ? (
                <span className={styles.emojiDisplay}>{icon}</span>
              ) : (
                <Smile size={18} style={{ color: 'var(--color-text-muted)' }} />
              )}
              <span className={styles.emojiBtnLabel}>{icon ? t('roomForm.changeIcon') : t('roomForm.pickIcon')}</span>
            </button>
            {icon && (
              <button
                type="button"
                className={styles.emojiClear}
                onClick={() => { setIcon(''); setShowPicker(false); }}
                aria-label="Remove icon"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {showPicker && emojiButtonRef.current && (
            <EmojiPickerPortal
              anchor={emojiButtonRef.current}
              onSelect={setIcon}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>

        {/* Color */}
        <div className={formStyles.field}>
          <label>{t('roomForm.color')}</label>
          <div className={formStyles.colorRow}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`${formStyles.colorSwatch} ${color === c ? formStyles.selected : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
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
            {isSaving ? t('common.saving') : isEdit ? t('common.save') : t('roomForm.createBtn')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
