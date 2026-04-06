import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Room } from '@stockhome/shared';
import styles from './Home.module.css';

export function HomePage() {
  const { data: rooms, isLoading, error } = useApi<Room[]>(
    (signal) => api.get('/rooms', signal),
  );

  return (
    <Layout
      title="StockHome"
      actions={
        <Link to="/rooms/new" className={styles.addBtn} aria-label="Add room">
          <Plus size={20} />
        </Link>
      }
    >
      {isLoading && <p className={styles.loading}>Loading…</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {!isLoading && !error && rooms?.length === 0 && (
        <div className={styles.empty}>
          <p>No rooms yet.</p>
          <Link to="/rooms/new" className={styles.emptyLink}>
            Add your first room
          </Link>
        </div>
      )}

      <div className={styles.grid}>
        {rooms?.map((room) => (
          <Link key={room.id} to={`/rooms/${room.id}`} className={styles.roomCard}>
            <div
              className={styles.roomColor}
              style={{ backgroundColor: room.color ?? 'var(--color-primary)' }}
            />
            <div className={styles.roomName}>{room.name}</div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
