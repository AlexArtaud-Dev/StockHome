import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useDebounce } from '../../hooks/useApi';
import { useApi } from '../../hooks/useApi';
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
}

export function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: results, isLoading } = useApi<SearchResult[]>(
    (signal) =>
      debouncedQuery.length >= 2
        ? api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`, signal)
        : Promise.resolve([]),
    [debouncedQuery],
  );

  return (
    <Layout title="Search">
      <div className={styles.searchBox}>
        <SearchIcon size={18} className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search items…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {isLoading && query.length >= 2 && <p className={styles.hint}>Searching…</p>}

      {!isLoading && debouncedQuery.length >= 2 && results?.length === 0 && (
        <p className={styles.hint}>No results for "{debouncedQuery}"</p>
      )}

      {query.length < 2 && (
        <p className={styles.hint}>Type at least 2 characters to search</p>
      )}

      <div className={styles.results}>
        {results?.map((item) => (
          <Link
            key={item.id}
            to={`/items/${item.id}`}
            className={styles.resultRow}
          >
            <div className={styles.resultName}>{item.name}</div>
            {item.description && (
              <div className={styles.resultDesc}>{item.description}</div>
            )}
            <div className={styles.resultQty}>qty: {item.quantity}</div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
