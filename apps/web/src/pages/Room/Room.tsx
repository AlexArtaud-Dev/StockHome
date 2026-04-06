import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Edit2, Plus } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Container, Room } from '@stockhome/shared';
import { ContainerForm } from './ContainerForm';
import { RoomForm } from '../Home/RoomForm';
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
  const [showCreateContainer, setShowCreateContainer] = useState(false);
  const [editContainer, setEditContainer] = useState<Container | null>(null);
  const [showEditRoom, setShowEditRoom] = useState(false);

  const { data: room, refetch: refetchRoom } = useApi<Room>(
    (signal) => api.get(`/rooms/${id!}`, signal),
    [id],
  );

  const { data: containers, isLoading, error, refetch } = useApi<Container[]>(
    (signal) => api.get(`/containers?roomId=${id!}`, signal),
    [id],
  );

  return (
    <Layout
      title={room?.name ?? 'Room'}
      showBack
      actions={
        <>
          <button
            className={styles.iconBtn}
            onClick={() => setShowEditRoom(true)}
            aria-label="Edit room"
          >
            <Edit2 size={18} />
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => setShowCreateContainer(true)}
            aria-label="Add container"
          >
            <Plus size={20} />
          </button>
        </>
      }
    >
      {isLoading && <p className={styles.loading}>Loading…</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {!isLoading && !error && containers?.length === 0 && (
        <div className={styles.empty}>
          <p>No containers yet.</p>
          <button className={styles.emptyLink} onClick={() => setShowCreateContainer(true)}>
            Add your first container
          </button>
        </div>
      )}

      <div className={styles.list}>
        {containers?.map((container) => (
          <div key={container.id} className={styles.row}>
            <Link to={`/containers/${container.id}`} className={styles.containerCard}>
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
            <button
              className={styles.editBtn}
              onClick={() => setEditContainer(container)}
              aria-label={`Edit ${container.name}`}
            >
              <Edit2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {showCreateContainer && id && (
        <ContainerForm
          roomId={id}
          onClose={() => setShowCreateContainer(false)}
          onSaved={refetch}
        />
      )}
      {editContainer && id && (
        <ContainerForm
          roomId={id}
          container={editContainer}
          onClose={() => setEditContainer(null)}
          onSaved={refetch}
        />
      )}
      {showEditRoom && room && (
        <RoomForm
          room={room}
          onClose={() => setShowEditRoom(false)}
          onSaved={() => { refetchRoom(); refetch(); }}
        />
      )}
    </Layout>
  );
}
