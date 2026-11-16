'use client';

import { Heart } from 'lucide-react';
import MusicTasteEditor from '../../components/music-taste-editor';
import styles from '../dashboard.module.css';

interface ProfileTabProps {
  displayName: string;
  email: string;
  favoriteCount: number;
  getToken: () => Promise<string | null>;
  linkGoogle: () => Promise<void>;
  addPassword: (password: string) => Promise<void>;
  newPassword: string;
  setNewPassword: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
}

export function ProfileTab({ displayName, email, favoriteCount, getToken, linkGoogle, addPassword, newPassword, setNewPassword, message, setMessage }: ProfileTabProps) {
  return (
    <section aria-labelledby="profile-title">
      <header className={styles.pageHead}><div><p className={styles.eyebrow}>Your account and preferences</p><h1 className={styles.pageTitle} id="profile-title">Your Profile<em>.</em></h1></div><span className={styles.topAvatar}>{displayName.charAt(0).toUpperCase()}</span></header>
      <div className={styles.profileGrid}>
        <section className={styles.card} aria-label="Account information">
          <span className={styles.avatar} aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
          <h2 className={styles.profileName}>{displayName}</h2><p className={styles.profileEmail}>{email}</p>
          <span className={`${styles.favoriteBadge} mt-5 inline-flex items-center gap-2 rounded-full bg-lime-200 px-3 py-2 text-sm font-semibold`}><Heart size={15} fill="currentColor" />{favoriteCount} Favorites</span>
        </section>
        <section className={styles.card} aria-labelledby="signin-title">
          <p className={styles.eyebrow}>Account security</p><h2 className="m-0 text-2xl font-bold tracking-tight" id="signin-title">Sign-in methods</h2>
          <p className={styles.profileDescription}>Link another method only after signing in to this account. Matching email addresses are never linked automatically.</p>
          {message && <p className={styles.status} role="status">{message}</p>}
          <div className={styles.settingsForm}>
            <button type="button" className={styles.buttonSecondary} onClick={async () => { setMessage(''); try { await linkGoogle(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not link Google.'); } }}>Link Google account</button>
            <form className="flex min-w-0 flex-1 gap-2" onSubmit={async (event) => { event.preventDefault(); setMessage(''); try { await addPassword(newPassword); setNewPassword(''); setMessage('Password added to this account.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not add password.'); } }}>
              <input className={styles.input} type="password" minLength={10} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Add a password (10+ characters)" autoComplete="new-password" aria-label="New password, at least 10 characters" />
              <button className={styles.buttonPrimary} type="submit">Add password</button>
            </form>
          </div>
        </section>
      </div>
      <section className={`${styles.card} ${styles.tastePanel} mt-4`}>
        <p className={styles.eyebrow}>Personalize the mix</p><h2 className="m-0 text-2xl font-bold tracking-tight">Music taste</h2>
        <p className={styles.profileDescription}>Choose genres, artists, tracks, and languages to shape your recommendations.</p>
        <MusicTasteEditor getToken={getToken} />
      </section>
    </section>
  );
}
