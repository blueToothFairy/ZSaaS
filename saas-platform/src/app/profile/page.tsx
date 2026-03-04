'use client'

import { useState, useRef, useEffect } from 'react';
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Home, Search, User, Sparkles, Settings, LogOut,
  Play, Pause, SkipForward, SkipBack, Disc3, Menu, X,
  Heart, Clock, MoreHorizontal, Share2, MapPin, CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// --- Interfaces & Mock Data ---
interface Song { id: string; title: string; artist: string; album: string; artwork: string; duration: string; addedAt: string; previewUrl?: string; }

const covers = {
  desert: 'https://images.unsplash.com/photo-1548364504-57247d6f96bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNlcnQlMjBkdW5lcyUyMGdvbGRlbiUyMGhvdXJ8ZW58MXx8fHwxNzcxNDIzNDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  aurora: 'https://images.unsplash.com/photo-1549633760-9a0931220b84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3J0aGVybiUyMGxpZ2h0cyUyMGF1cm9yYSUyMHNreXxlbnwxfHx8fDE3NzE0MjM0NTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
  city: 'https://images.unsplash.com/photo-1631379879495-23a8e79abed9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZW9uJTIwY2l0eSUyMHJhaW4lMjBzdHJlZXR8ZW58MXx8fHwxNzcxNDIzNDQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  cafe: 'https://images.unsplash.com/photo-1715139718837-f9efc78cddc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb29keSUyMGphenolMjBjYWZlJTIwbmlnaHR8ZW58MXx8fHwxNzcxNDIzNDQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  profileBanner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGxhbmRzY2FwZSUyMGFydHxlbnwxfHx8fDE3NzE4MzQ1MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
};

const favoriteTracks: Song[] = [
  { id: '1', title: 'Midnight in Shibuya', artist: 'Neon Collective', album: 'City Lights', artwork: covers.city, duration: '3:42', addedAt: '2 days ago' },
  { id: '2', title: 'Sunday Mornings', artist: 'Amber & Co.', album: 'Acoustic Sessions', artwork: covers.cafe, duration: '2:55', addedAt: '1 week ago' },
  { id: '3', title: 'Velvet Dunes', artist: 'Solar Winds', album: 'Mirage', artwork: covers.desert, duration: '4:18', addedAt: '2 weeks ago' },
  { id: '4', title: 'Northern Whispers', artist: 'Boreal', album: 'Aurora', artwork: covers.aurora, duration: '5:02', addedAt: '1 month ago' },
  { id: '5', title: 'Rainy Day Tape', artist: 'The Window Seat', album: 'Lo-Fi Study', artwork: covers.cafe, duration: '2:34', addedAt: '2 months ago' },
];

