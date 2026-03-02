'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Disc3, Play, Sparkles, CloudSun, Camera, ArrowRight,
  Headphones, Zap, ListMusic, Globe, Menu, X, Star
} from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'motion/react';
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
  albumOcean: 'https://images.unsplash.com/photo-1718067634803-8c369340bd54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvY2VhbiUyMHN1bnNldCUyMHBhc3RlbHxlbnwxfHx8fDE3NzE0MjM0NDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
  albumDesert: 'https://images.unsplash.com/photo-1548364504-57247d6f96bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNlcnQlMjBkdW5lcyUyMGdvbGRlbiUyMGhvdXJ8ZW58MXx8fHwxNzcxNDIzNDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080',
};

const stats = [
  { value: '2.4M+', label: 'Active listeners', icon: Headphones },
  { value: '180K', label: 'Playlists generated', icon: ListMusic },
  { value: '98%', label: 'Vibe accuracy', icon: Zap },
  { value: '140+', label: 'Countries', icon: Globe },
];

const features = [
  {
    icon: CloudSun, tag: 'Weather · Playlist', title: 'Sky sets the tone',
    description: 'Real-time weather data shapes your soundtrack. Rainy morning? Warm lo-fi. Sunny afternoon? Upbeat indie. Your environment becomes the DJ.',
    bg: 'bg-sky-500/10', color: 'text-sky-600', image: images.albumForest,
  },
  {
    icon: Camera, tag: 'AI Vibe Scan', title: 'Photos become playlists',
    description: 'Snap a photo or drop an image — our AI reads color, mood, and energy to generate a perfectly matched tracklist in seconds.',
    bg: 'bg-rose-500/10', color: 'text-rose-600', image: images.albumNeon,
  },
  {
    icon: Sparkles, tag: 'Smart Curation', title: 'It learns your taste',
    description: 'The more you listen, the sharper it gets. VibeTune blends your history, the time of day, and current vibe into a feed that feels handpicked.',
    bg: 'bg-violet-500/10', color: 'text-violet-600', image: images.albumOcean,
  },
];

const testimonials = [
  { quote: "I uploaded a sunset photo from my trip and it generated the most perfect playlist. I listen to it every evening now.", name: 'Mia Chen', role: 'Photographer', avatar: images.avatarWoman, rating: 5 },
  { quote: "The weather feature is addictive. Rainy days in London have never sounded this good. It just gets the mood right.", name: 'James Okafor', role: 'Music Producer', avatar: images.avatarStudio, rating: 5 },
  { quote: "Other apps recommend what's popular. VibeTune recommends what I actually want to hear. Big difference.", name: 'Leo Martinez', role: 'UX Designer', avatar: images.avatarMan, rating: 5 },
];

