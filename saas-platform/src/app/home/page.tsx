'use client'

import { useState, useRef, useEffect } from 'react';
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import axios from 'axios';
import {
  CloudRain, Cloud, CloudSnow, Sun, CloudDrizzle, CloudLightning, Eye,
  Camera, Home, Search, Library, User,
  Sparkles, Wind, Droplets, Settings, LogOut,
  Play, Pause, ArrowRight, SkipForward, SkipBack,
  Disc3, Volume2, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { compressImage } from '@/lib/utils/image-compressor';

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl?: string;
  externalUrl?: string;
  duration?: number;
  releaseDate?: string;
}

interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  location: {
    latitude: number;
    longitude: number;
    country: string;
    countryCode: string;
  };
}

interface TodayVibeResponse {
  success: boolean;
  data: {
    weather: WeatherData;
    songs: Song[];
    genres: string[];
    mood: string;
    reasoning: string;
    session: string;
  };
}

const covers = {
  neonCity: 'https://images.unsplash.com/photo-1631379879495-23a8e79abed9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZW9uJTIwY2l0eSUyMHJhaW4lMjBzdHJlZXR8ZW58MXx8fHwxNzcxNDIzNDQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  jazzCafe: 'https://images.unsplash.com/photo-1715139718837-f9efc78cddc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb29keSUyMGphenolMjBjYWZlJTIwbmlnaHR8ZW58MXx8fHwxNzcxNDIzNDQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  oceanSunset: 'https://images.unsplash.com/photo-1718067634803-8c369340bd54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvY2VhbiUyMHN1bnNldCUyMHBhc3RlbHxlbnwxfHx8fDE3NzE0MjM0NDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
  foggyForest: 'https://images.unsplash.com/photo-1601307426703-20d19577e455?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb2dneSUyMGZvcmVzdCUyMG1vcm5pbmd8ZW58MXx8fHwxNzcxNDIzNDQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
  abstractArt: 'https://images.unsplash.com/photo-1616941351479-0072624fca9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHBhaW50aW5nJTIwdGV4dHVyZSUyMHdhcm18ZW58MXx8fHwxNzcxNDIzNDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  desert: 'https://images.unsplash.com/photo-1548364504-57247d6f96bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNlcnQlMjBkdW5lcyUyMGdvbGRlbiUyMGhvdXJ8ZW58MXx8fHwxNzcxNDIzNDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  aurora: 'https://images.unsplash.com/photo-1549633760-9a0931220b84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3J0aGVybiUyMGxpZ2h0cyUyMGF1cm9yYSUyMHNreXxlbnwxfHx8fDE3NzE0MjM0NTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
  vinyl: 'https://images.unsplash.com/photo-1653579658400-5818b7e5b8e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNvbG9yZnVsJTIwdmlueWwlMjByZWNvcmR8ZW58MXx8fHwxNzcxNDIzNDQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
};

const mockAlbums = [
  { id: 1, title: 'Midnight in Shibuya', artist: 'Neon Collective', genre: 'Lo-fi', image: covers.neonCity, featured: true, listeners: '2.4k listening' },
  { id: 2, title: 'Sunday Mornings', artist: 'Amber & Co.', genre: 'Acoustic', image: covers.foggyForest, featured: true, listeners: '1.8k listening' },
  { id: 3, title: 'Velvet Dunes', artist: 'Solar Winds', genre: 'Ambient', image: covers.desert, listeners: '892' },
  { id: 4, title: 'Tidal', artist: 'Cerulean', genre: 'Dream Pop', image: covers.oceanSunset, listeners: '1.1k' },
  { id: 5, title: 'Northern', artist: 'Boreal', genre: 'Electronic', image: covers.aurora, listeners: '3.2k' },
  { id: 6, title: 'Gallery Hours', artist: 'Still Life', genre: 'Jazz', image: covers.abstractArt, listeners: '567' },
  { id: 7, title: 'Rainy Day Tape', artist: 'The Window Seat', genre: 'Indie', image: covers.jazzCafe, listeners: '2.1k' },
  { id: 8, title: 'Analog Heat', artist: 'Wax & Wire', genre: 'Soul', image: covers.vinyl, listeners: '1.5k' },
];

