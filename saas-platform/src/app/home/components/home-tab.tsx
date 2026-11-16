'use client';

import { ArrowUpRight, Clock3, Heart, Play } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import type { Song, WeatherData } from '../types';
import styles from '../dashboard.module.css';

interface HomeTabProps {
  displayName: string;
  greeting: string;
  songs: Song[];
  weather: WeatherData | null;
  session: string;
  clockTime: Date | null;
  weatherIcon: LucideIcon;
  isLoading: boolean;
  favoriteIds: Set<string>;
  onNavigateScan: () => void;
  onPlay: (song: Song, playlist: Song[]) => void;
  onToggleFavorite: (song: Song, event: React.MouseEvent<HTMLButtonElement>) => void;
}

function TrackCard({ track, playlist, favorite, onPlay, onToggleFavorite }: { track: Song; playlist: Song[]; favorite: boolean; onPlay: (song: Song, playlist: Song[]) => void; onToggleFavorite: HomeTabProps['onToggleFavorite'] }) {
  return (
    <article className={styles.trackCard}>
      <div className={styles.trackArtwork}>
        <ImageWithFallback src={track.artwork} alt="" className="h-full w-full object-cover" />
        <button type="button" className={`${styles.trackPlay} border-0`} onClick={() => onPlay(track, playlist)} aria-label={`Play ${track.title} by ${track.artist}`}><Play size={24} fill="currentColor" /></button>
        <button type="button" aria-label={`${favorite ? 'Remove' : 'Add'} ${track.title} ${favorite ? 'from' : 'to'} favorites`} aria-pressed={favorite} className={styles.trackFavorite} onClick={(event) => onToggleFavorite(track, event)}>
          <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <p className={styles.trackTitle} title={track.title}>{track.title}</p>
      <p className={styles.trackArtist} title={track.artist}>{track.artist}</p>
    </article>
  );
}

export function HomeTab({ displayName, greeting, songs, weather, session, clockTime, weatherIcon: WeatherIcon, isLoading, favoriteIds, onNavigateScan, onPlay, onToggleFavorite }: HomeTabProps) {
  return (
    <section aria-labelledby="home-title">
      <header className={styles.pageHead}>
        <div><p className={styles.eyebrow}>Your daily soundtrack</p><h1 className={styles.pageTitle} id="home-title">{greeting},<br />{displayName}<em>.</em></h1></div>
        <span className={styles.topAvatar} aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
      </header>
      <section className={styles.hero} aria-label="VibeTune sound culture">
        <div className={styles.heroContent}>
          <span className={styles.heroKicker}>A soundtrack for what you feel</span>
          <h2 className={styles.heroTitle}><span>Feel</span><span>The</span><span>Frequency</span></h2>
          <p className={styles.heroCopy}>Find the sound that fits the moment. Start with your surroundings or let a photo set the mood.</p>
          <div className={styles.heroActions}><button type="button" className={styles.buttonPrimary} onClick={onNavigateScan}>Scan a vibe <ArrowUpRight size={17} /></button></div>
        </div>
      </section>
      <div className={styles.weatherStrip}>
        <div className={styles.weatherCard}><WeatherIcon className={styles.weatherIcon} size={28} /><div><strong>{weather?.temperature ?? '—'}° · {weather?.condition || `${session} vibe`}</strong><span>Local weather, matched to your music</span></div></div>
        <div className={styles.weatherCard}><span className={styles.clockIcon} aria-hidden="true"><Clock3 size={28} strokeWidth={2.2} /></span><div><strong>{clockTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) || '--:--'}</strong><span>{clockTime?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) || 'Local time'}</span></div></div>
      </div>
      <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Picked for this moment</p><h2>Curated for you</h2></div><p>{songs.length ? `${songs.length} tracks` : 'Weather and mood'}</p></div>
      {isLoading ? <div className={styles.empty} role="status">Finding the right soundtrack…</div> : songs.length ? <div className={styles.trackGrid}>{songs.slice(0, 20).map((song) => <TrackCard key={song.id} track={song} playlist={songs} favorite={favoriteIds.has(song.id)} onPlay={onPlay} onToggleFavorite={onToggleFavorite} />)}</div> : <div className={styles.empty}>No curated tracks are available right now. Try again in a moment.</div>}
    </section>
  );
}
