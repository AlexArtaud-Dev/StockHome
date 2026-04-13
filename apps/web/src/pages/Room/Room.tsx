import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Edit2, FileDown, FileText, LayoutGrid, LayoutList, Plus, Square, X } from 'lucide-react';
import { Tooltip } from '../../components/Tooltip/Tooltip';
import { Layout } from '../../components/Layout/Layout';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Container, Room } from '@stockhome/shared';
import { ContainerForm } from './ContainerForm';
import { RoomForm } from '../Home/RoomForm';
import { TreeView } from './TreeView';
import { QrPdfModal } from './QrPdfModal';
import styles from './Room.module.css';

const CONTAINER_TYPE_ICONS: Record<string, string> = {
  box: '📦', shelf: '🗄️', drawer: '🗂️', bag: '👜', other: '📁',
};

export function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [showCreateContainer, setShowCreateContainer] = useState(false);
  const [editContainer, setEditContainer] = useState<Container | null>(null);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showQrPdf, setShowQrPdf] = useState(false);

  const { data: room, refetch: refetchRoom } = useApi<Room>(
    (signal) => api.get(`/rooms/${id!}`, signal),
    [id],
  );

  // Top-level containers for the grid view
  const { data: containers, isLoading, error, refetch } = useApi<Container[]>(
    (signal) => api.get(`/containers?roomId=${id!}&parentContainerId=none`, signal),
    [id],
  );

  // All containers in the room (for recursive PDF generation)
  const { data: allContainers } = useApi<Container[]>(
    (signal) => api.get(`/containers?roomId=${id!}`, signal),
    [id],
  );

  const roomTitle = room
    ? (room.icon ? `${room.icon} ${room.name}` : room.name)
    : 'Room';

  const hasSelection = selectedIds.size > 0;

  function toggleSelect(containerId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(containerId)) next.delete(containerId);
      else next.add(containerId);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return (
    <Layout
      title={roomTitle}
      showBack
      actions={
        <>
          <Tooltip content={viewMode === 'grid' ? t('room.treeView') : t('room.gridView')}>
            <button
              className={styles.iconBtn}
              onClick={() => { setViewMode(viewMode === 'grid' ? 'tree' : 'grid'); clearSelection(); }}
              aria-label={viewMode === 'grid' ? t('room.treeView') : t('room.gridView')}
            >
              {viewMode === 'grid' ? <LayoutList size={18} /> : <LayoutGrid size={18} />}
            </button>
          </Tooltip>
          <Tooltip content={t('room.editRoom')}>
            <button className={styles.iconBtn} onClick={() => setShowEditRoom(true)} aria-label={t('room.editRoom')}>
              <Edit2 size={18} />
            </button>
          </Tooltip>
          <Tooltip content={t('account.exportPdf')}>
            <button
              className={styles.iconBtn}
              aria-label={t('account.exportPdf')}
              onClick={() => {
                const link = document.createElement('a');
                link.href = `/api/v1/export/rooms/${id}/pdf`;
                link.download = `${room?.name ?? 'room'}.pdf`;
                link.click();
              }}
            >
              <FileDown size={18} />
            </button>
          </Tooltip>
          <Tooltip content={t('room.addContainer')}>
            <button className={styles.iconBtn} onClick={() => setShowCreateContainer(true)} aria-label={t('room.addContainer')}>
              <Plus size={20} />
            </button>
          </Tooltip>
        </>
      }
    >
      {viewMode === 'grid' && (
        <>
          {isLoading && <p className={styles.loading}>{t('common.loading')}</p>}
          {error && <p className={styles.errorMsg}>{error}</p>}

          {!isLoading && !error && containers?.length === 0 && (
            <div className={styles.empty}>
              <p>{t('room.noContainers')}</p>
              <button className={styles.emptyLink} onClick={() => setShowCreateContainer(true)}>
                {t('room.addFirstContainer')}
              </button>
            </div>
          )}

          <div className={styles.grid}>
            {containers?.map((container) => {
              const isSelected = selectedIds.has(container.id);
              return (
                <div key={container.id} className={styles.cardWrapper}>
                  <Link
                    to={`/containers/${container.id}`}
                    className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                    onClick={hasSelection ? (e) => toggleSelect(container.id, e) : undefined}
                  >
                    <span className={styles.cardIcon}>
                      {CONTAINER_TYPE_ICONS[container.type] ?? '📁'}
                    </span>
                    <div className={styles.cardBody}>
                      <span className={styles.cardName}>{container.name}</span>
                      {container.description && (
                        <span className={styles.cardDesc}>{container.description}</span>
                      )}
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardType}>{container.type}</span>
                    </div>
                  </Link>

                  {/* Selection checkbox — always visible when something selected, hover otherwise */}
                  <button
                    className={`${styles.selectBtn} ${isSelected ? styles.selectBtnActive : ''}`}
                    onClick={(e) => toggleSelect(container.id, e)}
                    aria-label={isSelected ? t('room.deselectContainer', { name: container.name }) : t('room.selectContainer', { name: container.name })}
                  >
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>

                  <button
                    className={styles.editBtn}
                    onClick={(e) => { e.preventDefault(); setEditContainer(container); }}
                    aria-label={t('room.editContainer', { name: container.name })}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {viewMode === 'tree' && id && <TreeView roomId={id} />}

      {/* Selection action bar */}
      {hasSelection && (
        <div className={styles.selectionBar}>
          <span className={styles.selectionCount}>
            {t('room.selected', { count: selectedIds.size })}
          </span>
          <div className={styles.selectionActions}>
            <button
              className={styles.selectionBtn}
              onClick={() => setShowQrPdf(true)}
            >
              <FileText size={15} />
              {t('room.qrLabels')}
            </button>
            <button
              className={styles.selectionClear}
              onClick={clearSelection}
              aria-label={t('room.clearSelection')}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {showCreateContainer && id && (
        <ContainerForm roomId={id} onClose={() => setShowCreateContainer(false)} onSaved={refetch} />
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
      {showQrPdf && id && (
        <QrPdfModal
          selectedIds={selectedIds}
          allContainers={allContainers ?? []}
          roomOrigin={window.location.origin}
          onClose={() => { setShowQrPdf(false); clearSelection(); }}
        />
      )}
    </Layout>
  );
}
