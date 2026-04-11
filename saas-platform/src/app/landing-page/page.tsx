'use client'

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

const LandingPageVibeTune = () => {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/home');
    }
  }, [isLoaded, userId, router]);

  // Giả lập dữ liệu ảnh avatar cho nhóm
  const avatars = [
    "https://randomuser.me/api/portraits/men/32.jpg",
    "https://randomuser.me/api/portraits/women/44.jpg",
    "https://randomuser.me/api/portraits/men/65.jpg",
  ];

  const handleExperienceVibe = () => {
    router.push('/sign-in');
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6 bg-cover bg-center font-sans text-white relative overflow-hidden"
    >
      {/* Background image as an absolutely-positioned <img> to ensure browser displays it reliably */}
      <img
        src="/assets/weather/daisy.jfif"
        alt="daisy background"
        className="absolute inset-0 w-full h-full object-cover -z-20"
      />
      {/* Lớp phủ gradient để làm tối nền và tăng độ sâu bokeh hổ phách */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e]/50 to-[#0f0f1c]/50 pointer-events-none"></div>

      {/* Logo - VibeTune */}
      <div className="absolute top-6 left-6 z-20">
        <img 
          src="/assets/brand/vibetune_logo.png" 
          alt="VibeTune" 
          className="h-8 md:h-10 w-auto object-contain"
        />
      </div>

      {/* Main content container, centered, constrained width */}
      <div className="relative z-10 text-center max-w-3xl flex flex-col items-center">
        
        {/* Văn bản nhỏ trên cùng */}
        <h6 className="text-xs md:text-sm uppercase tracking-[0.2em] text-white/50 mb-3 drop-shadow-lg">
          AMBIENT HARMONIES
        </h6>

        {/* Tiêu đề chính H1 */}
        <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-[1.1] drop-shadow-2xl">
          Your Mood,<br />
          Curated by{' '}
          {/* "the Sky" với gradient và chữ nghiêng */}
          <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-[#fdd67f] to-[#ffb380] drop-shadow-md">
            the Sky.
          </span>
        </h1>

        {/* Đoạn văn bản phụ P */}
        <p className="text-lg md:text-xl text-white/60 mb-12 max-w-xl leading-relaxed drop-shadow-sm">
          VibeTune harmonizes your environment with AI-driven weather music. Experience soundscapes that evolve as the clouds shift and the sun sets.
        </p>

        {/* Phần CTA và Nhóm Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          
          {/* Nút Call to Action */}
          <button 
            onClick={handleExperienceVibe}
            className="px-10 py-4 rounded-full font-semibold text-white bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            Experience the Vibe
          </button>

          {/* Nhóm Avatar */}
          <div className="flex items-center -space-x-4">
            {avatars.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`User ${index + 1}`}
                className="w-14 h-14 rounded-full border-2 border-white/20 object-cover shadow-lg"
              />
            ))}
            {/* Vòng tròn +10 màu vàng hổ phách */}
            <div className="w-14 h-14 rounded-full border-2 border-white/20 bg-[#fdd67f] text-[#1a1a2e] flex items-center justify-center text-sm font-bold shadow-lg">
              +10
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LandingPageVibeTune;
