import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, UserMinus } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { api, ApiError } from '../../services/api';
import styles from './Members.module.css';

interface Member {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string;
  joinedAt: string;
  isOwner: boolean;
}

export function MembersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedHousehold, refreshHouseholds } = useHousehold();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const householdId = selectedHousehold?.id;
  const isOwner = selectedHousehold?.isOwner ?? false;

  useEffect(() => {
    if (!householdId) return;
    setLoading(true);
    api.get<Member[]>(`/households/${householdId}/members`)
      .then(setMembers)
      .catch(() => setError('Failed to load members'))
      .finally(() => setLoading(false));
  }, [householdId]);

  async function handleRemove(memberId: string, memberName: string) {
    if (!householdId) return;
    if (!window.confirm(`Remove ${memberName} from this household?`)) return;
    setRemovingId(memberId);
    try {
      await api.delete(`/households/${householdId}/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      await refreshHouseholds();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId) return;
    setInviteStatus('sending');
    setInviteError(null);
    try {
      await api.post(`/households/${householdId}/invite`, { email: inviteEmail });
      setInviteStatus('sent');
      setInviteEmail('');
    } catch (err) {
      setInviteStatus('error');
      setInviteError(err instanceof ApiError ? err.message : t('common.error'));
    }
  }

  function getMemberDisplay(m: Member) {
    if (m.firstName || m.lastName) return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
    return m.displayName ?? m.username;
  }

  return (
    <Layout title={t('members.title')} showBack>
      {loading ? (
        <p className={styles.hint}>{t('common.loading')}</p>
      ) : error ? (
        <p className={styles.errorMsg}>{error}</p>
      ) : (
        <>
          {/* Member list */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('members.currentMembers')}</h2>
            <div className={styles.memberList}>
              {members.map((m) => (
                <div key={m.id} className={styles.memberRow}>
                  <div className={styles.avatar}>
                    {(getMemberDisplay(m)[0] ?? '?').toUpperCase()}
                  </div>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>
                      {getMemberDisplay(m)}
                      {m.isOwner && <span className={styles.ownerBadge}>{t('members.owner')}</span>}
                      {m.id === user?.id && !m.isOwner && <span className={styles.youBadge}>{t('members.you')}</span>}
                    </span>
                    <span className={styles.memberEmail}>{m.email}</span>
                    <span className={styles.memberSince}>
                      {t('members.joinedAt', { date: new Date(m.joinedAt).toLocaleDateString() })}
                    </span>
                  </div>
                  {isOwner && !m.isOwner && (
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemove(m.id, getMemberDisplay(m))}
                      disabled={removingId === m.id}
                      aria-label={t('members.removeMember')}
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Invite new member */}
          {isOwner && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('members.inviteSection')}</h2>
              <form className={styles.inviteForm} onSubmit={handleInvite}>
                <div className={styles.inviteRow}>
                  <input
                    type="email"
                    className={styles.inviteInput}
                    placeholder={t('household.inviteEmailPlaceholder')}
                    value={inviteEmail}
                    onChange={(e) => { setInviteEmail(e.target.value); setInviteStatus('idle'); }}
                    required
                  />
                  <button
                    type="submit"
                    className={styles.inviteBtn}
                    disabled={inviteStatus === 'sending'}
                    title={inviteStatus === 'sending' ? t('household.sending') : t('household.sendInvite')}
                    aria-label={inviteStatus === 'sending' ? t('household.sending') : t('household.sendInvite')}
                  >
                    <Send size={18} />
                  </button>
                </div>
                {inviteStatus === 'sent' && (
                  <p className={styles.successMsg}>{t('household.inviteSent')}</p>
                )}
                {inviteStatus === 'error' && (
                  <p className={styles.errorMsg}>{inviteError}</p>
                )}
              </form>
            </section>
          )}
        </>
      )}
    </Layout>
  );
}
