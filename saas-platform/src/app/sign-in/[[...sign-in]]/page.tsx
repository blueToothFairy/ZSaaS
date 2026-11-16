'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppAuth } from '../../auth-provider';
import styles from '../../auth-pages.module.css';

export default function SignInPage() {
  const { login, user, isLoaded } = useAppAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (isLoaded && user) router.replace('/home'); }, [isLoaded, user, router]);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    if (code === 'account_exists') setError('An account already uses this email. Sign in with that method first, then link Google from your account.');
    else if (code) setError('Google sign-in failed. Please try again.');
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try { await login(email, password); router.replace('/home'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Sign-in failed.'); }
    finally { setBusy(false); }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/landing-page" className={styles.brand}><Image src="/assets/brand/vibetune_logo.png" alt="" width={34} height={34} /><span>VibeTune</span></Link>
        <span className={styles.headerMark}>Sound culture / Issue 06</span>
      </header>
      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby="signin-title">
          <Link href="/landing-page" className={styles.back}><ArrowLeft size={15} /> Back to VibeTune</Link>
          <p className={styles.eyebrow}>Your personal soundspace</p>
          <h1 className={styles.title} id="signin-title">Welcome back.</h1>
          <p className={styles.description}>Sign in to continue to your soundtrack finder.</p>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <a href="/api/auth/google" className={styles.providerButton}>Continue with Google <ArrowUpRight size={16} /></a>
          <div className={styles.divider}>OR EMAIL</div>
          <form onSubmit={submit} className={styles.form}>
            <label className={styles.field}>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={styles.input} /></label>
            <label className={styles.field}>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={styles.input} /></label>
            <button disabled={busy} className={styles.submit}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <p className={styles.footer}>New to VibeTune? <Link href="/sign-up">Create an account</Link></p>
        </section>
      </div>
    </main>
  );
}
