import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Room } from '@stockhome/shared';
import { RoomForm } from './RoomForm';
import styles from './Home.module.css';

export function HomePage() {
  const { data: rooms, isLoading, error, refetch } = useApi<Room[]>(
    (signal) => api.get('/rooms', signal),
  );
  const [showCreate, setShowCreate] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);

  return (
    <Layout
      title="StockHome"
      actions={
        <button
          className={styles.addBtn}
          onClick={() => setShowCreate(true)}
          aria-label="Add room"
        >
          <Plus size={20} />
        </button>
      }
    >
      {isLoading && <p className={styles.loading}>Loading…</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {!isLoading && !error && rooms?.length === 0 && (
        <div className={styles.empty}>
          <p>No rooms yet.</p>
          <button className={styles.emptyLink} onClick={() => setShowCreate(true)}>
            Add your first room
          </button>
        </div>
      )}

      <div className={styles.grid}>
        {rooms?.map((room) => (
          <div key={room.id} className={styles.roomWrapper}>
            <Link to={`/rooms/${room.id}`} className={styles.roomCard}>
              <div
                className={styles.roomColor}
                style={{ backgroundColor: room.color ?? 'var(--color-primary)' }}
              />
              <div className={styles.roomName}>{room.name}</div>
            </Link>
            <button
              className={styles.editBtn}
              onClick={() => setEditRoom(room)}
              aria-label={`Edit ${room.name}`}
            >
              ···
            </button>
          </div>
        ))}
      </div>

      {showCreate && (
        <RoomForm onClose={() => setShowCreate(false)} onSaved={refetch} />
      )}
      {editRoom && (
        <RoomForm
          room={editRoom}
          onClose={() => setEditRoom(null)}
          onSaved={refetch}
        />
      )}
    </Layout>
  );
}
