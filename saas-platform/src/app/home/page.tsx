'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Cloud, CloudRain, Moon, Snowflake, Sun, Wind } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppAuth } from '../auth-provider';
import { compressImage } from '@/lib/utils/image-compressor';
import { DashboardSidebar } from './components/dashboard-sidebar';
import { FavoritesTab } from './components/favorites-tab';
import { HomeTab } from './components/home-tab';
import { MusicPlayer } from './components/music-player';
import { ProfileTab } from './components/profile-tab';
import { VibeScanTab } from './components/vibe-scan-tab';
import type { DashboardTab, Song, WeatherData } from './types';
import styles from './dashboard.module.css';

interface FavoriteRecord {
  song_id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  preview_url?: string;
  external_url?: string;
}

interface FavoritesResponse {
  success: boolean;
  data: { favorites: FavoriteRecord[]; total: number };
}

interface TodayVibeResponse {
  success: boolean;
  data: { weather: WeatherData; songs: Song[]; session: string; reasoning: string };
}

function getWeatherIcon(weather: WeatherData | null) {
  const condition = weather?.condition?.toLowerCase() ?? '';
  const code = weather?.weatherCode ?? 0;
  if ([80, 81, 82].includes(code) || condition.includes('rain') || condition.includes('drizzle')) return CloudRain;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86 || condition.includes('snow')) return Snowflake;
  if (condition.includes('wind')) return Wind;
  if ([1, 2, 3].includes(code) || condition.includes('cloud') || condition.includes('overcast')) return Cloud;
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? Sun : Moon;
}

