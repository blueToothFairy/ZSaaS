'use client'
import MusicTasteEditor from '../components/music-taste-editor';

import { useState, useRef, useEffect, SetStateAction, CSSProperties } from 'react';
import { useAppAuth } from '../auth-provider';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  CloudRain,
  Camera, Home, User, Sparkles, Wind, Droplets, Settings, LogOut,
  Play, Pause, SkipForward, SkipBack, Disc3, Menu, X, AlertCircle, Loader, Heart,
  ChevronLeft, ChevronRight, Volume2, ScanLine, Snowflake, Cloud, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { compressImage } from '@/lib/utils/image-compressor';

// Interfaces
interface Song { id: string; title: string; artist: string; album: string; artwork: string; previewUrl?: string; duration?: number; externalUrl?: string; artistId?: string; primaryGenreName?: string; score?: number; reasons?: string[]; }
interface WeatherData { temperature: number; weatherCode: number; humidity: number; windSpeed: number; condition: string; }
interface Favorite { song_id: string; title: string; artist: string; album: string; artwork: string; preview_url?: string; external_url?: string; }
interface FavoritesResponse { success: boolean; data: { favorites: Favorite[]; total: number; } }
interface TodayVibeResponse { success: boolean; data: {
  reasoning: SetStateAction<string>;
  weather: WeatherData; songs: Song[]; session: string; 
}; }

// Dummy Data Fallback & Extended Covers
const covers = {
  desert: 'https://images.unsplash.com/photo-1548364504-57247d6f96bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNlcnQlMjBkdW5lcyUyMGdvbGRlbiUyMGhvdXJ8ZW58MXx8fHwxNzcxNDIzNDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  aurora: 'https://images.unsplash.com/photo-1549633760-9a0931220b84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3J0aGVybiUyMGxpZ2h0cyUyMGF1cm9yYSUyMHNreXxlbnwxfHx8fDE3NzE0MjM0NTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
  neonCity: 'https://images.unsplash.com/photo-1631379879495-23a8e79abed9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZW9uJTIwY2l0eSUyMHJhaW4lMjBzdHJlZXR8ZW58MXx8fHwxNzcxNDIzNDQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  abstractArt: 'https://images.unsplash.com/photo-1616941351479-0072624fca9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHBhaW50aW5nJTIwdGV4dHVyZSUyMHdhcm18ZW58MXx8fHwxNzcxNDIzNDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  avatarDefault: 'https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMHNtaWxpbmclMjBjYXN1YWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE3NDI3OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080'
};