function Equalizer({ bars = 5, active = true, className = '' }: { bars?: number; active?: boolean; className?: string }) {
  return (
    <div className={`flex items-end gap-[2px] h-3.5 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div key={i} className="w-[2.5px] rounded-full bg-current origin-bottom" animate={active ? { scaleY: [0.3, 1, 0.5, 0.8, 0.3] } : { scaleY: 0.3 }} transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }} style={{ height: '100%' }} />
      ))}
    </div>
  );
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], [0, 1]);
  const [navOpacity, setNavOpacity] = useState(0);
  const router = useRouter();

  useEffect(() => navBg.on('change', setNavOpacity), [navBg]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 overflow-x-hidden font-sans relative selection:bg-rose-200">
      
      {/* ─── Animated Colorful Glassmorphism Background ─── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-rose-300/30 mix-blend-multiply filter blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-sky-300/30 mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-amber-200/30 mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[60px]" />
      </div>

      <div className="relative z-10">
        {/* ─── Navbar ──────────────────────────────────────────── */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${navOpacity * 0.7})`,
            backdropFilter: `blur(${navOpacity * 24}px)`,
            borderBottom: navOpacity > 0.5 ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
          }}
        >
          <div className="max-w-6xl mx-auto px-6 h-[72px] flex items-center justify-between">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                <Disc3 className="w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-1 text-xl font-bold tracking-tight">
                <span>Vibe</span><span className="text-rose-500 font-serif italic font-normal">Tune</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              {['Features', 'How it works', 'Testimonials', 'Pricing'].map((link) => (
                <button key={link} onClick={() => scrollToSection(link.toLowerCase().replace(/\s+/g, '-'))} className="hover:text-slate-900 transition-colors">
                  {link}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/sign-in')} className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xl shadow-slate-900/10 transition-transform hover:-translate-y-0.5">
                Get started
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-700">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>

        {/* ─── Hero ────────────────────────────────────────────── */}
        <section className="pt-40 pb-20 px-6 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/80 text-rose-600 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                <Equalizer bars={3} active className="text-rose-500" /> Open Beta
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6 drop-shadow-sm">
                Music that <span className="text-rose-500 font-serif italic font-normal">feels</span> like the moment.
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-md leading-relaxed">
                VibeTune reads your weather, photos, and mood to generate playlists that match exactly where you are — right now.
              </p>
              <button onClick={() => router.push('/sign-in')} className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white text-base font-bold shadow-[0_8px_20px_rgba(244,63,94,0.3)] transition-transform hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(244,63,94,0.4)]">
                <Play className="w-4 h-4 fill-current" /> Start listening
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative h-[500px]">
              <div className="absolute inset-0 rounded-[2rem] overflow-hidden border border-white/60 shadow-2xl">
                <ImageWithFallback src={images.heroWoman} alt="Hero" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white/70 backdrop-blur-2xl p-4 rounded-[1.5rem] border border-white/80 shadow-2xl flex items-center gap-4 hover:-translate-y-2 transition-transform cursor-default">
                <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md"><ImageWithFallback src={images.albumDesert} alt="Album" className="w-full h-full object-cover" /></div>
                <div className="pr-4">
                  <p className="text-sm font-bold text-slate-900">Golden Hour</p>
                  <p className="text-xs font-medium text-slate-500">Playing now</p>
                </div>
                <Equalizer bars={4} active className="text-rose-500" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── Stats ───────────────────────────────────────────── */}
        <section className="py-16 mt-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center mb-3 shadow-sm text-slate-700">
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                    <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features ────────────────────────────────────────── */}
        <section id="features" className="py-28 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Not just playlists. <span className="text-rose-500 font-serif italic font-normal">Experiences.</span></h2>
            <p className="text-slate-600 max-w-xl mx-auto text-lg">Three AI-powered features that transform how you discover and connect with music.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feat, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 p-3 shadow-lg hover:shadow-xl transition-shadow hover:-translate-y-1 duration-300 h-full flex flex-col group">
                  <div className="h-56 rounded-[2rem] overflow-hidden mb-6 relative">
                    <ImageWithFallback src={feat.image} alt={feat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="px-6 pb-8 flex-1 flex flex-col">
                    <div className={`w-12 h-12 rounded-2xl ${feat.bg} ${feat.color} flex items-center justify-center mb-5 border border-white/50 shadow-sm`}>
                      <feat.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                    <p className="text-base text-slate-600 leading-relaxed flex-1">{feat.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ─── Testimonials ────────────────────────────────────── */}
        <section id="testimonials" className="py-28 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-16 text-center drop-shadow-sm">People are <span className="text-rose-500 font-serif italic font-normal">feeling it</span></h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="bg-white/50 backdrop-blur-xl rounded-[2rem] p-8 border border-white/60 h-full flex flex-col shadow-lg hover:bg-white/70 transition-colors">
                    <div className="flex gap-1 mb-6">
                      {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                    </div>
                    <p className="text-slate-700 text-lg leading-relaxed mb-8 flex-1 font-medium">"{t.quote}"</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <ImageWithFallback src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                        <p className="text-slate-500 text-xs font-semibold">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────────────── */}
        <section className="py-28 px-6 max-w-4xl mx-auto text-center">
          <Reveal>
            <div className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-3xl rounded-[3rem] p-12 md:p-20 border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 via-sky-400 to-amber-400" />
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Ready to find your <span className="text-rose-500 font-serif italic font-normal">sound?</span></h2>
              <p className="text-slate-600 mb-10 max-w-md mx-auto text-lg">Join millions of listeners who let the moment choose their music. Free forever.</p>
              <button onClick={() => router.push('/sign-in')} className="px-10 py-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-transform hover:-translate-y-1 shadow-2xl">
                Start listening — it's free
              </button>
            </div>
          </Reveal>
        </section>

        <footer className="py-10 text-center text-sm font-semibold text-slate-500">
          &copy; 2026 VibeTune.
        </footer>
      </div>

      <style>{`
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