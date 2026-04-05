import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Container, Room } from '@stockhome/shared';
import styles from './Room.module.css';

const CONTAINER_TYPE_ICONS: Record<string, string> = {
  box: '📦',
  shelf: '🗄️',
  drawer: '🗂️',
  bag: '👜',
  other: '📁',
};

export function RoomPage() {
  const { id } = useParams<{ id: string }>();

  const { data: room } = useApi<Room>(
    (signal) => api.get(`/rooms/${id!}`, signal),
    [id],
  );

  const { data: containers, isLoading, error } = useApi<Container[]>(
    (signal) => api.get(`/containers?roomId=${id!}`, signal),
    [id],
  );

  return (
    <Layout
      title={room?.name ?? 'Room'}
      showBack
      actions={
        <Link
          to={`/containers/new?roomId=${id!}`}
          className={styles.addBtn}
          aria-label="Add container"
        >
          <Plus size={20} />
        </Link>
      }
    >
      {isLoading && <p className={styles.loading}>Loading…</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {!isLoading && !error && containers?.length === 0 && (
        <div className={styles.empty}>
          <p>No containers yet.</p>
          <Link to={`/containers/new?roomId=${id!}`} className={styles.emptyLink}>
            Add your first container
          </Link>
        </div>
      )}

      <div className={styles.list}>
        {containers?.map((container) => (
          <Link
            key={container.id}
            to={`/containers/${container.id}`}
            className={styles.containerCard}
          >
            <span className={styles.containerIcon}>
              {CONTAINER_TYPE_ICONS[container.type] ?? '📁'}
            </span>
            <div className={styles.containerInfo}>
              <span className={styles.containerName}>{container.name}</span>
              {container.description && (
                <span className={styles.containerDesc}>{container.description}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
