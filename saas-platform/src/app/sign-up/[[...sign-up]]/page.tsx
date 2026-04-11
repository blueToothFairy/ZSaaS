import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* 1. Ảnh nền Daisy */}
      <Image 
        src="/assets/weather/daisy.jfif" 
        alt="Auth Background"
        fill
        priority
        className="object-cover object-center absolute inset-0 z-0"
      />

      {/* 2. Lớp phủ đen mờ */}
      <div className="absolute inset-0 bg-[#0f0f1c]/60 z-10 pointer-events-none"></div>

      {/* 3. Logo VibeTune (Góc trái) */}
      <div className="absolute top-6 left-6 z-20">
        <img src="/assets/brand/vibetune_logo.png" alt="VibeTune" className="h-8 md:h-10 w-auto object-contain" />
      </div>

      {/* 4. Form Đăng ký Glassmorphism */}
      <div className="relative z-20">
        <SignUp 
          forceRedirectUrl="/home" 
          fallbackRedirectUrl="/home"
          appearance={{
            variables: {
              colorPrimary: '#fdd67f', 
              colorText: 'white',
              colorTextSecondary: 'rgba(255, 255, 255, 0.7)',
              colorBackground: 'transparent', 
              colorInputBackground: 'rgba(255, 255, 255, 0.05)',
              colorInputText: 'white',
              borderRadius: '1rem',
            },
            elements: {
              card: "bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)]",
              headerTitle: "text-2xl font-bold text-white",
              headerSubtitle: "text-white/60",
              formButtonPrimary: "bg-gradient-to-r from-[#fdd67f] to-[#ffb380] text-[#1a1a2e] font-bold hover:opacity-90 transition-all",
              formFieldInput: "border-white/20 focus:border-[#fdd67f] focus:ring-[#fdd67f]/30 text-white placeholder:text-white/30",
              formFieldLabel: "text-white/80 font-medium",
              socialButtonsBlockButton: "border-white/20 hover:bg-white/5 text-white bg-transparent",
              socialButtonsBlockButtonText: "!text-white font-medium",
              dividerLine: "bg-white/20",
              dividerText: "text-white/50",
              footerActionText: "text-white/70",
              footerActionLink: "text-[#fdd67f] hover:text-[#ffb380] font-semibold",
            }
          }}
        />
      </div>
    </div>
  );
}