const scannedSongs = [
  { id: 101, title: 'Pixel Rain', artist: 'Glitch Garden', duration: '3:24', bpm: 92 },
  { id: 102, title: 'Sidewalk Chalk', artist: 'Pastel Theory', duration: '2:55', bpm: 78 },
  { id: 103, title: 'Wire Frame', artist: 'Construct', duration: '4:12', bpm: 110 },
  { id: 104, title: 'Soft Focus', artist: 'Bokeh', duration: '3:05', bpm: 86 },
  { id: 105, title: 'Paper Cranes', artist: 'Origami', duration: '3:38', bpm: 94 },
];

const nowPlayingData = {
  title: 'Golden Hour Drive',
  artist: 'Sunset Boulevard',
  image: covers.desert,
  progress: 62,
  duration: '4:18',
  elapsed: '2:41',
};

function Equalizer({ bars = 5, active = true, className = '' }: { bars?: number; active?: boolean; className?: string }) {
  return (
    <div className={`flex items-end gap-[2px] h-3.5 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2.5px] rounded-full bg-current origin-bottom"
          animate={active ? {
            scaleY: [0.3, 1, 0.5, 0.8, 0.3],
          } : { scaleY: 0.3 }}
          transition={{
            duration: 0.8 + i * 0.1,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.12,
          }}
          style={{ height: '100%' }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [activeNav, setActiveNav] = useState('home');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResults, setScanResults] = useState<Song[] | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [hoveredAlbum, setHoveredAlbum] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [curatedSongs, setCuratedSongs] = useState<Song[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [session, setSession] = useState<string>('morning');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioElapsed, setAudioElapsed] = useState(0);

  useEffect(() => {
    const fetchTodayVibe = async () => {
      try {
        setIsLoadingWeather(true);
        const response = await axios.get<TodayVibeResponse>('/api/vibe-scan/today-vibe');

        if (response.data.success) {
          setWeatherData(response.data.data.weather);
          setCuratedSongs(response.data.data.songs);
          setSession(response.data.data.session);
        }
      } catch (error: any) {
      } finally {
        setIsLoadingWeather(false);
      }
    };

    fetchTodayVibe();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setAudioElapsed(audio.currentTime);
      setAudioProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleDurationChange = () => {
      setAudioDuration(audio.duration);
    };

    const handleEnded = () => {
      handleNextTrack();
    };

    const handlePlay = () => {
      setIsAudioPlaying(true);
    };

    const handlePause = () => {
      setIsAudioPlaying(false);
    };

    const handleError = (e: Event) => {
      setIsAudioPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [currentPlaylist, currentTrack]);

  const playTrack = (song: Song, playlist?: Song[]) => {
    if (!song.previewUrl) {
      return;
    }

    setCurrentTrack(song);
    if (playlist) setCurrentPlaylist(playlist);

    if (audioRef.current) {
      audioRef.current.src = song.previewUrl;
      audioRef.current.play().then(() => {
        setIsAudioPlaying(true);
      }).catch(err => {
        setIsAudioPlaying(false);
      });
    }
  };

  const handleNextTrack = () => {
    if (!currentTrack || currentPlaylist.length === 0) return;
    const idx = currentPlaylist.findIndex(s => s.id === currentTrack.id);
    if (idx !== -1 && idx < currentPlaylist.length - 1) {
      playTrack(currentPlaylist[idx + 1], currentPlaylist);
    }
  };

  const handlePrevTrack = () => {
    if (!currentTrack || currentPlaylist.length === 0) return;
    const idx = currentPlaylist.findIndex(s => s.id === currentTrack.id);
    if (idx > 0) {
      playTrack(currentPlaylist[idx - 1], currentPlaylist);
    }
  };

  const toggleAudioPlayPause = () => {
    if (!audioRef.current) return;

    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsAudioPlaying(true);
      }).catch(err => {
        setIsAudioPlaying(false);
      });
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !currentTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * audioRef.current.duration;
    setAudioElapsed(audioRef.current.currentTime);
    setAudioProgress(percentage * 100);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWeatherIcon = (weatherCode: number) => {
    if (weatherCode <= 1) {
      return <Sun className="w-5 h-5 text-amber-400" />;
    } else if (weatherCode === 2) {
      return <Cloud className="w-5 h-5 text-slate-400" />;
    } else if (weatherCode === 3) {
      return <Cloud className="w-5 h-5 text-slate-500" />;
    } else if ((weatherCode >= 45 && weatherCode <= 48) || (weatherCode >= 51 && weatherCode <= 82)) {
      return <CloudRain className="w-5 h-5 text-sky-400" />;
    } else if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) {
      return <CloudSnow className="w-5 h-5 text-blue-300" />;
    } else if (weatherCode >= 95) {
      return <CloudLightning className="w-5 h-5 text-purple-400" />;
    } else {
      return <Cloud className="w-5 h-5 text-slate-400" />;
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
          setIsAnalyzing(true);
          setScanResults(null);
          setScanProgress(0);

          const compressedFile = await compressImage(file, 500);

          const interval = setInterval(() => {
            setScanProgress(prev => {
              if (prev >= 90) { clearInterval(interval); return 90; }
              return prev + 3;
            });
          }, 40);

          try {
            const formData = new FormData();
            formData.append('file', compressedFile);

            const token = await getToken();
            const response = await axios.post('/api/vibe-scan', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
              }
            });

            const data = await response.data;
            setScanResults(data.songs || []);
            setScanProgress(100);
            setIsAnalyzing(false);
          } catch (error: any) {
            setApiError(error.message);
            setScanProgress(0);
            setIsAnalyzing(false);
            setUploadedImage(null);
          } finally {
            clearInterval(interval);
          }
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error: any) {
        setApiError(error.message || 'Failed to compress image');
        setUploadedImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const getGreeting = () => {
    const sessionTexts: { [key: string]: { text: string; mood: string } } = {
      morning: { text: 'Good morning', mood: 'sunrise energy' },
      afternoon: { text: 'Good afternoon', mood: 'golden hour' },
      evening: { text: 'Good evening', mood: 'twilight feels' },
      night: { text: 'Late night', mood: 'midnight thoughts' },
    };
    return sessionTexts[session] || { text: 'Good morning', mood: 'sunrise energy' };
  };

  const greeting = getGreeting();
  const featured = mockAlbums.filter(a => a.featured);
  const regular = mockAlbums.filter(a => !a.featured);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div
      className="h-screen w-full bg-gradient-to-br from-rose-100/80 via-amber-50 to-sky-100/60 text-slate-800 selection:bg-rose-200 overflow-hidden relative"
      style={{ fontFamily: "'Sora', sans-serif" }}
    >
      <div
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] bg-rose-300/20 rounded-full blur-[100px] animate-drift" />
        <div className="absolute top-[30%] right-[-15%] w-[55%] h-[40%] bg-amber-200/25 rounded-full blur-[120px] animate-drift-slow" />
        <div className="absolute bottom-[-10%] left-[30%] w-[40%] h-[35%] bg-sky-200/20 rounded-full blur-[100px] animate-drift-reverse" />
      </div>

      <div className="relative z-10 flex h-full">

        <motion.aside
          initial={false}
          animate={{
            width: sidebarOpen ? 280 : 0,
            opacity: sidebarOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="hidden md:flex flex-col overflow-hidden h-full flex-shrink-0 relative z-20 border-r border-white/25 bg-white/10 backdrop-blur-2xl"
        >
          <div className="flex flex-col h-full overflow-y-auto w-[280px] p-6 scrollbar-hide">
            <div className="flex items-center gap-3 mb-12 px-2 flex-shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-rose-400/20">
                <Disc3 className="w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl tracking-tight text-slate-800" style={{ fontWeight: 700 }}>Vibe</span>
                <span className="text-xl tracking-tight text-rose-500" style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontStyle: 'italic' }}>Tune</span>
              </div>
              <Equalizer bars={4} active={isPlaying} className="ml-auto text-rose-400" />
            </div>

            <nav className="flex-1 space-y-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 ${activeNav === item.id
                    ? 'bg-white/40 text-slate-900 shadow-sm border border-white/50'
                    : 'hover:bg-white/15 text-slate-500 hover:text-slate-700'
                    }`}
                  style={{ fontWeight: activeNav === item.id ? 600 : 400 }}
                >
                  <item.icon className={`w-[18px] h-[18px] ${activeNav === item.id ? 'text-rose-500' : ''}`} />
                  <span className="text-[15px]">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto space-y-4">
              

              <div className="pt-4 border-t border-white/15 space-y-1">
                <button className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl hover:bg-white/15 text-slate-500 transition-colors text-[14px]">
                  <Settings className="w-[18px] h-[18px]" /><span>Settings</span>
                </button>
                <button onClick={() => signOut({ redirectUrl: '/' })} className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl hover:bg-red-50/40 text-slate-500 hover:text-red-500 transition-colors text-[14px]">
                  <LogOut className="w-[18px] h-[18px]" /><span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </motion.aside>

        <main className="flex-1 h-full overflow-y-auto p-5 md:p-8 lg:p-10 pb-44 md:pb-24 w-full scroll-smooth">
          <div className="max-w-[1400px] mx-auto w-full">
            <header className="md:hidden flex justify-between items-center mb-8">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white shadow-md">
                  <Disc3 className="w-4 h-4" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg tracking-tight text-slate-800" style={{ fontWeight: 700 }}>Vibe</span>
                  <span className="text-lg tracking-tight text-rose-500" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>Tune</span>
                </div>
              </div>
              <button className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </button>
            </header>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mb-10 flex items-start justify-between"
            >
              <div className="flex-1">
                <p className="text-[11px] text-slate-400 tracking-[0.15em] mb-1.5 uppercase" style={{ fontWeight: 500 }}>{greeting.mood}</p>
                <h2 className="text-3xl md:text-[2.75rem] tracking-tight text-slate-800 leading-[1.15]" style={{ fontWeight: 700 }}>
                  {greeting.text},{' '}
                  <span
                    style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500"
                  >
                    {!isLoaded ? '...' : user?.firstName || 'Guest'}
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 transition-colors ml-4"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-12 h-auto lg:h-[480px]">

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-3 h-[280px] lg:h-full"
              >
                <div className="relative h-full bg-white/20 backdrop-blur-xl border border-white/40 p-7 rounded-3xl shadow-lg shadow-slate-900/[0.04] hover:shadow-xl transition-shadow duration-500 overflow-hidden group flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

                  <div className="absolute top-0 right-0 w-36 h-full overflow-hidden pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-[1px] bg-gradient-to-b from-sky-300 to-transparent rain-drop"
                        style={{
                          left: `${6 + i * 7}%`,
                          height: `${12 + (i % 3) * 8}px`,
                          animationDelay: `${i * 0.25}s`,
                          animationDuration: `${0.8 + (i % 4) * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                      <span className="text-[1rem] tracking-[0.15em] uppercase text-slate-400" style={{ fontWeight: 600 }}>
                        Weather · Playlist
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                      {weatherData ? (
                        <>
                          <div className="flex-[0.6] flex items-center justify-center w-full">
                            <div className="flex items-center gap-4 lg:gap-8">
                              <div className="flex flex-col items-center relative translate-x-6 lg:translate-x-6">
                                <span className="text-[5rem] lg:text-[6rem] tracking-tighter text-slate-800 leading-none" style={{ fontWeight: 700, fontFamily: "'Instrument Serif', serif" }}>
                                  {weatherData ? weatherData.temperature : '24'}°
                                </span>
                                <span className="text-xl lg:text-2xl text-slate-400 mt-2" style={{ fontWeight: 400 }}>
                                  {weatherData ? weatherData.condition.toLowerCase() : 'rainy'}
                                </span>
                              </div>

                              <div className="flex flex-col gap-3 lg:gap-4">
                                <div className="flex items-center gap-3 px-5 py-2 lg:px-6 lg:py-2.5 rounded-full bg-white/25 border border-white/30 min-w-[130px] lg:min-w-[150px]">
                                  <Wind className="w-5 h-5 text-slate-400" />
                                  <span className="text-sm lg:text-base text-slate-600" style={{ fontWeight: 500 }}>
                                    {Math.round(weatherData.windSpeed)} km/h
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 px-5 py-2 lg:px-6 lg:py-2.5 rounded-full bg-white/25 border border-white/30 min-w-[130px] lg:min-w-[150px]">
                                  <Droplets className="w-5 h-5 text-sky-400" />
                                  <span className="text-sm lg:text-base text-slate-600" style={{ fontWeight: 500 }}>
                                    {weatherData.humidity}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex-[0.4] flex flex-col justify-end w-full pt-2">
                            <div className="h-full w-full p-5 lg:p-6 rounded-3xl bg-gradient-to-r from-sky-50/60 to-rose-50/60 border border-white/30 flex items-center justify-center shadow-[inset_0_1px_8px_rgba(255,255,255,0.4)]">
                              <p className="text-base lg:text-lg text-slate-700 leading-relaxed" style={{ fontWeight: 500 }}>
                                {weatherData.condition.toLowerCase().includes('rain')
                                  ? `Rainy mood — we queued `
                                  : weatherData.condition.toLowerCase().includes('snow')
                                    ? `Snowy vibes — we queued `
                                    : weatherData.condition.toLowerCase().includes('clear') || weatherData.condition.toLowerCase().includes('sunny')
                                      ? `Sunny day — we queued `
                                      : `Perfect weather — we queued `
                                }
                                <span className="text-rose-500" style={{ fontWeight: 600 }}>
                                  {`some tracks`}
                                </span>
                                {' '}for this weather.
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-[0.6] flex items-center justify-center w-full">
                            <div className="flex items-center gap-4 lg:gap-8">
                              <div className="flex flex-col items-center">
                                <span className="text-[5rem] lg:text-[6rem] tracking-tighter text-slate-800 leading-none" style={{ fontWeight: 700, fontFamily: "'Instrument Serif', serif" }}>
                                  24°
                                </span>
                                <span className="text-xl lg:text-2xl text-slate-400 mt-2" style={{ fontWeight: 400 }}>
                                  rainy
                                </span>
                              </div>

                              <div className="w-px h-24 lg:h-32 bg-slate-300/40"></div>

                              <div className="flex flex-col gap-3 lg:gap-4">
                                <div className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2.5 rounded-full bg-white/25 border border-white/30">
                                  <Wind className="w-4 h-4 text-slate-400" />
                                  <span className="text-sm lg:text-base text-slate-600" style={{ fontWeight: 500 }}>
                                    12 km/h
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2.5 rounded-full bg-white/25 border border-white/30">
                                  <Droplets className="w-4 h-4 text-sky-400" />
                                  <span className="text-sm lg:text-base text-slate-600" style={{ fontWeight: 500 }}>
                                    84%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex-[0.4] flex flex-col justify-end w-full pt-2">
                            <div className="h-full w-full p-5 lg:p-6 rounded-3xl bg-gradient-to-r from-sky-50/60 to-rose-50/60 border border-white/30 flex items-center justify-center text-center shadow-[inset_0_1px_8px_rgba(255,255,255,0.4)]">
                              <p className="text-base lg:text-lg text-slate-700 leading-relaxed" style={{ fontWeight: 500 }}>
                                Rainy day, jazz way — we queued{' '}
                                <span className="text-rose-500" style={{ fontWeight: 600 }}>lo-fi & soft piano</span> for this weather.
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-9 h-[500px] lg:h-full"
              >
                <div className="relative h-full bg-white/20 backdrop-blur-xl border border-white/40 p-7 rounded-3xl shadow-lg shadow-slate-900/[0.04] overflow-hidden flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-5 flex-shrink-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="text-[1rem] tracking-[0.15em] uppercase text-slate-400" style={{ fontWeight: 600 }}>AI Vibe Scan</span>
                        </div>
                        <p className="text-[13px] text-slate-500 max-w-xs" style={{ fontWeight: 400 }}>
                          Drop a photo. We&apos;ll read the vibe and match it to music.
                        </p>
                      </div>
                    </div>

                    <div className={`flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden w-full ${uploadedImage ? 'gap-5' : ''}`}>
                      <motion.button
                        layout
                        onClick={() => fileInputRef.current?.click()}
                        className={`group relative isolate h-full min-h-[120px] lg:min-h-0 flex-shrink-0 transition-all duration-300 ${
                          uploadedImage ? 'lg:w-[35%] w-full' : 'flex-1 w-full'
                        }`}
                      >
                        <div className="absolute inset-0 bg-slate-200/40 rounded-2xl transform translate-y-2.5 blur-[2px] transition-transform group-hover:translate-y-3 group-active:translate-y-0.5" />

                        <div className="relative h-full w-full bg-gradient-to-b from-white via-slate-50/80 to-slate-100/60 rounded-2xl border border-white/80 p-6 flex flex-col items-center justify-center text-center shadow-[inset_0_1px_8px_rgba(255,255,255,0.9),0_8px_16px_rgba(0,0,0,0.04)] transition-transform transform group-hover:-translate-y-0.5 group-active:translate-y-0.5 overflow-hidden">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />

                          <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                              backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)',
                              backgroundSize: '16px 16px',
                            }}
                          />

                          <div className="w-14 h-14 rounded-2xl bg-white shadow-md shadow-slate-200/50 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform duration-300 border border-slate-100">
                            <Camera className="w-6 h-6 text-slate-500 group-hover:text-rose-500 transition-colors" />
                          </div>
                          <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors" style={{ fontWeight: 600 }}>Scan Photo</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">tap or drag to upload</span>
                        </div>
                      </motion.button>

                      <AnimatePresence mode="wait">
                        {uploadedImage && (
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1 min-w-0 min-h-0 h-full relative rounded-2xl overflow-hidden border border-white/40 bg-white/20 backdrop-blur-sm flex flex-col"
                          >
                            <div className="absolute inset-0 z-0">
                              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10" />
                              <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover opacity-20 relative z-0" />
                            </div>

                            <div className="relative z-20 flex flex-col h-full w-full overflow-hidden">
                              {isAnalyzing ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/30 backdrop-blur-md">
                                  <div className="relative w-16 h-16 mb-4">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                                      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="3" />
                                      <circle
                                        cx="32" cy="32" r="28" fill="none"
                                        stroke="url(#scanGrad)" strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 28}`}
                                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - scanProgress / 100)}`}
                                        className="transition-all duration-100"
                                      />
                                      <defs>
                                        <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" stopColor="#f43f5e" />
                                          <stop offset="100%" stopColor="#f59e0b" />
                                        </linearGradient>
                                      </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Equalizer bars={4} active className="text-rose-400" />
                                    </div>
                                  </div>
                                  <p className="text-sm text-slate-700" style={{ fontWeight: 600 }}>Reading the vibe...</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">{scanProgress}% — detecting mood & color</p>
                                </div>
                              ) : apiError ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/30 backdrop-blur-md">
                                  <div className="text-red-500 mb-2">⚠️</div>
                                  <p className="text-sm text-slate-700 font-semibold">Error</p>
                                  <p className="text-[12px] text-slate-600 mt-2">{apiError}</p>
                                  <button
                                    onClick={() => { setUploadedImage(null); setScanResults(null); setApiError(null); }}
                                    className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600 transition-colors"
                                  >
                                    Try again
                                  </button>
                                </div>
                              ) : scanResults && scanResults.length > 0 ? (
                                <>
                                  <div className="p-3.5 border-b border-white/20 bg-white/30 backdrop-blur-md flex justify-between items-center flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                                      <span className="text-[11px] text-slate-600 tracking-wide uppercase" style={{ fontWeight: 600 }}>
                                        Matched · {scanResults.length} tracks
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => { setUploadedImage(null); setScanResults(null); }}
                                      className="text-[11px] text-slate-400 hover:text-rose-500 transition-colors"
                                      style={{ fontWeight: 500 }}
                                    >
                                      Reset
                                    </button>
                                  </div>
                                  <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1 scrollbar-hide relative">
                                    {scanResults.map((song, i) => (
                                      <motion.div
                                        key={song.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => playTrack(song, scanResults)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors cursor-pointer group"
                                      >
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-100 to-amber-50 flex items-center justify-center shadow-sm border border-white/50 flex-shrink-0 overflow-hidden">
                                          {song.artwork ? (
                                            <ImageWithFallback src={song.artwork} alt={song.title} className="w-full h-full object-cover" />
                                          ) : (
                                            <span className="text-[10px] text-slate-400" style={{ fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</span>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-[13px] text-slate-800 truncate" style={{ fontWeight: 600 }}>{song.title}</h4>
                                          <p className="text-[12px] text-rose-500 truncate" style={{ fontWeight: 600 }}>{song.artist}</p>
                                        </div>
                                        {currentTrack?.id === song.id && (
                                          <div className="flex-shrink-0">
                                            {isAudioPlaying ? (
                                              <Equalizer bars={3} active className="text-rose-400" />
                                            ) : (
                                              <Play className="w-4 h-4 text-rose-400" />
                                            )}
                                          </div>
                                        )}
                                      </motion.div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="flex-1 flex items-center justify-center bg-white/30 backdrop-blur-md">
                                  <p className="text-[12px] text-slate-400" style={{ fontWeight: 500 }}>No songs found</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline justify-between mb-7">
                <div>
                  <h3 className="text-2xl tracking-tight text-slate-800" style={{ fontWeight: 700 }}>
                    Curated{' '}
                    <span
                      style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }}
                      className="text-rose-400"
                    >
                      for you
                    </span>
                  </h3>
                  <p className="text-[13px] text-slate-400 mt-0.5" style={{ fontWeight: 400 }}>
                    {weatherData
                      ? `Based on your weather, time & listening history`
                      : 'Based on your weather, time & listening history'}
                  </p>
                </div>
                <button
                  className="flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-rose-500 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  View all
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {curatedSongs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
                  {curatedSongs.map((song, index) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
                      onClick={() => playTrack(song, curatedSongs)}
                      className="group cursor-pointer"
                      onMouseEnter={() => setHoveredAlbum(Number(song.id))}
                      onMouseLeave={() => setHoveredAlbum(null)}
                    >
                      <div className="relative rounded-2xl overflow-hidden bg-white/15 backdrop-blur-md border border-white/30 hover:border-white/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/[0.06]">
                        <div className="flex items-center gap-4 p-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden shadow-lg shadow-slate-900/10 flex-shrink-0 relative">
                            <ImageWithFallback
                              src={song.artwork}
                              alt={song.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <div className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                                {currentTrack?.id === song.id && isAudioPlaying ? (
                                  <Pause className="w-3.5 h-3.5 text-slate-800 fill-current" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 text-slate-800 fill-current ml-0.5" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <span className="text-[10px] tracking-[0.12em] uppercase text-rose-400 mb-1 block" style={{ fontWeight: 600 }}>
                              {song.album}
                            </span>
                            <h4 className="text-base text-slate-800 truncate leading-tight" style={{ fontWeight: 700 }}>
                              {song.title}
                            </h4>
                            <p className="text-[13px] text-slate-500 truncate mt-0.5">{song.artist}</p>
                            {song.duration && (
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[11px] text-slate-400">
                                  {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {curatedSongs.length === 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    {featured.map((album, index) => (
                      <motion.div
                        key={album.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        className="group cursor-pointer"
                        onMouseEnter={() => setHoveredAlbum(album.id)}
                        onMouseLeave={() => setHoveredAlbum(null)}
                      >
                        <div className="relative rounded-2xl overflow-hidden bg-white/15 backdrop-blur-md border border-white/30 hover:border-white/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/[0.06]">
                          <div className="flex items-center gap-4 p-3.5">
                            <div className="w-28 h-28 rounded-xl overflow-hidden shadow-lg shadow-slate-900/10 flex-shrink-0 relative">
                              <ImageWithFallback src={album.image} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                                  <Play className="w-4 h-4 text-slate-800 fill-current ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                              <span className="text-[10px] tracking-[0.12em] uppercase text-rose-400 mb-1 block" style={{ fontWeight: 600 }}>{album.genre}</span>
                              <h4 className="text-lg text-slate-800 truncate leading-tight" style={{ fontWeight: 700 }}>{album.title}</h4>
                              <p className="text-[13px] text-slate-500 truncate mt-0.5">{album.artist}</p>
                              <div className="flex items-center gap-3 mt-3">
                                <span className="text-[11px] text-slate-400">{album.listeners}</span>
                                {hoveredAlbum === album.id && (
                                  <Equalizer bars={4} active className="text-rose-400 ml-auto" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {regular.map((album, index) => (
                      <motion.div
                        key={album.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                        className="group cursor-pointer"
                        onMouseEnter={() => setHoveredAlbum(album.id)}
                        onMouseLeave={() => setHoveredAlbum(null)}
                      >
                        <div className="bg-white/12 backdrop-blur-sm border border-white/25 rounded-2xl p-3 hover:bg-white/25 hover:border-white/40 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/[0.04]">
                          <div className="aspect-square rounded-xl overflow-hidden mb-3 relative shadow-md shadow-slate-900/[0.06]">
                            <ImageWithFallback src={album.image} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                              <div className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md scale-75 group-hover:scale-100 transition-transform duration-300">
                                <Play className="w-3.5 h-3.5 text-slate-800 fill-current ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <div className="px-0.5">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider" style={{ fontWeight: 500 }}>{album.genre}</span>
                            </div>
                            <h4 className="text-[13px] text-slate-800 truncate" style={{ fontWeight: 600 }}>{album.title}</h4>
                            <p className="text-[11px] text-slate-400 truncate">{album.artist}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <motion.div
        className="hidden md:block fixed bottom-0 right-0 z-50"
        animate={{ left: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white/40 backdrop-blur-2xl border-t border-white/40 px-6 py-3">
          <div className="max-w-[1400px] mx-auto flex items-center gap-6">
            <div className="flex items-center gap-3 w-[240px]">
              <div
                className="w-11 h-11 rounded-lg overflow-hidden shadow-md flex-shrink-0 vinyl-spin"
                style={{ animationPlayState: isAudioPlaying ? 'running' : 'paused' }}
              >
                <ImageWithFallback
                  src={currentTrack?.artwork || nowPlayingData.image}
                  alt={currentTrack?.title || nowPlayingData.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] text-slate-800 truncate" style={{ fontWeight: 600 }}>
                  {currentTrack?.title || nowPlayingData.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentTrack?.artist || nowPlayingData.artist}
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-4">
                <button onClick={handlePrevTrack} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleAudioPlayPause}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors shadow-md overflow-hidden relative"
                >
                  <AnimatePresence mode="wait">
                    {isAudioPlaying ? (
                      <motion.div
                        key="pause"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <Pause className="w-4 h-4 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="play"
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -180 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <Play className="w-4 h-4 text-white ml-0.5 fill-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <button onClick={handleNextTrack} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 w-full max-w-md">
                <span className="text-[10px] text-slate-400 w-8 text-right" style={{ fontWeight: 500 }}>
                  {currentTrack ? formatTime(audioElapsed) : nowPlayingData.elapsed}
                </span>
                <div className="flex-1 h-[3px] bg-slate-200/40 rounded-full overflow-hidden cursor-pointer group" onClick={handleProgressClick}>
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 to-amber-400 rounded-full relative transition-all group-hover:h-[4px]"
                    style={{ width: `${currentTrack ? audioProgress : nowPlayingData.progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 w-8" style={{ fontWeight: 500 }}>
                  {currentTrack ? formatTime(audioDuration) : nowPlayingData.duration}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-[140px] justify-end">
              <Equalizer bars={5} active={isAudioPlaying} className="text-rose-400" />
            </div>
          </div>
        </div>
      </motion.div>

      <nav className="md:hidden fixed bottom-5 left-5 right-5 z-50">
        <AnimatePresence>
          {isAudioPlaying && currentTrack && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-2 bg-white/50 backdrop-blur-2xl border border-white/50 rounded-2xl p-2.5 shadow-lg shadow-slate-900/10 flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-lg overflow-hidden shadow-sm flex-shrink-0 vinyl-spin"
                style={{ animationPlayState: isAudioPlaying ? 'running' : 'paused' }}
              >
                <ImageWithFallback
                  src={currentTrack.artwork}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-800 truncate" style={{ fontWeight: 600 }}>
                  {currentTrack.title}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentTrack.artist}
                </p>
              </div>
              <Equalizer bars={3} active className="text-rose-400 mr-1" />
              <button
                onClick={toggleAudioPlayPause}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden relative"
              >
                <AnimatePresence mode="wait">
                  {isAudioPlaying ? (
                    <motion.div
                      key="pause-mobile"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <Pause className="w-3 h-3 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="play-mobile"
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: -180 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-2xl p-2 shadow-xl shadow-slate-900/10">
          <div className="flex justify-around items-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex flex-col items-center gap-0.5 p-2.5 rounded-xl transition-all w-full relative ${activeNav === item.id
                  ? 'text-rose-500'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {activeNav === item.id && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-rose-50/60 border border-rose-100/50 rounded-xl"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className="w-5 h-5 relative z-10" />
                <span className="text-[10px] relative z-10" style={{ fontWeight: activeNav === item.id ? 600 : 400 }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.05); }
          50% { transform: translate(-15px, 15px) scale(0.95); }
          75% { transform: translate(10px, -10px) scale(1.02); }
        }
        @keyframes drift-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(1.08); }
          66% { transform: translate(15px, -25px) scale(0.93); }
        }
        @keyframes drift-reverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(30px, 10px) scale(1.06); }
          80% { transform: translate(-20px, -20px) scale(0.96); }
        }
        .animate-drift { animation: drift 14s ease-in-out infinite; }
        .animate-drift-slow { animation: drift-slow 18s ease-in-out infinite; }
        .animate-drift-reverse { animation: drift-reverse 16s ease-in-out infinite; }

        @keyframes rain-fall {
          0% { transform: translateY(-10px); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(200px); opacity: 0; }
        }
        .rain-drop { animation: rain-fall 1.2s linear infinite; }

        @keyframes vinyl-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .vinyl-spin { animation: vinyl-rotate 3s linear infinite; }
      `}</style>

      <audio ref={audioRef} crossOrigin="anonymous" />
    </div>
  );
}