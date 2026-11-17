'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music2, Sparkles } from 'lucide-react';
import { useAppAuth } from '../../auth-provider';
import MusicTasteEditor from '../../components/music-taste-editor';
import styles from '../music-taste.module.css';

export default function MusicTasteOnboardingPage() {
  const { user, isLoaded, getToken } = useAppAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) router.replace('/sign-in');
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) return <main className={`${styles.page} flex items-center justify-center text-sm text-[#62616a]`}><span>Preparing your music setup...</span></main>;

  return <main className={styles.page}>
    <div className={styles.content}>
      <div className={styles.brand}><span className={styles.brandMark}><Music2 className="h-5 w-5" /></span><span>VIBETUNE / ONBOARDING</span></div>
      <section className={styles.panel}>
        <div className={styles.intro}><p className={styles.eyebrow}><Sparkles className="h-3.5 w-3.5" />Make it yours</p><h1 className={styles.title}>What does your music taste sound like?</h1><p className={styles.description}>Choose a few genres, artists, or tracks you love. We&apos;ll use your choices to shape recommendations. You can edit them anytime in your Profile.</p></div>
        <MusicTasteEditor getToken={getToken} mode="wizard" onComplete={() => router.replace('/home')} onSkip={() => router.replace('/home')} />
      </section>
      <p className={styles.footer}>You can finish this later from your Profile.</p>
    </div>
  </main>;
}
