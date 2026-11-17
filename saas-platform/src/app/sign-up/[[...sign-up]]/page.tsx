'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppAuth } from '../../auth-provider';
import styles from '../../auth-pages.module.css';

export default function SignUpPage() {
  const { register, user, isLoaded } = useAppAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const registrationStarted = useRef(false);

  useEffect(() => { if (isLoaded && user && !registrationStarted.current) router.replace('/home'); }, [isLoaded, user, router]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      registrationStarted.current = true;
      const isNewUser = await register(email, password, name);
      router.replace(isNewUser ? '/onboarding/music-taste' : '/home');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create account.'); }
    finally { setBusy(false); }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/landing-page" className={styles.brand}><Image src="/assets/brand/vibetune_logo.png" alt="" width={34} height={34} /><span>VibeTune</span></Link>
        <span className={styles.headerMark}>Sound culture / Issue 06</span>
      </header>
      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby="signup-title">
          <Link href="/landing-page" className={styles.back}><ArrowLeft size={15} /> Back to VibeTune</Link>
          <p className={styles.eyebrow}>Start with a feeling</p>
          <h1 className={styles.title} id="signup-title">Create your account.</h1>
          <p className={styles.description}>Find a soundtrack that fits your day and the content you create.</p>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <a href="/api/auth/google" className={styles.providerButton}>Continue with Google <ArrowUpRight size={16} /></a>
          <div className={styles.divider}>OR EMAIL</div>
          <form onSubmit={submit} className={styles.form}>
            <label className={styles.field}>Name <span className={styles.hint}>(optional)</span><input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={styles.input} /></label>
            <label className={styles.field}>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={styles.input} /></label>
            <label className={styles.field}>Password<input type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} className={styles.input} /><span className={styles.hint}>Use 10 to 128 characters.</span></label>
            <label className={styles.field}>Confirm password<input type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={styles.input} /></label>
            <button disabled={busy} className={styles.submit}>{busy ? 'Creating account…' : 'Create account'}</button>
          </form>
          <p className={styles.footer}>Already have an account? <Link href="/sign-in">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
