'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppAuth } from '../../auth-provider';

export default function SignUpPage() {
  const { register, user, isLoaded } = useAppAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (isLoaded && user) router.replace('/home'); }, [isLoaded, user, router]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await register(email, password, name); router.replace('/home'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create account.'); }
    finally { setBusy(false); }
  };
  return <main className="min-h-screen flex items-center justify-center bg-slate-950 px-5 py-12 text-white">
    <section className="w-full max-w-md rounded-3xl border border-white/15 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
      <Link href="/landing-page" className="text-sm text-amber-200">← VibeTune</Link>
      <h1 className="mt-8 text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-white/65">Find a soundtrack that fits your content.</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
      <a href="/api/auth/google" className="mt-6 flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 font-medium hover:bg-white/15">Continue with Google</a>
      <div className="my-5 flex items-center gap-3 text-xs text-white/45"><span className="h-px flex-1 bg-white/15" />OR EMAIL<span className="h-px flex-1 bg-white/15" /></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">Name (optional)<input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/20 bg-slate-950/60 px-3 outline-none focus:border-amber-300" /></label>
        <label className="block text-sm">Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/20 bg-slate-950/60 px-3 outline-none focus:border-amber-300" /></label>
        <label className="block text-sm">Password<input type="password" autoComplete="new-password" minLength={10} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/20 bg-slate-950/60 px-3 outline-none focus:border-amber-300" /><span className="mt-1 block text-xs text-white/45">Use at least 10 characters.</span></label>
        <button disabled={busy} className="h-12 w-full rounded-xl bg-amber-200 font-semibold text-slate-950 disabled:opacity-60">{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-white/65">Already have an account? <Link className="text-amber-200" href="/sign-in">Sign in</Link></p>
    </section>
  </main>;
}
