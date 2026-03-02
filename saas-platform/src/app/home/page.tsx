'use client'

import { useState, useRef, useEffect } from 'react';
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import axios from 'axios';
import {
  CloudRain, Cloud, CloudSnow, Sun, CloudDrizzle, CloudLightning,
  Camera, Home, Search, User, Sparkles, Wind, Droplets, Settings, LogOut,
  Play, Pause, SkipForward, SkipBack, Disc3, Menu, X, AlertCircle, Loader
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { compressImage } from '@/lib/utils/image-compressor';

interface Song { id: string; title: string; artist: string; album: string; artwork: string; previewUrl?: string; duration?: number; }
interface WeatherData { temperature: number; weatherCode: number; humidity: number; windSpeed: number; condition: string; }
interface TodayVibeResponse { success: boolean; data: { weather: WeatherData; songs: Song[]; session: string; }; }

const covers = {
  desert: 'https://images.unsplash.com/photo-1548364504-57247d6f96bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNlcnQlMjBkdW5lcyUyMGdvbGRlbiUyMGhvdXJ8ZW58MXx8fHwxNzcxNDIzNDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  aurora: 'https://images.unsplash.com/photo-1549633760-9a0931220b84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3J0aGVybiUyMGxpZ2h0cyUyMGF1cm9yYSUyMHNreXxlbnwxfHx8fDE3NzE0MjM0NTB8MA&ixlib=rb-4.1.0&q=80&w=1080'
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

export default function AppDashboard() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [activeNav, setActiveNav] = useState('home');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResults, setScanResults] = useState<Song[] | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [curatedSongs, setCuratedSongs] = useState<Song[]>([]);
  const [session, setSession] = useState<string>('morning');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioElapsed, setAudioElapsed] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  const [clockTime, setClockTime] = useState<Date | null>(null);

  useEffect(() => {
    const fetchTodayVibe = async () => {
      try {
        const response = await axios.get<TodayVibeResponse>('/api/vibe-scan/today-vibe');
        if (response.data.success) {
          setWeatherData(response.data.data.weather);
          setCuratedSongs(response.data.data.songs);
          setSession(response.data.data.session);
        }
      } catch (error) { console.error(error); }
    };
    fetchTodayVibe();
  }, []);

  useEffect(() => {
    setClockTime(new Date());
    const interval = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
          } catch (error: any) {
            setApiError(error.message); setUploadedImage(null);
          } finally {
            setIsAnalyzing(false); clearInterval(interval);
          }
        };
        reader.readAsDataURL(file);
      } catch (error: any) {
        setApiError(error.message); setUploadedImage(null);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getGreeting = () => {
    const sessionTexts: any = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Late night' };
    return { text: sessionTexts[session] || 'Good morning', mood: session };
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'ai-scan', icon: Sparkles, label: 'AI Vibe Scan' },
  ];

  const hours = clockTime ? clockTime.getHours() : 0;
  const minutes = clockTime ? clockTime.getMinutes() : 0;
  const seconds = clockTime ? clockTime.getSeconds() : 0;
  const formattedTime = clockTime ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : '--:--:--';
  const secDeg = seconds * 6;
  const minDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="h-screen w-full bg-[#f8fafc] text-slate-900 flex overflow-hidden font-sans relative selection:bg-rose-200">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-200/40 mix-blend-multiply filter blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-sky-200/40 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[55vw] h-[55vw] rounded-full bg-amber-100/40 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[50px]" />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="absolute md:relative left-0 top-0 h-full bg-white/50 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.05)] flex-shrink-0 z-40 overflow-hidden"
      >
        <div className="flex flex-col h-full w-[260px] min-w-[260px] p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                <Disc3 className="w-5 h-5" />
              </div>
              <div className="text-xl font-bold tracking-tight">
                <span>Vibe</span><span className="text-rose-500 font-serif italic font-normal">Tune</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 text-slate-500 hover:bg-white rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); if(window.innerWidth < 768) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                  activeNav === item.id 
                  ? 'bg-white/80 border border-white text-slate-900 font-bold shadow-sm' 
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-800 font-semibold border border-transparent'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeNav === item.id ? 'text-rose-500' : ''}`} /> {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-4 border-t border-white/60 space-y-1">
            {/* <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-white/50 border border-transparent transition-colors">
              <Settings className="w-5 h-5" /> Settings
            </button> */}
            <button onClick={() => signOut({ redirectUrl: '/' })} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 border border-transparent transition-colors">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </motion.aside>

      <main className="flex-1 h-full overflow-y-auto pb-40 w-full p-6 md:p-10 relative z-10 scroll-smooth">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-sm text-slate-600 hover:bg-white transition-colors">
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 drop-shadow-sm">
                  {getGreeting().text}, <span className="text-rose-500 font-serif italic font-normal">{!isLoaded ? '...' : user?.firstName || 'Guest'}</span>
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{getGreeting().mood} session</p>
              </div>
            </div>
            {/* <button className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-sm flex items-center justify-center hover:bg-white transition-colors">
              <User className="w-5 h-5 text-slate-500" />
            </button> */}
          </div>

          {activeNav === 'home' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 h-auto lg:h-[340px]">
                
                <div className="bg-white/50 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between h-full">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weather & Mood</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto mb-8 px-2">
                    <div className="flex flex-col">
                      <span className="text-6xl md:text-[5.5rem] font-bold text-slate-900 font-serif tracking-tighter leading-none">
                        {weatherData ? weatherData.temperature : '24'}°
                      </span>
                      <span className="text-lg font-medium text-slate-500 mt-2 capitalize">{weatherData ? weatherData.condition : 'Rainy'}</span>
                    </div>
                    <div className="w-px h-20 bg-slate-300/40 mx-4"></div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-center min-w-[110px] gap-2 px-4 py-2.5 rounded-full bg-white/60 border border-white shadow-sm">
                        <Wind className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-bold text-slate-700">{weatherData ? Math.round(weatherData.windSpeed) : 12} km/h</span>
                      </div>
                      <div className="flex items-center justify-center min-w-[110px] gap-2 px-4 py-2.5 rounded-full bg-white/60 border border-white shadow-sm">
                        <Droplets className="w-4 h-4 text-sky-400 flex-shrink-0" />
                        <span className="text-sm font-bold text-slate-700">{weatherData ? weatherData.humidity : 84}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/60 border border-white/80 rounded-[1.5rem] p-4 text-center shadow-sm">
                    <p className="text-sm text-slate-700 font-medium">
                      Perfect weather — we queued <span className="text-rose-500 font-bold">{curatedSongs.length > 0 ? curatedSongs.length : 20} curated tracks</span> for this moment.
                    </p>
                  </div>
                </div>

                <div className="bg-white/50 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center h-full relative">
                  <div className="absolute top-8 left-8">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Local Time</span>
                  </div>
                  
                  <div className="relative w-36 h-36 mb-6 mt-4 drop-shadow-md">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
                      {Array.from({ length: 12 }).map((_, i) => (
                        <line key={i} x1="50" y1="8" x2="50" y2={i % 3 === 0 ? "14" : "11"} stroke={i % 3 === 0 ? "#475569" : "rgba(71,85,105,0.4)"} strokeWidth={i % 3 === 0 ? "2.5" : "1.5"} transform={`rotate(${i * 30} 50 50)`} />
                      ))}
                      <circle cx="50" cy="50" r="3" fill="#f43f5e" className="z-10" />
                      <line x1="50" y1="50" x2="50" y2="28" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" transform={`rotate(${hourDeg} 50 50)`} />
                      <line x1="50" y1="50" x2="50" y2="18" stroke="#475569" strokeWidth="3" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
                      <line x1="50" y1="58" x2="50" y2="12" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
                    </svg>
                  </div>
                  <h3 className="text-[3rem] font-bold text-slate-900 tracking-tighter font-serif leading-none">{formattedTime}</h3>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">Curated <span className="text-rose-500 font-serif italic font-normal">for you</span></h3>
                  <button className="text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors">View all &rarr;</button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(curatedSongs.length > 0 ? curatedSongs : [1,2,3,4,5,6].map(id=>({id: String(id), title: 'Loading...', artist: 'Please wait', album: 'Queue', artwork: covers.aurora})) as Song[]).map((song) => (
                    <div key={song.id} onClick={() => playTrack(song, curatedSongs)} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[1.5rem] p-3.5 shadow-sm hover:shadow-lg hover:bg-white transition-all cursor-pointer flex items-center gap-4 group">
                      <div className="w-16 h-16 rounded-[1rem] overflow-hidden relative flex-shrink-0 shadow-sm border border-white">
                        <ImageWithFallback src={song.artwork} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                          <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                            {currentTrack?.id === song.id && isAudioPlaying ? <Pause className="w-3.5 h-3.5 text-slate-900" /> : <Play className="w-3.5 h-3.5 text-slate-900 ml-0.5" />}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest truncate mb-0.5">{song.album}</p>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{song.title}</h4>
                        <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{song.artist}</p>
                      </div>
                      {currentTrack?.id === song.id && isAudioPlaying && (
                        <div className="pr-3">
                          <Equalizer bars={3} active className="text-rose-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeNav === 'ai-scan' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-[calc(100vh-220px)] flex flex-col">
              <div className="bg-white/50 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-1 flex flex-col lg:flex-row p-6 lg:p-8 gap-8 overflow-hidden relative">
                
                <motion.button
                  layout onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center bg-white/40 border-[3px] border-white/70 shadow-[inset_0_2px_15px_rgba(255,255,255,0.8)] rounded-[2rem] hover:bg-white/60 hover:shadow-[inset_0_2px_20px_rgba(255,255,255,1)] transition-all flex-shrink-0 overflow-hidden group ${uploadedImage ? 'w-full lg:w-[30%] h-40 lg:h-full' : 'w-full h-full'}`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <div className={`${uploadedImage ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'} rounded-full bg-gradient-to-br from-white to-slate-50 shadow-md border border-white flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <Camera className={`${uploadedImage ? 'w-5 h-5' : 'w-7 h-7'} text-slate-600`} />
                  </div>
                  <span className={`${uploadedImage ? 'text-sm' : 'text-base'} font-bold text-slate-800`}>Upload Photo</span>
                  {!uploadedImage && <span className="text-sm font-medium text-slate-500 mt-2">Let AI read the vibe</span>}
                </motion.button>

                <AnimatePresence mode="wait">
                  {uploadedImage && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="flex-1 min-h-0 min-w-0 relative bg-white/40 backdrop-blur-3xl rounded-[2rem] border border-white/80 shadow-lg overflow-hidden flex flex-col">
                      
                      <div className="absolute inset-0 z-0 overflow-hidden">
                         <img src={uploadedImage} alt="bg" className="w-full h-full object-cover opacity-20 filter blur-xl scale-110" />
                         <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-white/70" />
                      </div>

                      <div className="relative z-10 flex flex-col h-full">
                        {isAnalyzing ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <div className="relative w-20 h-20 mb-5 drop-shadow-md">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="4" />
                                <circle cx="32" cy="32" r="28" fill="none" stroke="url(#grad)" strokeWidth="4" strokeLinecap="round" strokeDasharray="175" strokeDashoffset={`${175 * (1 - scanProgress / 100)}`} className="transition-all duration-100" />
                                <defs><linearGradient id="grad"><stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#fb7185"/></linearGradient></defs>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="w-6 h-6 text-rose-500 animate-pulse" /></div>
                            </div>
                            <span className="font-bold text-slate-900 text-lg">Extracting Vibe...</span>
                            <span className="text-sm font-bold text-slate-500 mt-1">{scanProgress}%</span>
                          </div>
                        ) : apiError ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                            <p className="text-lg text-slate-900 font-bold mb-2">Analysis Failed</p>
                            <p className="text-sm text-slate-600 font-medium mb-6">{apiError}</p>
                            <button onClick={() => { setUploadedImage(null); setApiError(null); }} className="px-6 py-2.5 bg-rose-500 text-white text-sm font-bold rounded-full shadow-lg hover:bg-rose-600 hover:-translate-y-0.5 transition-transform">Try again</button>
                          </div>
                        ) : scanResults && scanResults.length > 0 ? (
                          <>
                            <div className="px-6 py-4 border-b border-white/50 bg-white/40 backdrop-blur-md flex justify-between items-center flex-shrink-0 z-20">
                              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Matched · {scanResults.length} tracks
                              </span>
                              <button onClick={() => { setUploadedImage(null); setScanResults(null); }} className="text-xs font-bold text-slate-500 hover:text-rose-500 transition-colors">Reset</button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide relative z-10">
                                {scanResults.map((song) => (
                                  <div key={song.id} onClick={() => playTrack(song, scanResults)} className="flex items-center gap-4 p-3 bg-white/60 border border-white/60 rounded-[1.25rem] hover:bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group">
                                    <ImageWithFallback src={song.artwork} alt={song.title} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-white" />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-bold text-slate-900 truncate">{song.title}</h4>
                                      <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{song.artist}</p>
                                    </div>
                                    {currentTrack?.id === song.id && isAudioPlaying ? <Equalizer bars={3} active className="text-rose-500 mr-3" /> : <Play className="w-5 h-5 text-slate-400 group-hover:text-rose-500 mr-3 transition-colors" />}
                                  </div>
                                ))}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <div className={`fixed bottom-6 right-0 z-50 pointer-events-none flex justify-center px-4 transition-all duration-300 ${sidebarOpen ? 'left-0 md:left-[260px]' : 'left-0'}`}>
        <div className="pointer-events-auto w-full max-w-[90%] md:max-w-3xl bg-white/80 backdrop-blur-3xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.08)] rounded-full px-4 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 w-[30%] min-w-0">
            <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-md border border-white ${isAudioPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
              <ImageWithFallback src={currentTrack?.artwork || covers.desert} alt="Cover" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 hidden sm:block flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{currentTrack?.title || 'No track'}</p>
              <p className="text-xs font-medium text-slate-500 truncate">{currentTrack?.artist || 'Ready to play'}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1.5 px-2 max-w-sm">
            <div className="flex items-center gap-6">
              <button onClick={handlePrevTrack} className="text-slate-400 hover:text-slate-800 transition-colors"><SkipBack className="w-4 h-4 fill-current" /></button>
              <button onClick={toggleAudioPlayPause} className="w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-white shadow-md transition-transform hover:scale-105">
                {isAudioPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button onClick={handleNextTrack} className="text-slate-400 hover:text-slate-800 transition-colors"><SkipForward className="w-4 h-4 fill-current" /></button>
            </div>
            <div className="flex items-center gap-3 w-full">
              <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{currentTrack ? formatTime(audioElapsed) : '0:00'}</span>
              <div className="flex-1 h-[4px] bg-slate-200/60 rounded-full overflow-hidden cursor-pointer group" onClick={handleProgressClick}>
                <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full relative transition-all" style={{ width: `${currentTrack ? audioProgress : 0}%` }} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 w-8">{currentTrack ? formatTime(audioDuration) : '0:00'}</span>
            </div>
          </div>

          <div className="w-[30%] flex justify-end pr-2">
             <Equalizer bars={4} active={isAudioPlaying} className="text-slate-400 hidden md:flex" />
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 15s infinite alternate; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
      <audio ref={audioRef} crossOrigin="anonymous" />
    </div>
  );
}