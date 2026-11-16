'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music2, Sparkles } from 'lucide-react';
import { useAppAuth } from '../../auth-provider';
import MusicTasteEditor from '../../components/music-taste-editor';

export default function MusicTasteOnboardingPage() {
  const { user, isLoaded, getToken } = useAppAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) router.replace('/sign-in');
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-white/70">Preparing your music setup...</main>;

  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8" style={{ backgroundImage: 'radial-gradient(ellipse at top, #1e1b4b 0%, #020617 48%, #020617 100%)' }}>
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-200/10 text-sky-100"><Music2 className="h-5 w-5" /></span><span className="text-sm font-semibold tracking-wide text-white/80">VIBETUNE</span></div>
      <section className="rounded-3xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl sm:p-8">
        <div className="mb-8 max-w-2xl"><p className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200/20 bg-sky-200/10 px-3 py-1.5 text-xs font-medium text-sky-100"><Sparkles className="h-3.5 w-3.5" />Make it yours</p><h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">What does your music taste sound like?</h1><p className="mt-3 text-sm leading-6 text-slate-300">Choose a few genres, artists, or tracks you love. We&apos;ll use your choices to shape recommendations. You can edit them anytime in your Profile.</p></div>
        <MusicTasteEditor getToken={getToken} mode="wizard" onComplete={() => router.replace('/home')} onSkip={() => router.replace('/home')} />
      </section>
      <p className="mt-5 text-center text-xs text-white/40">You can finish this later from your Profile.</p>
    </div>
  </main>;
}
