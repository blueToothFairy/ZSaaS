'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'
import {
  Disc3, Play, Sparkles, CloudSun, Camera, ArrowRight,
  ChevronRight, Star, Headphones, Zap,
  ListMusic, Globe, Menu, X
} from 'lucide-react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

// ─── Images ──────────────────────────────────────────────────
const images = {
  heroWoman: 'https://images.unsplash.com/photo-1655468289134-bb764181b0e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGhlYWRwaG9uZXMlMjBsaXN0ZW5pbmclMjBtdXNpYyUyMHNtaWxpbmd8ZW58MXx8fHwxNzcxNzQyNzk0fDA&ixlib=rb-4.1.0&q=80&w=1080',
  concert: 'https://images.unsplash.com/photo-1619973226698-b77a5b5dd14b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBtdXNpYyUyMGZlc3RpdmFsJTIwbGlnaHRzfGVufDF8fHx8MTc3MTY2ODUwMHww&ixlib=rb-4.1.0&q=80&w=1080',
  avatarWoman: 'https://images.unsplash.com/photo-1767439567636-792a76f6e4b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwcG9ydHJhaXQlMjBjcmVhdGl2ZSUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NzE2NjcxODJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  avatarMan: 'https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMHNtaWxpbmclMjBjYXN1YWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE3NDI3OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  avatarStudio: 'https://images.unsplash.com/photo-1768919533164-1695daa801e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBoZWFkcGhvbmVzJTIwc3R1ZGlvJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNzQyNzk1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  albumNeon: 'https://images.unsplash.com/photo-1631379879495-23a8e79abed9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZW9uJTIwY2l0eSUyMHJhaW4lMjBzdHJlZXR8ZW58MXx8fHwxNzcxNDIzNDQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  albumForest: 'https://images.unsplash.com/photo-1601307426703-20d19577e455?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb2dneSUyMGZvcmVzdCUyMG1vcm5pbmd8ZW58MXx8fHwxNzcxNDIzNDQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
  albumDesert: 'https://images.unsplash.com/photo-1548364504-57247d6f96bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNlcnQlMjBkdW5lcyUyMGdvbGRlbiUyMGhvdXJ8ZW58MXx8fHwxNzcxNDIzNDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  albumAurora: 'https://images.unsplash.com/photo-1549633760-9a0931220b84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3J0aGVybiUyMGxpZ2h0cyUyMGF1cm9yYSUyMHNreXxlbnwxfHx8fDE3NzE0MjM0NTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
  albumAbstract: 'https://images.unsplash.com/photo-1616941351479-0072624fca9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHBhaW50aW5nJTIwdGV4dHVyZSUyMHdhcm18ZW58MXx8fHwxNzcxNDIzNDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  albumOcean: 'https://images.unsplash.com/photo-1718067634803-8c369340bd54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvY2VhbiUyMHN1bnNldCUyMHBhc3RlbHxlbnwxfHx8fDE3NzE0MjM0NDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
};

// ─── Data ────────────────────────────────────────────────────
const stats = [
  { value: '2.4M+', label: 'Active listeners', icon: Headphones },
  { value: '180K', label: 'Playlists generated', icon: ListMusic },
  { value: '98%', label: 'Vibe accuracy', icon: Zap },
  { value: '140+', label: 'Countries', icon: Globe },
];

const features = [
  {
    icon: CloudSun,
    tag: 'Weather · Playlist',
    title: 'Sky sets the tone',
    description: 'Real-time weather data shapes your soundtrack. Rainy morning? Warm lo-fi. Sunny afternoon? Upbeat indie. Your environment becomes the DJ.',
    gradient: 'from-sky-400 to-blue-500',
    image: images.albumForest,
  },
  {
    icon: Camera,
    tag: 'AI Vibe Scan',
    title: 'Photos become playlists',
    description: 'Snap a photo or drop an image — our AI reads color, mood, and energy to generate a perfectly matched tracklist in seconds.',
    gradient: 'from-rose-400 to-amber-500',
    image: images.albumAbstract,
  },
  {
    icon: Sparkles,
    tag: 'Smart Curation',
    title: 'It learns your taste',
    description: 'The more you listen, the sharper it gets. VibeTune blends your history, the time of day, and current vibe into a feed that feels handpicked.',
    gradient: 'from-violet-400 to-purple-500',
    image: images.albumAurora,
  },
];

