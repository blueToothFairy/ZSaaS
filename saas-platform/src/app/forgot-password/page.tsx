'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FormEvent, useState } from 'react';
import styles from '../auth-pages.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try {
      const response = await fetch('/api/auth/password/forgot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || 'Could not submit your request. Please try again.');
      setMessage(result.message || 'If an account with a password exists for that email, a reset link will be sent shortly.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not submit your request. Please try again.'); }
    finally { setBusy(false); }
  };

  return <main className={styles.page}>
    <header className={styles.header}><Link href="/landing-page" className={styles.brand}><Image src="/assets/brand/vibetune_logo.png" alt="" width={34} height={34} /><span>VibeTune</span></Link><span className={styles.headerMark}>Sound culture / Issue 06</span></header>
    <div className={styles.layout}><section className={styles.panel} aria-labelledby="forgot-title">
      <Link href="/sign-in" className={styles.back}><ArrowLeft size={15} /> Back to sign in</Link>
      <p className={styles.eyebrow}>Account recovery</p><h1 className={styles.title} id="forgot-title">Reset your password.</h1>
      <p className={styles.description}>Enter the email for your account. If it has a password, we&apos;ll send a reset link.</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {message ? <p role="status" className={styles.success}>{message}</p> : <form onSubmit={submit} className={styles.form}>
        <label className={styles.field}>Email<input type="email" autoComplete="email" required maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} className={styles.input} /></label>
        <button disabled={busy} className={styles.submit}>{busy ? 'Sending…' : 'Send reset link'}</button>
      </form>}
      <p className={styles.footer}>Remember your password? <Link href="/sign-in">Sign in</Link></p>
    </section></div>
  </main>;
}