function Equalizer({ bars = 5, active = true, className = '' }: { bars?: number; active?: boolean; className?: string }) {
  return (
    <div className={`flex items-end gap-[2px] h-3.5 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div key={i} className="w-[2.5px] rounded-full bg-current origin-bottom" animate={active ? { scaleY: [0.3, 1, 0.5, 0.8, 0.3] } : { scaleY: 0.3 }} transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }} style={{ height: '100%' }} />
      ))}
    </div>
  );
}

// Get weather-based background and icon
function getWeatherAssets(weather: WeatherData | null) {
  if (!weather) {
    const hours = new Date().getHours();
    const isDay = hours >= 6 && hours < 18;
    return { bg: '/assets/weather/sunny.png', icon: Sun, iconColor: isDay ? 'text-yellow-400' : 'text-indigo-200' };
  }
  
  const code = weather.weatherCode;
  const condition = weather.condition?.toLowerCase() ?? '';
  const hours = new Date().getHours();
  const isDay = hours >= 6 && hours < 18;
  
  // Rainy
  if (code === 80 || code === 81 || code === 82 || condition.includes('rain') || condition.includes('drizzle')) {
    return { bg: '/assets/weather/rainy.jfif', icon: CloudRain, iconColor: 'text-blue-300' };
  }
  
  // Snowy
  if ((code >= 71 && code <= 77) || code === 85 || code === 86 || condition.includes('snow')) {
    return { bg: '/assets/weather/snowy.png', icon: Snowflake, iconColor: 'text-cyan-100' };
  }
  
  // Windy/Wind
  if (condition.includes('wind')) {
    return { bg: '/assets/weather/windy.jfif', icon: Wind, iconColor: 'text-cyan-300' };
  }
  
  // Cloudy
  if (code === 1 || code === 2 || code === 3 || condition.includes('cloud') || condition.includes('overcast')) {
    return { bg: '/assets/weather/cloudy.png', icon: Cloud, iconColor: 'text-slate-300' };
  }
  
  // Sunny/Clear
  return { bg: '/assets/weather/sunny.png', icon: Sun, iconColor: isDay ? 'text-yellow-400' : 'text-indigo-200' };
}

export default function AppDashboard() {
  const { getToken, user, isLoaded, logout, addPassword, linkGoogle } = useAppAuth();
  const router = useRouter();

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/landing-page');
    }
  }, [isLoaded, user, router]);

  const [activeNav, setActiveNav] = useState('home');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResults, setScanResults] = useState<Song[] | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [authSettingsMessage, setAuthSettingsMessage] = useState('');
  
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [curatedSongs, setCuratedSongs] = useState<Song[]>([]);
  const [session, setSession] = useState<string>('morning');
  const [reasoning, setReasoning] = useState<string>('');
  
  // Favorites state
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);
  const [favoritedSongIds, setFavoritedSongIds] = useState<Set<string>>(new Set());
  const [contentPlatform, setContentPlatform] = useState('instagram');
  const [contentType, setContentType] = useState('story');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioElapsed, setAudioElapsed] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  const [clockTime, setClockTime] = useState<Date | null>(null);
  
  // Custom state for Profile Slideshow
  const [activeProfileIdx, setActiveProfileIdx] = useState(0);

  // Fetch Weather & Songs
  useEffect(() => {
    const fetchTodayVibe = async () => {
      try {
        // Send user's browser timezone so backend can compute session accurately
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await axios.get<TodayVibeResponse>('/api/weather-time/today-vibe', { params: { tz } });
        if (response.data.success) {
          setWeatherData(response.data.data.weather);
          setCuratedSongs(response.data.data.songs);
          setSession(response.data.data.session);
          setReasoning(response.data.data.reasoning);
        }
      } catch (error) { console.error(error); }
    };
    fetchTodayVibe();
  }, []);

  // Fetch Favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsFavoritesLoading(true);
        const token = await getToken();
        const response = await axios.get<FavoritesResponse>('/api/profile/favorites', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const favoritesList = response.data.data.favorites;
        const convertedFavorites = favoritesList.map((fav: Favorite) => ({
          id: fav.song_id,
          title: fav.title,
          artist: fav.artist,
          album: fav.album,
          artwork: fav.artwork,
          previewUrl: fav.preview_url,
          externalUrl: fav.external_url,
        }));
        setFavorites(convertedFavorites);
        setFavoritedSongIds(new Set(convertedFavorites.map((f: Song) => f.id)));
      } catch (error: Error | unknown) {
        console.error('Failed to fetch favorites');
        setFavorites([]);
        setFavoritedSongIds(new Set());
      } finally {
        setIsFavoritesLoading(false);
      }
    };
    
    fetchFavorites();
  }, [getToken]);

  // Keep active profile card index valid when favorites list changes
  useEffect(() => {
    if (favorites.length === 0) {
      setActiveProfileIdx(0);
      return;
    }
    setActiveProfileIdx((prev) => Math.min(prev, favorites.length - 1));
  }, [favorites.length]);

  // Realtime Clock Update
  useEffect(() => {
    setClockTime(new Date());
    const interval = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio Player Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => { setAudioElapsed(audio.currentTime); setAudioProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0); };
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
  }, [currentPlaylist, currentTrack]);

  const playTrack = (song: Song, playlist?: Song[]) => {
    if (!song.previewUrl) return;
    setCurrentTrack(song);
    if (playlist) setCurrentPlaylist(playlist);
    if (audioRef.current) {
      audioRef.current.src = song.previewUrl;
      audioRef.current.play().catch(() => setIsAudioPlaying(false));
    }
  };

  const handleNextTrack = () => {
    if (!currentTrack || currentPlaylist.length === 0) return;
    const idx = currentPlaylist.findIndex(s => s.id === currentTrack.id);
    if (idx !== -1 && idx < currentPlaylist.length - 1) playTrack(currentPlaylist[idx + 1], currentPlaylist);
  };

  const handlePrevTrack = () => {
    if (!currentTrack || currentPlaylist.length === 0) return;
    const idx = currentPlaylist.findIndex(s => s.id === currentTrack.id);
    if (idx > 0) playTrack(currentPlaylist[idx - 1], currentPlaylist);
  };

  const toggleAudioPlayPause = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => setIsAudioPlaying(false));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !currentTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * audioRef.current.duration;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reusable Favorite Toggle Logic with Optimistic UI Update
  const handleToggleFavorite = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation(); // NgÄƒn sá»± kiá»‡n click play nháº¡c
    
    const isFav = favoritedSongIds.has(song.id);
    const newFavIds = new Set(favoritedSongIds);
    
    // 1. Optimistic Update: Cáº­p nháº­t giao diá»‡n ngay láº­p tá»©c trÆ°á»›c khi gá»i API
    if (isFav) {
      newFavIds.delete(song.id);
      setFavorites(favorites.filter(f => f.id !== song.id));
    } else {
      newFavIds.add(song.id);
      setFavorites([...favorites, song]);
    }
    setFavoritedSongIds(newFavIds);

    // 2. Gá»i API ngáº§m á»Ÿ phÃ­a sau
    try {
      const token = await getToken();
      if (isFav) {
        await axios.delete(`/api/profile/favorites/${song.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/profile/favorites', {
          song_id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          artwork: song.artwork,
          preview_url: song.previewUrl,
          external_url: song.externalUrl,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err: Error | unknown) {
      console.error('Error toggling favorite:', err);
      // Náº¿u API lá»—i, cÃ³ thá»ƒ rollback state á»Ÿ Ä‘Ã¢y, nhÆ°ng táº¡m thá»i Ä‘á»ƒ visual mÆ°á»£t mÃ 
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setApiError(null);
        const reader = new FileReader();
        reader.onloadend = async () => {
          setUploadedImage(reader.result as string);
          setIsAnalyzing(true); setScanResults(null); setScanProgress(0);
          const compressedFile = await compressImage(file, 500);
          
          const interval = setInterval(() => {
            setScanProgress(prev => (prev >= 90 ? 90 : prev + 3));
          }, 40);

          try {
            const formData = new FormData();
            formData.append('file', compressedFile);
            const token = await getToken();
            const response = await axios.post('/api/vibe-scan', formData, {
              headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
            });
            setScanResults(response.data.songs || []);
            setScanProgress(100);
          } catch (error: unknown) {
            setApiError(error instanceof Error ? error.message : 'Failed to analyze image');
            setUploadedImage(null);
          } finally {
            setIsAnalyzing(false); clearInterval(interval);
          }
        };
        reader.readAsDataURL(file);
      } catch (error: unknown) {
        setApiError(error instanceof Error ? error.message : 'Failed to process image');
        setUploadedImage(null);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getGreeting = () => {
    const nowHour = clockTime?.getHours() ?? new Date().getHours();
    if (nowHour >= 5 && nowHour < 12) return 'Good morning';
    if (nowHour >= 12 && nowHour < 18) return 'Good afternoon';
    if (nowHour >= 18 && nowHour < 22) return 'Good evening';
    return 'Good night';
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'ai-scan', icon: Sparkles, label: 'AI Vibe Scan' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  // Realtime Clock Math
  const hours = clockTime ? clockTime.getHours() : 0;
  const minutes = clockTime ? clockTime.getMinutes() : 0;
  const seconds = clockTime ? clockTime.getSeconds() : 0;
  const formattedTime = clockTime ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : '--:--:--';
  const secDeg = seconds * 6;
  const minDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  // Show loading while checking auth
  if (!isLoaded || !user) {
    return (
      <div className="h-screen w-full bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const layoutVars: CSSProperties = {
    backgroundImage: `url('${getWeatherAssets(weatherData).bg}')`,
  };

  const sidebarContent = (
    <>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-12">
          <img src="/assets/brand/vibetune_logo.png" alt="VibeTune" className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wide">VibeTune</h1>
        </div>

        <nav className="space-y-4">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'ai-scan', label: 'AI Vibe Scan', icon: ScanLine },
            { id: 'profile', label: 'Profile', icon: User }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium shadow-sm transition-all duration-300 ${
                activeNav === item.id
                  ? 'glass-chip text-white border border-white/35 shadow-[0_12px_28px_rgba(68,114,255,0.26)]'
                  : 'text-white/75 hover:text-white hover:bg-white/8 border border-transparent'
              }`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4 relative z-10 mt-auto pt-8 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-2">
          <img
            src="https://i.pravatar.cc/150?u=guest"
            alt="Profile"
            className="w-10 h-10 rounded-full border-2 border-white/15 object-cover"
          />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{user?.name || 'Guest'}</p>
            <p className="text-xs text-white/60 truncate">{user?.email || 'User'}</p>
          </div>
        </div>
        <button onClick={async () => { await logout(); router.push('/landing-page'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-white/75 hover:bg-red-500/20 hover:text-red-300 transition-all border border-transparent">
          <LogOut size={20} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div 
      className="glass-neon-ring glass-ambient h-screen w-full overflow-hidden bg-fixed bg-cover bg-center relative font-sans text-white md:grid md:grid-cols-[264px_minmax(0,1fr)] md:gap-0"
      style={layoutVars}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(10,15,24,0.2),rgba(8,12,20,0.72)_76%),linear-gradient(120deg,rgba(4,7,14,0.68),rgba(8,12,21,0.5),rgba(4,7,14,0.68))] pointer-events-none z-0"></div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:h-dvh md:sticky md:top-0 md:w-full glass-panel py-8 px-4 z-20 overflow-y-auto flex-col">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-r-2xl"></div>
        {sidebarContent}
      </aside>

      {/* Sidebar - Mobile */}
      <motion.aside
        animate={{ x: sidebarOpen ? 0 : -320 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-y-0 left-0 h-dvh w-[264px] glass-panel py-8 px-4 z-40 overflow-y-auto flex flex-col md:hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-r-2xl"></div>
        {sidebarContent}
      </motion.aside>

      {/* Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="w-full h-dvh min-h-0 overflow-y-auto flex flex-col z-10 relative px-4 md:px-3 lg:px-5 pt-4 md:pt-6 pb-40">
        {/* Mobile Header */}
        <div className="flex items-center justify-between md:justify-start md:gap-4 mb-8">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-full glass-chip hover:bg-white/15 transition-colors"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-3xl md:text-4xl font-semibold drop-shadow-md">
            {getGreeting()}, <span className="text-white">{user?.name || 'Alex'}</span>
          </h2>
          <div className="w-10 md:hidden"></div>
        </div>

        {/* HOME TAB */}
        {activeNav === 'home' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 flex flex-col pb-40">
            
            {/* Top Widgets */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {/* Weather Card */}
              <div className="md:flex-1 glass-panel rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <p className="text-white/80 text-sm mb-4">Local Weather & Mood</p>
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    {(() => {
                      const { icon: IconComponent, iconColor } = getWeatherAssets(weatherData);
                      return <IconComponent className={`${iconColor} w-16 h-16`} />;
                    })()}
                    <span className="text-5xl font-light">{weatherData?.temperature || 22}&deg;</span>
                  </div>
                  <div>
                    <p className="text-xl font-semibold">{session?.charAt(0).toUpperCase() + session?.slice(1)} Vibe</p>
                    <p className="text-white/70 text-sm">{'Perfect for music'}</p>
                  </div>
                </div>
              </div>

              {/* Time Card */}
              <div className="md:flex-1 glass-panel rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <p className="text-white/80 text-sm mb-4">Local Time</p>
                <div className="flex flex-col relative z-10">
                  <h3 className="text-5xl font-light tracking-wider mb-2">
                    {clockTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) || '--:--'}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {clockTime?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Curated Tracks Grid */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-xl font-medium mb-4 drop-shadow-md">Curated for you</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 pb-4">
                {(curatedSongs.length > 0 ? curatedSongs.slice(0, 40) : Array(40).fill(null).map((_, i) => ({
                  id: String(i),
                  title: 'Loading...',
                  artist: 'Please wait',
                  album: '',
                  artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200'
                })) as Song[]).map((track) => (
                  <div 
                    key={track.id}
                    className="glass-panel rounded-2xl p-2 hover:bg-white/15 transition-all group flex flex-col h-full relative"
                  >
                    <button 
                      onClick={(e) => handleToggleFavorite(track, e)} 
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors z-10"
                    >
                      <Heart className={`w-4 h-4 ${favoritedSongIds.has(track.id) ? 'fill-rose-500 text-rose-500' : 'text-white/40 hover:text-rose-500'} transition-colors`} />
                    </button>
                    <div 
                      onClick={() => playTrack(track, curatedSongs.length > 0 ? curatedSongs : [])}
                      className="cursor-pointer flex-1 flex flex-col"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-3 relative">
                        <ImageWithFallback 
                          src={track.artwork} 
                          alt={track.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="text-white w-6 h-6" fill="currentColor" />
                        </div>
                      </div>
                      <h4 className="font-medium text-xs truncate">{track.title}</h4>
                      <p className="text-white/60 text-[10px] truncate">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* AI SCAN TAB */}
        {activeNav === 'ai-scan' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 flex flex-col pb-40">
            <h2 className="text-4xl font-semibold mb-8 drop-shadow-md">AI Vibe Scan</h2>
            
            <div className="glass-panel rounded-2xl p-8 flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden relative">
              
              {/* Upload Area */}
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center bg-white/8 border-2 border-white/20 rounded-2xl hover:bg-white/10 transition-all flex-shrink-0 overflow-hidden ${uploadedImage ? 'w-full lg:w-[40%] h-96' : 'w-full lg:w-full h-96'}`}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {uploadedImage ? (
                  <>
                    <ImageWithFallback
                      src={uploadedImage}
                      alt="Uploaded vibe"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/35" />
                    <div className="relative z-10 text-center px-4">
                      <span className="text-lg font-bold block">Your uploaded photo</span>
                      <span className="text-sm font-medium text-white/80 mt-2 block">Click to change</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform mb-4">
                      <Camera className="w-7 h-7 text-white/70" />
                    </div>
                    <span className="text-lg font-bold">Upload Photo</span>
                    <span className="text-sm font-medium text-white/60 mt-2">Drag & Drop or Click</span>
                  </>
                )}
              </motion.button>

              <AnimatePresence mode="wait">
                {uploadedImage && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 h-96 flex flex-col bg-white/8 border border-white/15 rounded-2xl overflow-hidden">
                    
                    {isAnalyzing ? (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <Loader className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                        <span className="font-bold text-lg">Analyzing Vibe...</span>
                        <span className="text-sm text-white/60 mt-2">{scanProgress}%</span>
                      </div>
                    ) : scanResults && scanResults.length > 0 ? (
                      <>
                        <div className="p-4 border-b border-white/15 bg-white/5 flex justify-between items-center flex-shrink-0">
                          <span className="text-xs font-bold text-white/70 uppercase tracking-widest">
                            Matched - {scanResults.length} tracks
                          </span>
                          <button onClick={() => setUploadedImage(null)} className="text-xs font-bold text-white/60 hover:text-white">Reset</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {scanResults.map((song) => (
                            <div 
                              key={song.id}
                              onClick={() => playTrack(song, scanResults)}
                              className="flex items-center gap-4 p-3 bg-white/8 border border-white/15 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
                            >
                              <ImageWithFallback src={song.artwork} alt={song.title} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold truncate">{song.title}</h4>
                                <p className="text-xs text-white/60 truncate">{song.artist}</p>
                              </div>
                              <button onClick={(e) => handleToggleFavorite(song, e)} className="flex-shrink-0 p-2">
                                <Heart className={`w-5 h-5 ${favoritedSongIds.has(song.id) ? 'fill-rose-500 text-rose-500' : 'text-white/40 hover:text-rose-500'} transition-colors`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : apiError ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="text-lg font-bold mb-2">Analysis Failed</p>
                        <p className="text-sm text-white/60 mb-6">{apiError}</p>
                        <button onClick={() => { setUploadedImage(null); setApiError(null); }} className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition">
                          Try Again
                        </button>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* PROFILE TAB */}
        {activeNav === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 flex flex-col pb-40">
            <h2 className="text-4xl font-semibold mb-8 drop-shadow-md">Your Profile</h2>

            {/* Profile Card */}
            <div className="glass-panel rounded-2xl p-8 mb-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative flex-shrink-0">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-white/10 border-2 border-white/20">
                    <img src="https://i.pravatar.cc/150?u=guest" alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  </div>
                </div>

                <div className="relative z-10 text-center md:text-left flex-1">
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">
                    {user?.name || 'Guest User'}
                  </h2>
                  <p className="text-white/60 font-medium text-lg mb-6">{user?.email || '@guest'}</p>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-bold flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-400 fill-rose-400" /> {favorites.length} Favorites
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-semibold mb-2">Sign-in methods</h3>
              <p className="text-sm text-white/60 mb-5">Link another method only after signing in to this account. Matching email addresses are never linked automatically.</p>
              {authSettingsMessage && <p role="status" className="mb-4 text-sm text-sky-100">{authSettingsMessage}</p>}
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={async () => { setAuthSettingsMessage(''); try { await linkGoogle(); } catch (error) { setAuthSettingsMessage(error instanceof Error ? error.message : 'Could not link Google.'); } }} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15">
                  Link Google account
                </button>
                <form onSubmit={async (event) => { event.preventDefault(); setAuthSettingsMessage(''); try { await addPassword(newPassword); setNewPassword(''); setAuthSettingsMessage('Password added to this account.'); } catch (error) { setAuthSettingsMessage(error instanceof Error ? error.message : 'Could not add password.'); } }} className="flex flex-1 gap-2">
                  <input type="password" minLength={10} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Add a password (10+ characters)" autoComplete="new-password" className="min-w-0 flex-1 rounded-xl border border-white/20 bg-slate-950/40 px-3 text-sm outline-none focus:border-sky-300" />
                  <button className="rounded-xl bg-sky-200 px-4 py-3 text-sm font-semibold text-slate-950">Add password</button>
                </form>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="mb-2 text-xl font-semibold">Music taste</h3>
                <p className="mb-5 text-sm text-white/55">Choose genres, artists, tracks, and languages to shape your recommendations.</p>
                <MusicTasteEditor getToken={getToken} />
              </div>
            </div>

            {/* Soundtrack Slideshow */}
            <div className="glass-panel rounded-2xl p-8 flex-1 flex flex-col">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Heart className="w-7 h-7 text-rose-500 fill-rose-500" /> 
                Favorite Tracks
              </h3>

              {isFavoritesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              ) : favorites.length === 0 ? (
                <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <Heart className="w-12 h-12 text-white/30" />
                  <p className="text-white/60 font-medium">No favorites yet. Add some tracks!</p>
                </div>
              ) : (
                <>
                  <div className="relative w-full h-80 flex items-center justify-center mb-8">
                    {favorites.map((song, i) => {
                      const offset = i - activeProfileIdx;
                      const isActive = offset === 0;
                      const absOffset = Math.abs(offset);
                      const xOffset = offset * 260;

                      return (
                        <div
                          key={song.id}
                          style={{ zIndex: 30 - absOffset }}
                          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${absOffset > 2 ? 'pointer-events-none' : ''}`}
                        >
                          <motion.div
                            onClick={() => {
                              if (isActive) playTrack(song, favorites);
                              else setActiveProfileIdx(i);
                            }}
                            animate={{
                              x: xOffset,
                              scale: isActive ? 1.08 : absOffset === 1 ? 0.82 : 0.66,
                              opacity: absOffset > 2 ? 0 : isActive ? 1 : absOffset === 1 ? 0.72 : 0.42
                            }}
                            transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
                            className="w-56 glass-panel rounded-2xl p-4 flex flex-col items-center group cursor-pointer hover:bg-white/15 transform-gpu"
                          >
                            <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 relative border border-white/15">
                              <ImageWithFallback src={song.artwork} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              {isActive && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center text-black">
                                    {currentTrack?.id === song.id && isAudioPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" fill="currentColor" />}
                                  </div>
                                </div>
                              )}
                            </div>
                            <h4 className="text-base font-bold truncate w-full text-center">{song.title}</h4>
                            <p className="text-xs text-white/60 truncate w-full text-center mt-1">{song.artist}</p>

                            {isActive && (
                              <button onClick={(e) => handleToggleFavorite(song, e)} className="mt-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/15 transition-colors">
                                <Heart className={`w-5 h-5 ${favoritedSongIds.has(song.id) ? 'fill-rose-500 text-rose-500' : 'text-white/70'}`} />
                              </button>
                            )}
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

      </main>

      {/* Bottom Player */}
      <div className="fixed bottom-6 left-6 right-6 md:left-[268px] md:right-8 z-50 pointer-events-none flex justify-center">
        <div className="pointer-events-auto w-full max-w-4xl glass-panel rounded-full px-6 py-3 flex items-center justify-between gap-6">
          
          {/* Track Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-white/15 ${isAudioPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
              <ImageWithFallback src={currentTrack?.artwork || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=100'} alt="Now Playing" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 hidden sm:block flex-1">
              <p className="text-xs uppercase tracking-wider text-white/60 mb-1">Now Playing</p>
              <p className="font-bold text-sm truncate">{currentTrack?.title || 'Ready to play'}</p>
              <p className="text-xs text-white/60 truncate">{currentTrack?.artist || 'Select a track'}</p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center flex-2 gap-2">
            <div className="flex items-center gap-4">
              <button onClick={handlePrevTrack} className="text-white/70 hover:text-white transition-colors">
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button 
                onClick={toggleAudioPlayPause}
                className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
              >
                {isAudioPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={handleNextTrack} className="text-white/70 hover:text-white transition-colors">
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>
            <div className="flex items-center gap-2 w-64">
              <span className="text-xs text-white/50 w-8 text-right">{formatTime(audioElapsed)}</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer group" onClick={handleProgressClick}>
                <div className="h-full bg-white rounded-full" style={{ width: `${currentTrack ? audioProgress : 0}%` }} />
              </div>
              <span className="text-xs text-white/50 w-8">{formatTime(audioDuration)}</span>
            </div>
          </div>

          {/* Equalizer */}
          <div className="flex items-center gap-2 flex-1 justify-end opacity-60 hidden lg:flex">
            <div className="flex items-end gap-[2px] h-6">
              {[40, 70, 40, 100, 60, 80, 30, 90].map((h, i) => (
                <motion.div 
                  key={i} 
                  className="w-1 bg-white rounded-full" 
                  animate={isAudioPlaying ? { scaleY: [0.4, 1, 0.6] } : { scaleY: 0.4 }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.08 }}
                  style={{ height: '24px' }}
                />
              ))}
            </div>
            <Volume2 size={20} />
          </div>
        </div>
      </div>

      <audio ref={audioRef} crossOrigin="anonymous" />
    </div>
  );
}