const steps = [
  { num: '01', title: 'Open VibeTune', description: 'Launch the app and let it sense your environment — weather, time, location.' },
  { num: '02', title: 'Set the vibe', description: 'Upload a photo, choose a mood, or just let the AI figure it out for you.' },
  { num: '03', title: 'Press play', description: 'Your personalized playlist is ready. Sit back and let the music match the moment.' },
];

const testimonials = [
  {
    quote: "I uploaded a sunset photo from my trip and it generated the most perfect playlist. I listen to it every evening now.",
    name: 'Mia Chen',
    role: 'Photographer',
    avatar: images.avatarWoman,
    rating: 5,
  },
  {
    quote: "The weather feature is addictive. Rainy days in London have never sounded this good. It just gets the mood right.",
    name: 'James Okafor',
    role: 'Music Producer',
    avatar: images.avatarStudio,
    rating: 5,
  },
  {
    quote: "Other apps recommend what's popular. VibeTune recommends what I actually want to hear. Big difference.",
    name: 'Leo Martinez',
    role: 'UX Designer',
    avatar: images.avatarMan,
    rating: 5,
  },
];

const footerLinks = {
  Product: ['Features', 'Pricing', 'Download', 'Changelog'],
  Company: ['About', 'Careers', 'Blog', 'Press'],
  Resources: ['Help Center', 'Community', 'API Docs', 'Status'],
  Legal: ['Privacy', 'Terms', 'Cookies', 'Licenses'],
};

