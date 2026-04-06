import React, { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { api, ApiError } from '../../services/api';
import { Room } from '@stockhome/shared';
import formStyles from '../../components/Form/Form.module.css';

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
  const isEdit = Boolean(room);
  const [name, setName] = useState(room?.name ?? '');
  const [color, setColor] = useState(room?.color ?? PRESET_COLORS[0]!);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      if (isEdit && room) {
        await api.patch(`/rooms/${room.id}`, { name, color });
      } else {
        await api.post('/rooms', { name, color });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save room');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!room) return;
    if (!window.confirm(`Delete "${room.name}"? All containers and items inside will also be deleted.`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/rooms/${room.id}`);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete room');
      setIsDeleting(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit room' : 'New room'} onClose={onClose}>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        {error && <div className={formStyles.error}>{error}</div>}

        <div className={formStyles.field}>
          <label htmlFor="roomName">Room name</label>
          <input
            id="roomName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Garage, Kitchen, Basement…"
            autoFocus
            required
          />
        </div>

        <div className={formStyles.field}>
          <label>Color</label>
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
            {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create room'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
