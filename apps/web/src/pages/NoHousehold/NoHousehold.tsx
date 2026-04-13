import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { api, ApiError } from '../../services/api';
import { Household, HouseholdInvitation } from '@stockhome/shared';
import styles from './NoHousehold.module.css';

export function NoHouseholdPage() {
  const { user, logout } = useAuth();
  const { refreshHouseholds } = useHousehold();

  const [tab, setTab] = useState<'create' | 'join'>('create');

  // Create form
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join / pending invitations
  const [invitations, setInvitations] = useState<HouseholdInvitation[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setInvitesLoading(true);
    api.get<HouseholdInvitation[]>('/invitations/pending')
      .then(setInvitations)
      .catch(() => {})
      .finally(() => setInvitesLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await api.post<Household>('/households', { name });
      await refreshHouseholds();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create household');
    } finally {
      setCreating(false);
    }
  }

  async function handleAccept(invitationId: string) {
    setActionError(null);
    setActionLoading(invitationId);
    try {
      await api.post(`/invitations/${invitationId}/accept`);
      await refreshHouseholds();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to accept invitation');
      setActionLoading(null);
    }
  }

  async function handleDecline(invitationId: string) {
    setActionError(null);
    setActionLoading(invitationId);
    try {
      await api.post(`/invitations/${invitationId}/decline`);
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to decline invitation');
    } finally {
      setActionLoading(null);
    }
  }

  const displayName = user?.firstName ?? user?.displayName ?? user?.username ?? '';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>StockHome</div>
        <h1 className={styles.title}>No household yet</h1>
        {displayName && (
          <p className={styles.subtitle}>Hi {displayName}! Create a new household or join an existing one.</p>
        )}
        {!displayName && (
          <p className={styles.subtitle}>Create a new household or join an existing one.</p>
        )}

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${tab === 'create' ? styles.tabActive : ''}`}
            onClick={() => { setTab('create'); setCreateError(null); }}
          >
            Create one
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === 'join' ? styles.tabActive : ''}`}
            onClick={() => { setTab('join'); setActionError(null); }}
          >
            Join one
            {invitations.length > 0 && (
              <span className={styles.badge}>{invitations.length}</span>
            )}
          </button>
        </div>

        {tab === 'create' && (
          <form className={styles.form} onSubmit={handleCreate}>
            {createError && <div className={styles.error}>{createError}</div>}
            <div className={styles.field}>
              <label htmlFor="householdName">Household name</label>
              <input
                id="householdName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Our Flat, Smith Family…"
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={creating}>
              {creating ? 'Creating…' : 'Create household'}
            </button>
          </form>
        )}

        {tab === 'join' && (
          <div className={styles.joinSection}>
            {actionError && <div className={styles.error}>{actionError}</div>}
            {invitesLoading && <p className={styles.hint}>Loading invitations…</p>}
            {!invitesLoading && invitations.length === 0 && (
              <div className={styles.noInvites}>
                <p>No pending invitations.</p>
                <p className={styles.hint}>
                  Ask a household owner to invite you by email from their Account page.
                </p>
              </div>
            )}
            {!invitesLoading && invitations.map((inv) => (
              <div key={inv.id} className={styles.inviteCard}>
                <div className={styles.inviteInfo}>
                  <span className={styles.inviteHousehold}>{inv.householdName}</span>
                  <span className={styles.inviteBy}>invited by {inv.inviterName}</span>
                </div>
                <div className={styles.inviteActions}>
                  <button
                    type="button"
                    className={styles.acceptBtn}
                    onClick={() => handleAccept(inv.id)}
                    disabled={actionLoading === inv.id}
                  >
                    {actionLoading === inv.id ? '…' : 'Accept'}
                  </button>
                  <button
                    type="button"
                    className={styles.declineBtn}
                    onClick={() => handleDecline(inv.id)}
                    disabled={actionLoading === inv.id}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="button" className={styles.logoutBtn} onClick={logout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
