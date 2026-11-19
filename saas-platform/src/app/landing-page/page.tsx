'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppAuth } from '../auth-provider';
import styles from './landing.module.css';

export default function LandingPageVibeTune() {
  const router = useRouter();
  const { isLoaded, user } = useAppAuth();

  useEffect(() => {
    if (isLoaded && user) router.replace('/home');
  }, [isLoaded, user, router]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/landing-page" className={styles.brand} aria-label="VibeTune home">
          <Image src="/assets/brand/vibetune_logo_v1.png" alt="" width={38} height={38} />
          <span>VibeTune</span>
        </Link>
        <span className={styles.edition}>Sound culture / Issue no. 06</span>
        <Link href="/sign-in" className={styles.headerLink}>Sign in <ArrowUpRight size={15} /></Link>
      </header>

      <section className={styles.hero} aria-labelledby="landing-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Your personal soundspace</p>
          <h1 className={styles.title} id="landing-title">Your Mood,<br />Curated by<br /><em>the Sky.</em></h1>
          <p className={styles.description}>VibeTune matches the weather around you with music that fits the moment. Find your next soundtrack or scan a photo to discover its vibe.</p>
          <Link href="/sign-up" className={styles.cta}>Experience the Vibe <ArrowUpRight size={18} /></Link>
          <div className={styles.socialProof}>
            <div className={styles.avatars} aria-hidden="true"><span className={styles.avatar}>V</span><span className={styles.avatar}>♪</span><span className={styles.avatar}>✳</span></div>
            <span>Made for people who create with feeling.</span>
          </div>
        </div>
        <div className={styles.artwork} role="img" aria-label="VibeTune Sound Culture poster">
          <span className={styles.artLabel}>Independent sound / Vol. 06</span>
          <div className={styles.record} aria-hidden="true" />
          <div className={styles.sticker}><div><strong>More<br />feeling</strong><span>Less filter / 006</span></div></div>
        </div>
      </section>
    </main>
  );
}
