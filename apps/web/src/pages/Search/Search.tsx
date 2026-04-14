import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronRight, Package, SearchIcon } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useDebounce, useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import styles from './Search.module.css';

interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  containerId: string | null;
  roomId: string;
  quantity: number;
  icon: string | null;
  isConsumable: boolean;
  roomName: string;
  containerName: string | null;
}

interface ContainerGroup {
  containerId: string | null;
  containerName: string | null;
  items: SearchResult[];
}

interface RoomGroup {
  roomId: string;
  roomName: string;
  containers: ContainerGroup[];
}

function groupResults(results: SearchResult[]): RoomGroup[] {
  const roomMap = new Map<string, RoomGroup>();

  for (const item of results) {
    if (!roomMap.has(item.roomId)) {
      roomMap.set(item.roomId, {
        roomId: item.roomId,
        roomName: item.roomName,
        containers: [],
      });
    }
    const room = roomMap.get(item.roomId)!;

    const containerKey = item.containerId ?? '__no_container__';
    let group = room.containers.find(
      (c) => (c.containerId ?? '__no_container__') === containerKey,
    );
    if (!group) {
      group = {
        containerId: item.containerId,
        containerName: item.containerName,
        items: [],
      };
      room.containers.push(group);
    }
    group.items.push(item);
  }

  return [...roomMap.values()];
}

export function SearchPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  const { data: results, isLoading } = useApi<SearchResult[]>(
    (signal) =>
      debouncedQuery.length >= 2
        ? api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`, signal)
        : Promise.resolve([]),
    [debouncedQuery],
  );

  const grouped = groupResults(results ?? []);

  return (
    <Layout title={t('search.title')}>
      <div className={styles.searchBox}>
        <SearchIcon size={18} className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {isLoading && query.length >= 2 && <p className={styles.hint}>{t('search.searching')}</p>}

      {!isLoading && debouncedQuery.length >= 2 && results?.length === 0 && (
        <p className={styles.hint}>{t('search.noResults', { query: debouncedQuery })}</p>
      )}

      {query.length < 2 && (
        <p className={styles.hint}>{t('search.hint')}</p>
      )}

      <div className={styles.tree}>
        {grouped.map((room) => (
          <div key={room.roomId} className={styles.roomGroup}>
            {/* Room header */}
            <div className={styles.roomHeader}>
              <span className={styles.roomLabel}>{room.roomName}</span>
            </div>

            {room.containers.map((group) => (
              <div key={group.containerId ?? '__none__'} className={styles.containerGroup}>
                {/* Container breadcrumb (only shown if there's a container) */}
                {group.containerId && (
                  <div className={styles.containerBreadcrumb}>
                    <ChevronRight size={12} className={styles.breadcrumbSep} />
                    <span className={styles.containerLabel}>{group.containerName}</span>
                  </div>
                )}

                {/* Items */}
                {group.items.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemIcon}>
                      {item.icon ? (
                        <span className={styles.itemEmoji}>{item.icon}</span>
                      ) : (
                        <Package size={14} />
                      )}
                    </div>

                    <div className={styles.itemBody}>
                      <span className={styles.itemName}>{item.name}</span>
                      {item.description && (
                        <span className={styles.itemDesc}>{item.description}</span>
                      )}
                    </div>

                    <span className={styles.itemQty}>{item.quantity}</span>

                    {/* Navigate to container */}
                    {group.containerId && (
                      <button
                        className={styles.navigateBtn}
                        onClick={() => navigate(`/containers/${group.containerId}`)}
                        aria-label={`Go to container ${group.containerName}`}
                        title={`Open in ${group.containerName}`}
                      >
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Layout>
  );
}
