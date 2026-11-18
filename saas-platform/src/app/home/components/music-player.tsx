'use client';

import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import type { Song } from '../types';
import styles from '../dashboard.module.css';

interface MusicPlayerProps {
  currentTrack: Song | null;
  isPlaying: boolean;
  progress: number;
  elapsed: number;
  duration: number;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggle: () => void;
  onSeek: (event: React.MouseEvent<HTMLDivElement>) => void;
  formatTime: (seconds: number) => string;
}

export function MusicPlayer({ currentTrack, isPlaying, progress, elapsed, duration, volume, onVolumeChange, onPrevious, onNext, onToggle, onSeek, formatTime }: MusicPlayerProps) {
  return (
    <section className={styles.player} aria-label="Music player">
      <div className={styles.playerTrack}><ImageWithFallback src={currentTrack?.artwork || '/assets/brand/vibetune_logo.png'} alt="" /><div><strong>{currentTrack?.title || 'Ready to play'}</strong><span>{currentTrack?.artist || 'Choose a track to begin'}</span></div></div>
      <div className={styles.playerControls}><button type="button" aria-label="Previous track" onClick={onPrevious}><SkipBack size={18} fill="currentColor" /></button><button type="button" className={styles.playButton} aria-label={isPlaying ? 'Pause' : 'Play'} onClick={onToggle}>{isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button><button type="button" aria-label="Next track" onClick={onNext}><SkipForward size={18} fill="currentColor" /></button></div>
      <div className={styles.playerProgress}><span>{formatTime(elapsed)}</span><div className={styles.progressTrack} role="slider" aria-label="Track progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} tabIndex={0} onClick={onSeek} onKeyDown={(event) => { if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && duration) { const audio = document.querySelector('audio'); if (audio) audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + (event.key === 'ArrowRight' ? 5 : -5))); } }}><div className={styles.progressFill} style={{ width: `${currentTrack ? progress : 0}%` }} /></div><span>{formatTime(duration)}</span></div>
      <label className={styles.volumeControl}><Volume2 size={17} aria-hidden="true" /><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => onVolumeChange(Number(event.target.value))} aria-label="Volume" /></label>
    </section>
  );
}