function Equalizer({ bars = 4, active = true, className = '' }: { bars?: number; active?: boolean; className?: string }) {
  return (
    <div className={`flex items-end gap-[2px] h-3 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div key={i} className="w-[3px] rounded-full bg-current origin-bottom" animate={active ? { scaleY: [0.3, 1, 0.4, 0.9, 0.3] } : { scaleY: 0.3 }} transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }} style={{ height: '100%' }} />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [activeNav, setActiveNav] = useState('profile');
  const [activeTab, setActiveTab] = useState('favorites');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'ai-scan', icon: Sparkles, label: 'AI Vibe Scan', path: '/ai-scan' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  const profileTabs = [
    { id: 'favorites', label: 'Favorite Tracks' },
    { id: 'playlists', label: 'My Playlists' },
    { id: 'recent', label: 'Recently Played' },
  ];

  const togglePlay = (song: Song) => {
    if (currentTrack?.id === song.id) {
      setIsAudioPlaying(!isAudioPlaying);
    } else {
      setCurrentTrack(song);
      setIsAudioPlaying(true);
    }
  };

  return (
    <div className="h-screen w-full bg-[#f8fafc] text-slate-900 flex overflow-hidden font-sans relative selection:bg-rose-200">
      
      {/* ─── Animated Colorful Glassmorphism Background ─── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-200/40 mix-blend-multiply filter blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-sky-200/40 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[55vw] h-[55vw] rounded-full bg-amber-100/40 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[50px]" />
      </div>

      {/* ─── Sidebar (Mobile Overlay) ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30" />
        )}
      </AnimatePresence>

      {/* ─── Sidebar ────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : (typeof window !== 'undefined' && window.innerWidth >= 768 ? 260 : 0) }}
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
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-white/50 border border-transparent transition-colors">
              <Settings className="w-5 h-5" /> Settings
            </button>
            <button onClick={() => signOut({ redirectUrl: '/' })} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 border border-transparent transition-colors">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ─── Main Content ────────────────────────────────────── */}
      <main className="flex-1 h-full overflow-y-auto pb-40 w-full relative z-10 scroll-smooth">
        
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-sm text-slate-600 hover:bg-white transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 md:px-10 pt-4 md:pt-10">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            
            {/* ─── Profile Banner & Info Card ─── */}
            <div className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-10 relative">
              {/* Banner Image */}
              <div className="h-40 md:h-56 w-full relative">
                <ImageWithFallback src={covers.profileBanner} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute inset-0 backdrop-blur-sm bg-black/10" />
              </div>

              {/* Profile Details (Overlapping Banner) */}
              <div className="px-8 pb-8 relative">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 md:-mt-20 mb-6">
                  <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                    {/* Avatar */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/80 shadow-2xl overflow-hidden bg-slate-100 flex-shrink-0 relative z-10">
                      {isLoaded && user?.imageUrl ? (
                        <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-100 to-sky-100 text-slate-400">
                          <User className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    {/* Name & Meta */}
                    <div className="pb-2">
                      <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-2">
                        {isLoaded && user ? `${user.firstName} ${user.lastName || ''}` : 'Alex Listener'}
                      </h1>
                      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-rose-400" /> Vietnam</span>
                        <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-sky-400" /> Joined 2026</span>
                        <span className="px-2.5 py-1 rounded-full bg-white/60 border border-white shadow-sm text-slate-700">Premium Member</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3 pb-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-lg transition-transform hover:-translate-y-0.5">
                      Edit Profile
                    </button>
                    <button className="p-2.5 rounded-full bg-white/60 hover:bg-white border border-white/80 shadow-sm text-slate-600 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 border-t border-white/50 pt-6 mt-4">
                  <div>
                    <p className="text-2xl font-bold text-slate-900 font-serif">128</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Favorites</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 font-serif">14</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Playlists</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 font-serif">45</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Following</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Tabs & Content ─── */}
            <div>
              {/* Custom Tabs */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
                {profileTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                      activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-sm border border-white/80'
                      : 'text-slate-500 hover:bg-white/40 border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Favorites Tracklist */}
              <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/60 p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                
                {/* List Header */}
                <div className="hidden md:grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 pb-3 border-b border-white/50 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <div className="w-12 text-center">#</div>
                  <div>Title</div>
                  <div>Album</div>
                  <div className="w-24 text-right">Date Added</div>
                  <div className="w-16 text-center"><Clock className="w-4 h-4 inline-block" /></div>
                </div>

                {/* List Items */}
                <div className="mt-3 space-y-2">
                  {favoriteTracks.map((song, index) => {
                    const isPlaying = currentTrack?.id === song.id && isAudioPlaying;
                    return (
                      <div 
                        key={song.id} 
                        onClick={() => togglePlay(song)}
                        className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-3 md:gap-4 p-3 rounded-2xl hover:bg-white/60 hover:shadow-sm border border-transparent hover:border-white/80 transition-all cursor-pointer"
                      >
                        {/* Column 1: Index / Play Icon & Cover */}
                        <div className="flex items-center gap-3 md:gap-4 w-auto md:w-auto">
                          <div className="w-6 text-center hidden md:block">
                            {isPlaying ? (
                              <Equalizer bars={3} active className="text-rose-500 mx-auto" />
                            ) : (
                              <span className="text-sm font-semibold text-slate-400 group-hover:hidden">{index + 1}</span>
                            )}
                            <Play className="w-4 h-4 text-slate-900 mx-auto hidden group-hover:block ml-1" />
                          </div>
                          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm relative flex-shrink-0">
                            <ImageWithFallback src={song.artwork} alt={song.title} className="w-full h-full object-cover" />
                            {/* Mobile play overlay */}
                            <div className="md:hidden absolute inset-0 bg-black/10 flex items-center justify-center">
                               {isPlaying ? <Equalizer bars={3} active className="text-white" /> : <Play className="w-5 h-5 text-white/80 ml-0.5" />}
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Title & Artist */}
                        <div className="min-w-0 pr-2">
                          <h4 className={`text-sm font-bold truncate ${isPlaying ? 'text-rose-500' : 'text-slate-900'}`}>{song.title}</h4>
                          <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{song.artist}</p>
                        </div>

                        {/* Column 3: Album (Desktop) */}
                        <div className="hidden md:block min-w-0 pr-2">
                          <p className="text-sm font-medium text-slate-500 truncate hover:text-slate-700">{song.album}</p>
                        </div>

                        {/* Column 4: Date Added (Desktop) */}
                        <div className="hidden md:block w-24 text-right">
                          <p className="text-xs font-medium text-slate-400">{song.addedAt}</p>
                        </div>

                        {/* Column 5: Time & Actions */}
                        <div className="flex items-center justify-end gap-3 md:gap-6 w-auto md:w-16">
                          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                          <span className="text-sm font-medium text-slate-500 hidden md:block">{song.duration}</span>
                          <button className="text-slate-400 hover:text-slate-900 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </main>

      {/* ─── Floating Bottom Player (Island Design) ──────────────────────────────── */}
      <div className={`fixed bottom-6 right-0 z-50 pointer-events-none flex justify-center px-4 transition-all duration-300 ${sidebarOpen ? 'left-0 md:left-[260px]' : 'left-0'}`}>
        <div className="pointer-events-auto w-full max-w-[90%] md:max-w-3xl bg-white/80 backdrop-blur-3xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.08)] rounded-full px-4 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 w-[40%] md:w-[30%] min-w-0">
            <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-md border border-white ${isAudioPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
              <ImageWithFallback src={currentTrack?.artwork || covers.desert} alt="Cover" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{currentTrack?.title || 'No track'}</p>
              <p className="text-xs font-medium text-slate-500 truncate">{currentTrack?.artist || 'Ready to play'}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1.5 px-2 max-w-sm">
            <div className="flex items-center gap-4 md:gap-6">
              <button className="text-slate-400 hover:text-slate-800 transition-colors hidden md:block"><SkipBack className="w-4 h-4 fill-current" /></button>
              <button onClick={() => setIsAudioPlaying(!isAudioPlaying)} className="w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-white shadow-md transition-transform hover:scale-105">
                {isAudioPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button className="text-slate-400 hover:text-slate-800 transition-colors"><SkipForward className="w-4 h-4 fill-current" /></button>
            </div>
            <div className="hidden md:flex items-center gap-3 w-full">
              <span className="text-[10px] font-bold text-slate-400 w-8 text-right">0:00</span>
              <div className="flex-1 h-[4px] bg-slate-200/60 rounded-full overflow-hidden cursor-pointer">
                <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full relative" style={{ width: `30%` }} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 w-8">3:42</span>
            </div>
          </div>

          <div className="w-auto md:w-[30%] flex justify-end pr-2 gap-3">
             <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
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
    </div>
  );
}