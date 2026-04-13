import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { useTheme } from '../../context/ThemeContext';
import { api, ApiError } from '../../services/api';
import { Household, HouseholdInvitation } from '@stockhome/shared';
import styles from './Account.module.css';

export function AccountPage() {
  const { t, i18n } = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const { households, refreshHouseholds } = useHousehold();
  const { theme, setTheme } = useTheme();

  // Profile section
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Security section
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Households section
  const [pendingInvitations, setPendingInvitations] = useState<HouseholdInvitation[]>([]);
  const [creatingHousehold, setCreatingHousehold] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [newHouseholdType, setNewHouseholdType] = useState<Household['type']>('other');

  useEffect(() => {
    api.get<HouseholdInvitation[]>('/invitations/pending')
      .then((inv) => setPendingInvitations(inv))
      .catch(() => null);
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await api.patch('/users/me', { firstName, lastName });
      await refreshUser();
      setProfileMsg(t('common.save'));
    } catch {
      setProfileMsg(t('common.error'));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      await api.post('/users/me/change-password', { currentPassword, newPassword });
      setPasswordMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleCreateHousehold(e: React.FormEvent) {
    e.preventDefault();
    if (!newHouseholdName.trim()) return;
    try {
      await api.post('/households', { name: newHouseholdName, type: newHouseholdType });
      setNewHouseholdName('');
      setCreatingHousehold(false);
      await refreshHouseholds();
    } catch {
      // ignore
    }
  }

  async function handleLeave(householdId: string) {
    const h = households.find((hh) => hh.id === householdId);
    if (!h) return;
    if (!window.confirm(t('account.confirmLeave', { name: h.name }))) return;
    try {
      await api.post(`/households/${householdId}/leave`, {});
      await refreshHouseholds();
    } catch {
      // ignore
    }
  }

  async function handleAccept(invitationId: string) {
    try {
      await api.post(`/invitations/${invitationId}/accept`, {});
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      await refreshHouseholds();
    } catch {
      // ignore
    }
  }

  async function handleDecline(invitationId: string) {
    try {
      await api.post(`/invitations/${invitationId}/decline`, {});
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch {
      // ignore
    }
  }

  const HOUSEHOLD_TYPES: Array<{ value: Household['type']; label: string }> = [
    { value: 'house', label: t('household.types.house') },
    { value: 'flat', label: t('household.types.flat') },
    { value: 'apartment', label: t('household.types.apartment') },
    { value: 'studio', label: t('household.types.studio') },
    { value: 'garage', label: t('household.types.garage') },
    { value: 'office', label: t('household.types.office') },
    { value: 'storage', label: t('household.types.storage') },
    { value: 'other', label: t('household.types.other') },
  ];

  return (
    <Layout title={t('account.title')}>
      {/* Profile */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('account.profileSection')}</h2>
        <form onSubmit={handleSaveProfile} className={styles.form}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="firstName">{t('account.firstName')}</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="lastName">{t('account.lastName')}</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label>{t('account.email')}</label>
            <input type="email" value={user?.email ?? ''} disabled className={styles.disabled} />
          </div>
          <div className={styles.field}>
            <label>{t('account.username')}</label>
            <input type="text" value={user?.username ?? ''} disabled className={styles.disabled} />
            <span className={styles.hint}>{t('account.usernameHint')}</span>
          </div>
          {profileMsg && <p className={styles.successMsg}>{profileMsg}</p>}
          <button type="submit" className={styles.saveBtn} disabled={profileSaving}>
            {profileSaving ? t('common.saving') : t('account.saveProfile')}
          </button>
        </form>
      </section>

      {/* Security */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('account.securitySection')}</h2>
        <form onSubmit={handleChangePassword} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="currentPwd">{t('account.currentPassword')}</label>
            <input
              id="currentPwd"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="newPwd">{t('account.newPassword')}</label>
            <input
              id="newPwd"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="confirmPwd">{t('account.confirmPassword')}</label>
            <input
              id="confirmPwd"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {passwordError && <p className={styles.errorMsg}>{passwordError}</p>}
          {passwordMsg && <p className={styles.successMsg}>{passwordMsg}</p>}
          <button type="submit" className={styles.saveBtn} disabled={passwordSaving}>
            {passwordSaving ? t('common.saving') : t('account.changePassword')}
          </button>
        </form>
      </section>

      {/* Households */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('account.householdsSection')}</h2>
        {households.length === 0 && (
          <p className={styles.emptyText}>{t('account.noHouseholds')}</p>
        )}
        <div className={styles.householdList}>
          {households.map((h) => (
            <div key={h.id} className={styles.householdRow}>
              <div className={styles.householdInfo}>
                <span className={styles.householdName}>{h.name}</span>
                <span className={styles.householdMeta}>
                  {t(`household.types.${h.type}`)}
                  {' · '}
                  <span className={styles.badge}>
                    {h.isOwner ? t('account.ownerBadge') : t('account.memberBadge')}
                  </span>
                </span>
              </div>
              {!h.isOwner && (
                <button
                  className={styles.leaveBtn}
                  onClick={() => handleLeave(h.id)}
                >
                  {t('account.leaveHousehold')}
                </button>
              )}
            </div>
          ))}
        </div>

        {!creatingHousehold ? (
          <button className={styles.newHouseholdBtn} onClick={() => setCreatingHousehold(true)}>
            {t('household.createNew')}
          </button>
        ) : (
          <form onSubmit={handleCreateHousehold} className={styles.newHouseholdForm}>
            <div className={styles.field}>
              <input
                type="text"
                placeholder={t('household.namePlaceholder')}
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className={styles.field}>
              <select
                value={newHouseholdType}
                onChange={(e) => setNewHouseholdType(e.target.value as Household['type'])}
              >
                {HOUSEHOLD_TYPES.map((ht) => (
                  <option key={ht.value} value={ht.value}>{ht.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.formRow}>
              <button type="submit" className={styles.saveBtn}>{t('household.createBtn')}</button>
              <button type="button" className={styles.cancelBtn} onClick={() => setCreatingHousehold(false)}>{t('common.cancel')}</button>
            </div>
          </form>
        )}
      </section>

      {/* Invitations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('account.invitationsSection')}</h2>
        {pendingInvitations.length === 0 ? (
          <p className={styles.emptyText}>{t('account.noPendingInvites')}</p>
        ) : (
          <div className={styles.invitationList}>
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className={styles.invitationRow}>
                <span className={styles.inviteFrom}>
                  {t('account.inviteFrom', { householdName: inv.householdName, inviterName: inv.inviterName })}
                </span>
                <div className={styles.inviteActions}>
                  <button className={styles.acceptBtn} onClick={() => handleAccept(inv.id)}>{t('account.accept')}</button>
                  <button className={styles.declineBtn} onClick={() => handleDecline(inv.id)}>{t('account.decline')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Preferences */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('account.preferencesSection')}</h2>
        <div className={styles.prefRow}>
          <span className={styles.prefLabel}>{t('settings.theme')}</span>
          <div className={styles.btnGroup}>
            {(['light', 'dark', 'system'] as const).map((themeOpt) => (
              <button
                key={themeOpt}
                className={`${styles.toggleBtn} ${theme === themeOpt ? styles.active : ''}`}
                onClick={() => setTheme(themeOpt)}
              >
                {t(`settings.${themeOpt}`)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.prefRow}>
          <span className={styles.prefLabel}>{t('settings.language')}</span>
          <div className={styles.btnGroup}>
            {(['en', 'fr'] as const).map((lang) => (
              <button
                key={lang}
                className={`${styles.toggleBtn} ${i18n.language.startsWith(lang) ? styles.active : ''}`}
                onClick={() => i18n.changeLanguage(lang)}
              >
                {lang === 'en' ? t('settings.english') : t('settings.french')}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sign out */}
      <section className={styles.section}>
        <button className={styles.logoutBtn} onClick={logout}>
          Sign out
        </button>
      </section>
    </Layout>
  );
}
