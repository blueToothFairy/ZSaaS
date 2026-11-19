'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import styles from '../auth-pages.module.css';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setToken(new URLSearchParams(window.location.search).get('token') || ''); }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!token) { setError('This reset link is missing its token. Request a new link.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || 'Could not reset your password. Please request a new link.');
      setMessage(result.message || 'Your password has been reset. Please sign in.');
      setPassword(''); setConfirmPassword(''); setToken('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not reset your password. Please request a new link.'); }
    finally { setBusy(false); }
  };

  return <main className={styles.page}>
    <header className={styles.header}><Link href="/landing-page" className={styles.brand}><Image src="/assets/brand/vibetune_logo_v1.png" alt="" width={34} height={34} /><span>VibeTune</span></Link><span className={styles.headerMark}>Sound culture / Issue 06</span></header>
    <div className={styles.layout}><section className={styles.panel} aria-labelledby="reset-title">
      <Link href="/sign-in" className={styles.back}><ArrowLeft size={15} /> Back to sign in</Link>
      <p className={styles.eyebrow}>Account recovery</p><h1 className={styles.title} id="reset-title">Choose a new password.</h1>
      <p className={styles.description}>Use a password between 10 and 128 characters.</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {message ? <p role="status" className={styles.success}>{message} <Link href="/sign-in">Sign in</Link></p> : <form onSubmit={submit} className={styles.form}>
        <label className={styles.field}>New password<input type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} className={styles.input} /></label>
        <label className={styles.field}>Confirm new password<input type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={styles.input} /></label>
        <button disabled={busy || !token} className={styles.submit}>{busy ? 'Resetting…' : 'Reset password'}</button>
        {!token && <p className={styles.hint}>This link may be incomplete. <Link href="/forgot-password">Request a new one</Link>.</p>}
      </form>}
      <p className={styles.footer}><Link href="/forgot-password">Request another reset link</Link></p>
    </section></div>
  </main>;
}