export default function AppDashboard() {
  const { getToken, user, isLoaded, logout, addPassword, linkGoogle } = useAppAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [curatedSongs, setCuratedSongs] = useState<Song[]>([]);
  const [session, setSession] = useState('morning');
  const [isCuratedLoading, setIsCuratedLoading] = useState(true);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);
  const [favoritedSongIds, setFavoritedSongIds] = useState<Set<string>>(new Set());
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResults, setScanResults] = useState<Song[] | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [authSettingsMessage, setAuthSettingsMessage] = useState('');
  const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioElapsed, setAudioElapsed] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [clockTime, setClockTime] = useState<Date | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isLoaded && !user) router.replace('/landing-page');
  }, [isLoaded, user, router]);

  useEffect(() => {
    let cancelled = false;
    const fetchTodayVibe = async () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await axios.get<TodayVibeResponse>('/api/weather-time/today-vibe', { params: { tz } });
        if (!cancelled && response.data.success) {
          setWeatherData(response.data.data.weather);
          setCuratedSongs(response.data.data.songs);
          setSession(response.data.data.session);
        }
      } catch (error) {
        console.error('Failed to load today\'s vibe:', error);
      } finally {
        if (!cancelled) setIsCuratedLoading(false);
      }
    };
    void fetchTodayVibe();
    return () => { cancelled = true; };
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      setIsFavoritesLoading(true);
      const token = await getToken();
      const response = await axios.get<FavoritesResponse>('/api/profile/favorites', { headers: { Authorization: `Bearer ${token}` } });
      const converted = response.data.data.favorites.map((favorite) => ({
        id: favorite.song_id,
        title: favorite.title,
        artist: favorite.artist,
        album: favorite.album,
        artwork: favorite.artwork,
        previewUrl: favorite.preview_url,
        externalUrl: favorite.external_url,
      }));
      setFavorites(converted);
      setFavoritedSongIds(new Set(converted.map((favorite) => favorite.id)));
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setFavorites([]);
      setFavoritedSongIds(new Set());
    } finally {
      setIsFavoritesLoading(false);
    }
  }, [getToken]);

  useEffect(() => { void fetchFavorites(); }, [fetchFavorites]);

  useEffect(() => {
    setClockTime(new Date());
    const interval = window.setInterval(() => setClockTime(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const handleNextTrack = useCallback(() => {
    if (!currentTrack || !currentPlaylist.length) return;
    const index = currentPlaylist.findIndex((song) => song.id === currentTrack.id);
    const next = currentPlaylist[index + 1];
    if (next) playTrack(next, currentPlaylist);
  }, [currentTrack, currentPlaylist]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = audioVolume;
  }, [audioVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => {
      setAudioElapsed(audio.currentTime);
      setAudioProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const handleLoadedMetadata = () => setAudioDuration(audio.duration);
    const handleEnded = () => handleNextTrack();
    const handlePlay = () => setIsAudioPlaying(true);
    const handlePause = () => setIsAudioPlaying(false);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [handleNextTrack, currentTrack, currentPlaylist]);

  const playTrack = (song: Song, playlist?: Song[]) => {
    if (!song.previewUrl) return;
    setCurrentTrack(song);
    if (playlist) setCurrentPlaylist(playlist);
    const audio = audioRef.current;
    if (audio) {
      audio.src = song.previewUrl;
      audio.play().catch(() => setIsAudioPlaying(false));
    }
  };

  const handlePreviousTrack = () => {
    if (!currentTrack || !currentPlaylist.length) return;
    const index = currentPlaylist.findIndex((song) => song.id === currentTrack.id);
    const previous = currentPlaylist[index - 1];
    if (previous) playTrack(previous, currentPlaylist);
  };

  const toggleAudioPlayPause = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) audioRef.current.pause();
    else void audioRef.current.play().catch(() => setIsAudioPlaying(false));
  };

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || !audio.duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * audio.duration;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };

  const handleToggleFavorite = async (song: Song, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const isFavorite = favoritedSongIds.has(song.id);
    const nextIds = new Set(favoritedSongIds);
    if (isFavorite) {
      nextIds.delete(song.id);
      setFavorites((current) => current.filter((favorite) => favorite.id !== song.id));
    } else {
      nextIds.add(song.id);
      setFavorites((current) => [...current, song]);
    }
    setFavoritedSongIds(nextIds);
    try {
      const token = await getToken();
      if (isFavorite) {
        await axios.delete(`/api/profile/favorites/${song.id}`, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/profile/favorites', {
          song_id: song.id, title: song.title, artist: song.artist, album: song.album,
          artwork: song.artwork, preview_url: song.previewUrl, external_url: song.externalUrl,
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setApiError(null);
    setUploadedImage(null);
    setScanResults(null);
    setIsAnalyzing(true);
    setScanProgress(0);
    try {
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image'));
        reader.onerror = () => reject(new Error('Could not read image'));
        reader.readAsDataURL(file);
      });
      setUploadedImage(preview);
      const compressedFile = await compressImage(file, 500);
      const progressTimer = window.setInterval(() => setScanProgress((value) => value >= 90 ? 90 : value + 3), 40);
      try {
        const formData = new FormData();
        formData.append('file', compressedFile);
        const token = await getToken();
        const response = await axios.post<{ songs?: Song[] }>('/api/vibe-scan', formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
        setScanResults(response.data.songs ?? []);
        setScanProgress(100);
      } finally {
        window.clearInterval(progressTimer);
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to analyze image');
      setUploadedImage(null);
      setScanResults(null);
    } finally {
      setIsAnalyzing(false);
      event.target.value = '';
    }
  };

  const resetScan = () => { setUploadedImage(null); setScanResults(null); setApiError(null); setScanProgress(0); };
  const greeting = (() => {
    const hour = clockTime?.getHours() ?? new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    if (hour >= 18 && hour < 22) return 'Good evening';
    return 'Good night';
  })();
  const displayEmail = user?.email?.trim() || '';
  const emailName = displayEmail.includes('@') ? displayEmail.slice(0, displayEmail.indexOf('@')).trim() : '';
  const displayName = user?.name?.trim() || emailName || 'VibeTune user';
  const WeatherIcon = getWeatherIcon(weatherData);

  if (!isLoaded || !user) {
    return <div className={`${styles.dashboard} grid min-h-screen place-items-center`}><p role="status">Loading your VibeTune dashboard…</p></div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.layout}>
        <DashboardSidebar activeTab={activeTab} displayName={displayName} email={displayEmail} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} onLogout={() => { void logout().then(() => router.push('/landing-page')); }} />
        <main className={styles.main}>
          <div className={styles.mobileBar}><button type="button" className={styles.mobileMenu} aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}>☰</button><span className={styles.mobileBrand}>VibeTune</span></div>
          {activeTab === 'home' && <HomeTab displayName={displayName} greeting={greeting} songs={curatedSongs} weather={weatherData} session={session} clockTime={clockTime} weatherIcon={WeatherIcon} isLoading={isCuratedLoading} favoriteIds={favoritedSongIds} onNavigateScan={() => setActiveTab('ai-scan')} onPlay={playTrack} onToggleFavorite={handleToggleFavorite} />}
          {activeTab === 'ai-scan' && <VibeScanTab uploadedImage={uploadedImage} isAnalyzing={isAnalyzing} progress={scanProgress} results={scanResults} error={apiError} favoriteIds={favoritedSongIds} onImageUpload={handleImageUpload} onReset={resetScan} onPlay={playTrack} onToggleFavorite={handleToggleFavorite} />}
          {activeTab === 'favorites' && <FavoritesTab favorites={favorites} isLoading={isFavoritesLoading} onPlay={playTrack} onRemove={handleToggleFavorite} />}
          {activeTab === 'profile' && <ProfileTab displayName={displayName} email={displayEmail || 'Your VibeTune account'} favoriteCount={favorites.length} getToken={getToken} linkGoogle={linkGoogle} addPassword={addPassword} newPassword={newPassword} setNewPassword={setNewPassword} message={authSettingsMessage} setMessage={setAuthSettingsMessage} />}
        </main>
      </div>
      <MusicPlayer currentTrack={currentTrack} isPlaying={isAudioPlaying} progress={audioProgress} elapsed={audioElapsed} duration={audioDuration} volume={audioVolume} onVolumeChange={setAudioVolume} onPrevious={handlePreviousTrack} onNext={handleNextTrack} onToggle={toggleAudioPlayPause} onSeek={handleSeek} formatTime={formatTime} />
      <audio ref={audioRef} crossOrigin="anonymous" />
    </div>
  );
}
