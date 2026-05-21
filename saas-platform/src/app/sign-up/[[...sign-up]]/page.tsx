import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Music2, Sparkles, WandSparkles } from "lucide-react";

export default function Page() {
  const appearance = {
    variables: {
      colorPrimary: "#fbcf7a",
      colorText: "#f8fafc",
      colorTextSecondary: "rgba(226, 232, 240, 0.8)",
      colorBackground: "transparent",
      colorInputBackground: "rgba(15, 23, 42, 0.45)",
      colorInputText: "#f8fafc",
      borderRadius: "0.9rem",
    },
    elements: {
      rootBox: "mx-auto w-full max-w-[480px]",
      cardBox: "w-full",
      card: "bg-transparent shadow-none border-none p-0",
      headerTitle: "text-2xl font-semibold tracking-tight text-white",
      headerSubtitle: "text-slate-200/80",
      socialButtonsBlockButton:
        "h-11 border border-white/20 bg-white/5 hover:bg-white/10 transition-colors text-white",
      socialButtonsBlockButtonText: "!text-white !font-medium",
      formFieldLabel: "text-slate-100/90 font-medium",
      formFieldInput:
        "h-11 border border-white/20 bg-slate-950/30 text-white placeholder:text-slate-300/50 focus:border-amber-300 focus:ring-amber-300/30",
      formButtonPrimary:
        "h-11 font-semibold text-slate-950 bg-[linear-gradient(120deg,#fbcf7a,#fde68a)] hover:brightness-105 transition-all shadow-[0_10px_28px_rgba(251,207,122,0.35)]",
      dividerLine: "bg-white/20",
      dividerText: "text-slate-300/80",
      footerActionText: "text-slate-300/90",
      footerActionLink: "text-amber-200 hover:text-amber-100 font-semibold",
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#111423] font-sans text-white">
      <Image
        src="/assets/weather/daisy.jfif"
        alt="Auth Background"
        fill
        unoptimized
        priority
        className="absolute inset-0 z-0 object-cover object-center"
      />

      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(251,191,102,0.2),transparent_38%),radial-gradient(circle_at_85%_80%,rgba(244,114,76,0.2),transparent_35%),linear-gradient(130deg,rgba(13,16,30,0.86),rgba(14,18,34,0.7),rgba(13,16,30,0.86))]" />
      <div className="pointer-events-none absolute left-[10%] top-[14%] z-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[8%] right-[8%] z-10 h-64 w-64 rounded-full bg-orange-300/15 blur-3xl" />

      <header className="absolute left-6 right-6 top-6 z-20 flex items-center">
        <Link href="/landing-page" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-2 backdrop-blur-md transition hover:bg-white/10">
          <img src="/assets/brand/vibetune_logo.png" alt="VibeTune" className="h-7 w-auto object-contain" />
          <span className="text-sm font-semibold tracking-wide">VibeTune</span>
        </Link>
      </header>

      <main className="relative z-20 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-24 sm:px-8 lg:px-12">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="hidden lg:block">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-200/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
              <WandSparkles className="h-3.5 w-3.5" />
              Build your sonic identity
            </p>
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.06] tracking-tight text-white">
              Start your personalized music weather journey.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-200/80">
              Create your account to unlock AI Vibe Scan, weather-driven playlists, and a profile that evolves with your mood.
            </p>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              <div className="glass-chip rounded-2xl border border-white/15 px-4 py-4">
                <Music2 className="mb-3 h-5 w-5 text-amber-200" />
                <p className="text-sm font-medium text-white">Fresh Discovery</p>
              </div>
              <div className="glass-chip rounded-2xl border border-white/15 px-4 py-4">
                <Sparkles className="mb-3 h-5 w-5 text-orange-200" />
                <p className="text-sm font-medium text-white">Smart Curation</p>
              </div>
              <div className="glass-chip rounded-2xl border border-white/15 px-4 py-4">
                <WandSparkles className="mb-3 h-5 w-5 text-yellow-100" />
                <p className="text-sm font-medium text-white">Mood Matching</p>
              </div>
            </div>
          </section>

          <section className="glass-panel mx-auto flex w-full max-w-[680px] justify-center rounded-[28px] border border-white/25 p-6 shadow-[0_20px_70px_rgba(20,12,8,0.45)] backdrop-blur-2xl sm:p-8">
            <SignUp
              forceRedirectUrl="/home"
              fallbackRedirectUrl="/home"
              signInUrl="/sign-in"
              appearance={appearance}
            />
          </section>
        </div>
      </main>

    </div>
  );
}
