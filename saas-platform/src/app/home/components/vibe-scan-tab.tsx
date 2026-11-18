'use client';

import { useRef } from 'react';
import { AlertCircle, Camera, Heart, Loader, RotateCcw, Sparkles } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import type { Song } from '../types';
import styles from '../dashboard.module.css';

interface VibeScanTabProps {
  uploadedImage: string | null;
  isAnalyzing: boolean;
  progress: number;
  results: Song[] | null;
  error: string | null;
  favoriteIds: Set<string>;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onPlay: (song: Song, playlist: Song[]) => void;
  onToggleFavorite: (song: Song, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function VibeScanTab({ uploadedImage, isAnalyzing, progress, results, error, favoriteIds, onImageUpload, onReset, onPlay, onToggleFavorite }: VibeScanTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <section aria-labelledby="scan-title">
      <header className={styles.pageHead}><div><p className={styles.eyebrow}>See it. Hear it.</p><h1 className={styles.pageTitle} id="scan-title">AI Vibe Scan<em>.</em></h1></div><span className={styles.topAvatar}><Sparkles size={20} /></span></header>
      <div className={styles.scanGrid}>
        <div>
          <input ref={inputRef} type="file" accept="image/*" onChange={onImageUpload} className="sr-only" tabIndex={-1} />
          <button type="button" className={`${styles.upload} ${uploadedImage ? styles.uploadReady : ''} w-full`} onClick={() => inputRef.current?.click()} aria-label={uploadedImage ? 'Change uploaded photo' : 'Choose a photo to scan'}>
            {uploadedImage && <ImageWithFallback src={uploadedImage} alt="Selected image for vibe scan" className="absolute inset-0 h-full w-full object-cover" />}
            <span className={styles.scanIndex}>01 <span>/</span> IMAGE INPUT</span>
            <span className={styles.uploadContent}>
              <span className={styles.scanIcon}><Camera size={25} /></span>
              <strong>{uploadedImage ? 'Your photo is ready' : <>Find the sound<br />in your image.</>}</strong>
              <span>{uploadedImage ? 'Click to choose another image' : 'Choose an image to find its soundtrack'}</span>
              {!uploadedImage && <span className={styles.uploadAction}>CHOOSE IMAGE <span aria-hidden="true">↗</span></span>}
            </span>
            <span className={styles.scanCorner} aria-hidden="true">VT / 06</span>
          </button>
        </div>
        <div className={`${styles.card} ${styles.scanResults}`} aria-live="polite">
          {isAnalyzing ? <div className="grid min-h-[300px] place-items-center text-center"><div><Loader className="mx-auto mb-4 animate-spin text-blue-700" size={36} /><strong className="block">Analyzing your vibe…</strong><span className="mt-2 block text-sm text-stone-500">{progress}%</span><div className="mt-4 h-1 w-48 bg-stone-200"><div className="h-full bg-blue-700 transition-all" style={{ width: `${progress}%` }} /></div></div></div>
            : error ? <div className="grid min-h-[300px] place-items-center text-center"><div><AlertCircle className="mx-auto mb-3 text-orange-600" size={36} /><strong className="block">Analysis failed</strong><p className="my-2 max-w-sm text-sm text-stone-600">{error}</p><button type="button" className={styles.buttonPrimary} onClick={onReset}><RotateCcw size={16} />Try again</button></div></div>
                : results ? <><div className={styles.sectionHead}><div><p className={styles.eyebrow}>Your visual match</p><h2>{results.length} tracks found</h2></div><button type="button" className={styles.buttonSecondary + ' !text-stone-900 !border-stone-400'} onClick={onReset}>Reset</button></div>{results.length ? results.map((song) => <div key={song.id} className={styles.scanRow}><ImageWithFallback src={song.artwork} alt="" /><button type="button" className="min-w-0 flex-1 text-left" onClick={() => onPlay(song, results)}><strong>{song.title}</strong><span>{song.artist}</span></button><button type="button" aria-label={`${favoriteIds.has(song.id) ? 'Remove' : 'Add'} ${song.title} ${favoriteIds.has(song.id) ? 'from' : 'to'} favorites`} aria-pressed={favoriteIds.has(song.id)} onClick={(event) => onToggleFavorite(song, event)}><Heart size={18} fill={favoriteIds.has(song.id) ? 'currentColor' : 'none'} /></button></div>) : <p className={styles.empty}>No matching tracks were found. Try another image.</p>}</>
                : <div className={styles.scanWelcome}><div className={styles.scanWelcomeMark}><Sparkles size={25} /><span>02</span></div><div><p className={styles.eyebrow}>A visual cue, a new mood</p><strong>Your soundtrack<br />starts with a moment.</strong><p>Choose a photo and let VibeTune find its sound.</p></div><span className={styles.scanWelcomeFoot}>SEE IT <span>→</span> HEAR IT</span></div>}
        </div>
      </div>
    </section>
  );
}
