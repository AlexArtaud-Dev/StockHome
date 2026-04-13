import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Edit2, Plus } from 'lucide-react';
import { Tooltip } from '../../components/Tooltip/Tooltip';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Room } from '@stockhome/shared';
import { RoomForm } from './RoomForm';
import styles from './Home.module.css';

export function HomePage() {
  const { t } = useTranslation();
  const { data: rooms, isLoading, error, refetch } = useApi<Room[]>(
    (signal) => api.get('/rooms', signal),
  );
  const [showCreate, setShowCreate] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);

  return (
    <Layout
      title="StockHome"
      actions={
        <Tooltip content={t('home.addRoom')}>
          <button
            className={styles.addBtn}
            onClick={() => setShowCreate(true)}
            aria-label={t('home.addRoom')}
          >
            <Plus size={20} />
          </button>
        </Tooltip>
      }
    >
      {isLoading && <p className={styles.loading}>{t('common.loading')}</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {!isLoading && !error && rooms?.length === 0 && (
        <div className={styles.empty}>
          <p>{t('home.noRooms')}</p>
          <button className={styles.emptyLink} onClick={() => setShowCreate(true)}>
            {t('home.addFirstRoom')}
          </button>
        </div>
      )}

      <div className={styles.grid}>
        {rooms?.map((room) => (
          <div key={room.id} className={styles.roomWrapper}>
            <Link to={`/rooms/${room.id}`} className={styles.roomCard}>
              {/* Hero — photo or colored swatch with big emoji */}
              <div
                className={styles.roomHero}
                style={
                  room.photoPath
                    ? { backgroundImage: `url(${room.photoPath})` }
                    : { backgroundColor: room.color ?? 'var(--color-primary)' }
                }
              >
                {!room.photoPath && room.icon && (
                  <span className={styles.roomHeroIcon}>{room.icon}</span>
                )}
              </div>
              <div className={styles.roomName}>{room.name}</div>
            </Link>
            <Tooltip content={t('home.addRoom')}>
              <button
                className={styles.editBtn}
                onClick={() => setEditRoom(room)}
                aria-label={`${t('common.edit')} ${room.name}`}
              >
                <Edit2 size={14} />
              </button>
            </Tooltip>
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
