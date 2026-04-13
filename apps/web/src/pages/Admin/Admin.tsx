import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/Layout/Layout';
import { api, ApiError } from '../../services/api';
import { AdminUser } from '@stockhome/shared';
import styles from './Admin.module.css';

export function AdminPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers(q?: string) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get<AdminUser[]>(`/admin/users${q ? `?search=${encodeURIComponent(q)}` : ''}`);
      setUsers(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }

  async function doAction(userId: string, action: string) {
    setActionResult(null);
    try {
      const result = await api.post<{ temporaryPassword?: string; message?: string }>(
        `/admin/users/${userId}/${action}`,
        {},
      );
      if (result?.message) {
        setActionResult(result.message);
      }
      await loadUsers(search);
    } catch (err) {
      setActionResult(err instanceof ApiError ? err.message : t('common.error'));
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearch(val);
    void loadUsers(val || undefined);
  }

  return (
    <Layout title={t('admin.title')}>
      {actionResult && (
        <div className={styles.actionResult} onClick={() => setActionResult(null)}>
          {actionResult}
        </div>
      )}

      <div className={styles.searchBox}>
        <input
          type="search"
          placeholder={t('admin.search')}
          value={search}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
      </div>

      {isLoading && <p className={styles.loading}>{t('common.loading')}</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {!isLoading && !error && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('admin.colName')}</th>
                <th>{t('admin.colEmail')}</th>
                <th>{t('admin.colUsername')}</th>
                <th>{t('admin.colStatus')}</th>
                <th>{t('admin.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.displayName ?? (`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—')}</td>
                  <td>{u.email ?? '—'}</td>
                  <td>@{u.username}</td>
                  <td>
                    <div className={styles.tags}>
                      {u.isAdmin && <span className={`${styles.tag} ${styles.tagAdmin}`}>{t('admin.tagAdmin')}</span>}
                      {u.isEmailVerified && <span className={`${styles.tag} ${styles.tagVerified}`}>{t('admin.tagVerified')}</span>}
                      {u.isBanned && <span className={`${styles.tag} ${styles.tagBanned}`}>{t('admin.tagBanned')}</span>}
                      {!u.isEmailVerified && <span className={`${styles.tag} ${styles.tagUnverified}`}>{t('admin.tagUnverified')}</span>}
                    </div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {u.isBanned ? (
                        <button className={styles.actionBtn} onClick={() => doAction(u.id, 'unban')}>{t('admin.actionUnban')}</button>
                      ) : (
                        <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => doAction(u.id, 'ban')}>{t('admin.actionBan')}</button>
                      )}
                      {!u.isEmailVerified && (
                        <button className={styles.actionBtn} onClick={() => doAction(u.id, 'resend-confirmation')}>{t('admin.actionResend')}</button>
                      )}
                      {u.isAdmin ? (
                        <button className={styles.actionBtn} onClick={() => doAction(u.id, 'demote')}>{t('admin.actionDemote')}</button>
                      ) : (
                        <button className={styles.actionBtn} onClick={() => doAction(u.id, 'promote')}>{t('admin.actionPromote')}</button>
                      )}
                      <button className={styles.actionBtn} onClick={() => doAction(u.id, 'reset-password')}>{t('admin.actionResetPassword')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
