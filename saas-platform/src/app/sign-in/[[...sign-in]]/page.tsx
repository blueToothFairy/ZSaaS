'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppAuth } from '../../auth-provider';

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
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await login(email, password); router.replace('/home'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Sign-in failed.'); }
    finally { setBusy(false); }
  };
  return <main className="min-h-screen flex items-center justify-center bg-slate-950 px-5 py-12 text-white">
    <section className="w-full max-w-md rounded-3xl border border-white/15 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
      <Link href="/landing-page" className="text-sm text-sky-200">← VibeTune</Link>
      <h1 className="mt-8 text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-white/65">Sign in to continue to your soundtrack finder.</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
      <a href="/api/auth/google" className="mt-6 flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 font-medium hover:bg-white/15">Continue with Google</a>
      <div className="my-5 flex items-center gap-3 text-xs text-white/45"><span className="h-px flex-1 bg-white/15" />OR EMAIL<span className="h-px flex-1 bg-white/15" /></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/20 bg-slate-950/60 px-3 outline-none focus:border-sky-300" /></label>
        <label className="block text-sm">Password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/20 bg-slate-950/60 px-3 outline-none focus:border-sky-300" /></label>
        <button disabled={busy} className="h-12 w-full rounded-xl bg-sky-200 font-semibold text-slate-950 disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-white/65">New to VibeTune? <Link className="text-sky-200" href="/sign-up">Create an account</Link></p>
    </section>
  </main>;
}