// ─── Equalizer (inline) ─────────────────────────────────────
function Equalizer({ bars = 5, active = true, className = '' }: { bars?: number; active?: boolean; className?: string }) {
  return (
    <div className={`flex items-end gap-[2px] h-3.5 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2.5px] rounded-full bg-current origin-bottom"
          animate={active ? { scaleY: [0.3, 1, 0.5, 0.8, 0.3] } : { scaleY: 0.3 }}
          transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
          style={{ height: '100%' }}
        />
      ))}
    </div>
  );
}

// ─── Animated counter ────────────────────────────────────────
function AnimatedStat({ value, label, icon: Icon }: { value: string; label: string; icon: typeof Headphones }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <Icon className="w-5 h-5 text-rose-400 mx-auto mb-2" />
      <p className="text-2xl md:text-3xl tracking-tight text-slate-800" style={{ fontWeight: 700 }}>{value}</p>
      <p className="text-[12px] text-slate-400 mt-0.5 tracking-wide" style={{ fontWeight: 500 }}>{label}</p>
    </motion.div>
  );
}

// ─── Section reveal wrapper ──────────────────────────────────
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Main Landing Page ───────────────────────────────────────
export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], [0, 1]);
  const [navOpacity, setNavOpacity] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = navBg.on('change', (v) => setNavOpacity(v));
    return unsubscribe;
  }, [navBg]);

  const heroParallax = useTransform(scrollY, [0, 600], [0, -120]);
  const heroAlbumsParallax = useTransform(scrollY, [0, 600], [0, -60]);

  const navLinks = ['Features', 'How it works', 'Testimonials', 'Pricing'];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-rose-100/80 via-amber-50 to-sky-100/60 text-slate-800 selection:bg-rose-200 overflow-x-hidden"
      style={{ fontFamily: "'Sora', sans-serif" }}
    >
      {/* Grain texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* Ambient shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] bg-rose-300/20 rounded-full blur-[100px] animate-drift" />
        <div className="absolute top-[30%] right-[-15%] w-[55%] h-[40%] bg-amber-200/25 rounded-full blur-[120px] animate-drift-slow" />
        <div className="absolute bottom-[-10%] left-[30%] w-[40%] h-[35%] bg-sky-200/20 rounded-full blur-[100px] animate-drift-reverse" />
      </div>

      {/* ─── Navbar ──────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: `rgba(255,255,255,${navOpacity * 0.35})`,
          backdropFilter: `blur(${navOpacity * 24}px)`,
          WebkitBackdropFilter: `blur(${navOpacity * 24}px)`,
          borderBottom: `1px solid rgba(255,255,255,${navOpacity * 0.4})`,
          boxShadow: navOpacity > 0.5 ? `0 4px 30px rgba(0,0,0,${navOpacity * 0.03})` : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 md:h-[72px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white shadow-md shadow-rose-400/20">
              <Disc3 className="w-4.5 h-4.5" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg tracking-tight text-slate-800" style={{ fontWeight: 700 }}>Vibe</span>
              <span className="text-lg tracking-tight text-rose-500" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>Tune</span>
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => scrollToSection(link.toLowerCase().replace(/\s+/g, '-'))}
                className="text-[13px] text-slate-500 hover:text-slate-800 transition-colors"
                style={{ fontWeight: 500 }}
              >
                {link}
              </button>
            ))}
          </div>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/sign-in')}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[13px] shadow-lg shadow-slate-900/10 transition-colors" style={{ fontWeight: 600 }}>
              Get started free
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-lg bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-slate-700" /> : <Menu className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden bg-white/50 backdrop-blur-2xl border-t border-white/30"
            >
              <div className="px-5 py-4 space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link}
                    onClick={() => scrollToSection(link.toLowerCase().replace(/\s+/g, '-'))}
                    className="block w-full text-left px-4 py-3 rounded-xl text-[14px] text-slate-600 hover:bg-white/40 transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    {link}
                  </button>
                ))}
                <button 
                  onClick={() => router.push('/sign-in')}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 text-white text-[14px] shadow-lg" style={{ fontWeight: 600 }}>
                  Get started free
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative z-10 pt-28 md:pt-36 pb-20 md:pb-28 px-5 md:px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left — Copy */}
            <motion.div
              style={{ y: heroParallax }}
              className="relative z-10"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/30 backdrop-blur-sm border border-white/40">
                    <Equalizer bars={3} active className="text-rose-400" />
                    <span className="text-[11px] text-slate-600 tracking-wide" style={{ fontWeight: 600 }}>Now in open beta</span>
                  </div>
                </div>

                <h1 className="text-[2.75rem] md:text-[3.75rem] lg:text-[4.25rem] tracking-tight text-slate-800 leading-[1.05]" style={{ fontWeight: 700 }}>
                  Music that{' '}
                  <span
                    style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500"
                  >
                    feels
                  </span>
                  <br />
                  like the moment
                </h1>

                <p className="text-base md:text-lg text-slate-500 mt-5 max-w-md leading-relaxed" style={{ fontWeight: 400 }}>
                  VibeTune reads your weather, photos, and mood to generate playlists that match exactly where you are — right now.
                </p>

                <div className="flex flex-wrap gap-3 mt-8">
                  <button 
                    onClick={() => router.push('/sign-in')}
                    className="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-[14px] shadow-xl shadow-slate-900/15 transition-all hover:-translate-y-0.5" style={{ fontWeight: 600 }}>
                    <Play className="w-4 h-4 fill-current" />
                    Start listening
                  </button>
                </div>

                {/* Social proof mini */}
                
              </motion.div>
            </motion.div>

            {/* Right — Floating album cards */}
            <motion.div
              style={{ y: heroAlbumsParallax }}
              className="relative h-[400px] md:h-[480px] lg:h-[520px]"
            >
              {/* Main hero image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: -2 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-[5%] left-[8%] w-[65%] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/15 z-20"
              >
                <ImageWithFallback src={images.heroWoman} alt="Listening to music" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                {/* Mini player overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                      <ImageWithFallback src={images.albumDesert} alt="Album" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-white truncate" style={{ fontWeight: 600 }}>Golden Hour Drive</p>
                      <p className="text-[10px] text-white/60 truncate">Sunset Boulevard</p>
                    </div>
                    <Equalizer bars={4} active className="text-white/80" />
                  </div>
                </div>
              </motion.div>

              {/* Floating card 1 */}
              <motion.div
                initial={{ opacity: 0, x: 40, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-[2%] right-[0%] w-32 h-32 rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 z-30 rotate-6 hover:rotate-3 transition-transform duration-300"
              >
                <ImageWithFallback src={images.albumNeon} alt="Album" className="w-full h-full object-cover" />
              </motion.div>

              {/* Floating card 2 */}
              <motion.div
                initial={{ opacity: 0, x: 30, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-[8%] right-[5%] w-36 h-36 rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 z-30 -rotate-3 hover:rotate-0 transition-transform duration-300"
              >
                <ImageWithFallback src={images.albumOcean} alt="Album" className="w-full h-full object-cover" />
              </motion.div>

              {/* Glass tag */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute bottom-[25%] left-[0%] z-40 bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl px-4 py-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <CloudSun className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-[11px] text-slate-700" style={{ fontWeight: 600 }}>Weather match</p>
                    <p className="text-[10px] text-slate-400">Sunny · 26°</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ───────────────────────────────────────── */}
      <section className="relative z-10 py-12 px-5 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/20 backdrop-blur-xl border border-white/40 rounded-3xl p-8 md:p-10 shadow-lg shadow-slate-900/[0.03]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <AnimatedStat key={stat.label} value={stat.value} label={stat.label} icon={stat.icon} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-20 md:py-28 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-[11px] text-slate-400 tracking-[0.15em] uppercase mb-3" style={{ fontWeight: 600 }}>Features</p>
              <h2 className="text-3xl md:text-[2.75rem] tracking-tight text-slate-800 leading-tight" style={{ fontWeight: 700 }}>
                Not just playlists.{' '}
                <span
                  style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500"
                >
                  Experiences.
                </span>
              </h2>
              <p className="text-base text-slate-400 mt-3 max-w-lg mx-auto" style={{ fontWeight: 400 }}>
                Three AI-powered features that transform how you discover and connect with music.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((feat, i) => (
              <Reveal key={feat.title} delay={i * 0.1}>
                <div className="group relative h-full bg-white/20 backdrop-blur-xl border border-white/40 rounded-3xl overflow-hidden shadow-lg shadow-slate-900/[0.03] hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

                  {/* Image */}
                  <div className="h-48 overflow-hidden relative">
                    <ImageWithFallback
                      src={feat.image}
                      alt={feat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent" />
                    <div className={`absolute top-4 left-4 w-10 h-10 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center text-white shadow-lg`}>
                      <feat.icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 pt-4">
                    <span className="text-[10px] tracking-[0.12em] uppercase text-slate-400 mb-2 block" style={{ fontWeight: 600 }}>{feat.tag}</span>
                    <h3 className="text-xl tracking-tight text-slate-800 mb-2" style={{ fontWeight: 700 }}>{feat.title}</h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed" style={{ fontWeight: 400 }}>{feat.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-20 md:py-28 px-5 md:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-[11px] text-slate-400 tracking-[0.15em] uppercase mb-3" style={{ fontWeight: 600 }}>How it works</p>
              <h2 className="text-3xl md:text-[2.75rem] tracking-tight text-slate-800 leading-tight" style={{ fontWeight: 700 }}>
                Three steps to your{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }} className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
                  perfect sound
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <Reveal key={step.num} delay={i * 0.12}>
                <div className="relative bg-white/15 backdrop-blur-md border border-white/30 rounded-3xl p-7 hover:bg-white/25 transition-all duration-300 group">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                  <span
                    className="text-5xl tracking-tighter text-rose-300/40 block mb-4"
                    style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}
                  >
                    {step.num}
                  </span>
                  <h3 className="text-lg tracking-tight text-slate-800 mb-2" style={{ fontWeight: 700 }}>{step.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed" style={{ fontWeight: 400 }}>{step.description}</p>

                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-rose-300/40 to-transparent" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── App Preview ─────────────────────────────────────── */}
      <section className="relative z-10 py-20 md:py-28 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="relative bg-white/20 backdrop-blur-xl border border-white/40 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-900/[0.06]">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

              <div className="grid md:grid-cols-2 gap-0">
                {/* Left — copy */}
                <div className="p-10 md:p-14 flex flex-col justify-center">
                  <p className="text-[11px] text-slate-400 tracking-[0.15em] uppercase mb-3" style={{ fontWeight: 600 }}>The experience</p>
                  <h2 className="text-3xl md:text-4xl tracking-tight text-slate-800 leading-tight mb-4" style={{ fontWeight: 700 }}>
                    Designed to feel{' '}
                    <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }} className="text-rose-400">
                      human
                    </span>
                  </h2>
                  <p className="text-[14px] text-slate-500 leading-relaxed mb-8" style={{ fontWeight: 400 }}>
                    Every detail is crafted to feel warm, intuitive, and personal. From the animated equalizer in the sidebar to the weather-aware playlist generator — VibeTune adapts to you, not the other way around.
                  </p>

                  <div className="space-y-4">
                    {[
                      { label: 'Glassmorphic interface', desc: 'Soft, frosted-glass cards that breathe' },
                      { label: 'Context-aware AI', desc: 'Weather, time, and mood shape every recommendation' },
                      { label: 'Photo-to-playlist', desc: 'Drop an image and get instant vibe-matched tracks' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div>
                          <p className="text-[13px] text-slate-800" style={{ fontWeight: 600 }}>{item.label}</p>
                          <p className="text-[12px] text-slate-400" style={{ fontWeight: 400 }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — preview image (concert) */}
                <div className="relative h-[300px] md:h-auto overflow-hidden">
                  <ImageWithFallback src={images.concert} alt="VibeTune experience" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/20" />

                  {/* Floating glass cards on top of image */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md">
                        <ImageWithFallback src={images.albumAurora} alt="Playing" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white truncate" style={{ fontWeight: 600 }}>Northern</p>
                        <p className="text-[11px] text-white/60 truncate">Boreal · Electronic</p>
                        <div className="mt-1.5 h-[3px] bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-rose-400 to-amber-400 rounded-full w-[45%]" />
                        </div>
                      </div>
                      <Equalizer bars={5} active className="text-white/70" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 py-20 md:py-28 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-[11px] text-slate-400 tracking-[0.15em] uppercase mb-3" style={{ fontWeight: 600 }}>Testimonials</p>
              <h2 className="text-3xl md:text-[2.75rem] tracking-tight text-slate-800 leading-tight" style={{ fontWeight: 700 }}>
                People are{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }} className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
                  feeling it
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <div className="h-full relative bg-white/20 backdrop-blur-xl border border-white/40 rounded-3xl p-7 shadow-lg shadow-slate-900/[0.03] hover:shadow-xl transition-all duration-300 flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  <p className="text-[14px] text-slate-600 leading-relaxed flex-1 mb-6" style={{ fontWeight: 400 }}>
                    "{t.quote}"
                  </p>

                  <div className="flex items-center gap-3 pt-5 border-t border-white/20">
                    <div className="w-10 h-10 rounded-full overflow-hidden shadow-md">
                      <ImageWithFallback src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[13px] text-slate-800" style={{ fontWeight: 600 }}>{t.name}</p>
                      <p className="text-[11px] text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing CTA ─────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 py-20 md:py-28 px-5 md:px-8">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-10 md:p-16 text-center overflow-hidden shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-500/10 rounded-full blur-[80px]" />
              <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[80px]" />

              <div className="relative z-10">
                <Equalizer bars={7} active className="text-rose-400 mx-auto mb-6 !h-5" />

                <h2 className="text-3xl md:text-4xl tracking-tight text-white leading-tight mb-3" style={{ fontWeight: 700 }}>
                  Ready to find your{' '}
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }} className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">
                    sound?
                  </span>
                </h2>
                <p className="text-[14px] text-slate-400 max-w-md mx-auto leading-relaxed mb-8" style={{ fontWeight: 400 }}>
                  Join millions of listeners who let the moment choose their music. Free forever — premium when you want more.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                  <button 
                    onClick={() => router.push('/sign-in')}
                    className="group flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-rose-400 to-amber-400 hover:from-rose-500 hover:to-amber-500 text-white text-[14px] shadow-xl shadow-rose-500/20 transition-all hover:-translate-y-0.5" style={{ fontWeight: 600 }}>
                    <Play className="w-4 h-4 fill-current" />
                    Start listening — it&apos;s free
                  </button>
                  <button className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-white/10 border border-white/15 text-white/80 text-[14px] hover:bg-white/15 transition-all hover:-translate-y-0.5" style={{ fontWeight: 500 }}>
                    View plans
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 mt-6" style={{ fontWeight: 400 }}>No credit card required. Cancel anytime.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/20 py-16 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white shadow-md">
                  <Disc3 className="w-4 h-4" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base tracking-tight text-slate-800" style={{ fontWeight: 700 }}>Vibe</span>
                  <span className="text-base tracking-tight text-rose-500" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>Tune</span>
                </div>
              </div>
              <p className="text-[12px] text-slate-400 leading-relaxed max-w-[200px]" style={{ fontWeight: 400 }}>
                AI-powered music that matches your moment. Weather, mood, photos — we read it all.
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <p className="text-[11px] text-slate-400 uppercase tracking-[0.12em] mb-4" style={{ fontWeight: 600 }}>{title}</p>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <button className="text-[13px] text-slate-500 hover:text-slate-800 transition-colors" style={{ fontWeight: 400 }}>{link}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/15 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-slate-400" style={{ fontWeight: 400 }}>
              &copy; 2026 VibeTune. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <Equalizer bars={3} active className="text-rose-300" />
              <span className="text-[11px] text-slate-400" style={{ fontWeight: 400 }}>Crafted with vibes</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── Styles ──────────────────────────────────────────── */}
      <style>{`
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
      `}</style>
    </div>
  );
}