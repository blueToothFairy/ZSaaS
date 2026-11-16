'use client';

import { Heart, Play } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import type { Song } from '../types';
import styles from '../dashboard.module.css';

interface FavoritesTabProps {
  favorites: Song[];
  isLoading: boolean;
  onPlay: (song: Song, playlist: Song[]) => void;
  onRemove: (song: Song, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function FavoritesTab({ favorites, isLoading, onPlay, onRemove }: FavoritesTabProps) {
  return (
    <section aria-labelledby="favorites-title">
      <header className={styles.pageHead}><div><p className={styles.eyebrow}>Your personal collection</p><h1 className={styles.pageTitle} id="favorites-title">Favorites<em>.</em></h1></div><span className={styles.topAvatar}><Heart size={20} fill="currentColor" /></span></header>
      <div className={styles.banner}><div><p className={styles.heroKicker}>Keep the good ones</p><h2>Soundtrack<br />your story.</h2><p>Your favorite tracks, ready whenever the moment feels right.</p></div><Heart size={64} strokeWidth={1.2} aria-hidden="true" /></div>
      <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Collected by you</p><h2>Favorite tracks</h2></div><p>{favorites.length} favorites</p></div>
      {isLoading ? <div className={styles.empty} role="status">Loading your favorites…</div> : favorites.length === 0 ? <div className={styles.empty}>No favorites yet. Save a track from Home or AI Vibe Scan to start your collection.</div> : <div className={styles.favoriteGrid}>{favorites.map((song) => <article className={styles.trackCard} key={song.id}><button type="button" className={`${styles.trackArtwork} block w-full border-0 p-0 text-left`} onClick={() => onPlay(song, favorites)} aria-label={`Play ${song.title} by ${song.artist}`}><ImageWithFallback src={song.artwork} alt="" className="h-full w-full object-cover" /><span className={styles.trackPlay}><Play size={24} fill="currentColor" /></span></button><p className={styles.trackTitle} title={song.title}>{song.title}</p><div className="flex items-center justify-between gap-2"><p className={styles.trackArtist} title={song.artist}>{song.artist}</p><button type="button" aria-label={`Remove ${song.title} from favorites`} onClick={(event) => onRemove(song, event)} className="p-2 text-rose-700"><Heart size={16} fill="currentColor" /></button></div></article>)}</div>}
    </section>
  );
}
