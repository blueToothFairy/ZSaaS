import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Headphones, Sparkles, Waves } from "lucide-react";

function SignInContent() {
  const appearance = {
    variables: {
      colorPrimary: "#7dd3fc",
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
        "h-11 border border-white/20 bg-slate-950/30 text-white placeholder:text-slate-300/50 focus:border-sky-300 focus:ring-sky-300/30",
      formButtonPrimary:
        "h-11 font-semibold text-slate-950 bg-[linear-gradient(120deg,#7dd3fc,#bae6fd)] hover:brightness-105 transition-all shadow-[0_10px_28px_rgba(125,211,252,0.35)]",
      dividerLine: "bg-white/20",
      dividerText: "text-slate-300/80",
      footerActionText: "text-slate-300/90",
      footerActionLink: "text-sky-200 hover:text-sky-100 font-semibold",
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06101f] font-sans text-white">
      <Image
        src="/assets/weather/daisy.jfif"
        alt="Auth Background"
        fill
        unoptimized
        priority
        className="absolute inset-0 z-0 object-cover object-center"
      />

      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_18%,rgba(124,201,255,0.22),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(82,168,255,0.16),transparent_35%),linear-gradient(120deg,rgba(3,10,20,0.84),rgba(5,12,22,0.64),rgba(3,10,20,0.84))]" />
      <div className="pointer-events-none absolute left-[8%] top-[16%] z-10 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[8%] right-[10%] z-10 h-64 w-64 rounded-full bg-cyan-200/15 blur-3xl" />

      <header className="absolute left-6 right-6 top-6 z-20 flex items-center">
        <Link href="/landing-page" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-2 backdrop-blur-md transition hover:bg-white/10">
          <img src="/assets/brand/vibetune_logo.png" alt="VibeTune" className="h-7 w-auto object-contain" />
          <span className="text-sm font-semibold tracking-wide">VibeTune</span>
        </Link>
      </header>

      <main className="relative z-20 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-24 sm:px-8 lg:px-12">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="hidden lg:block">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200/25 bg-sky-200/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
              <Sparkles className="h-3.5 w-3.5" />
              Sonic weather intelligence
            </p>
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.06] tracking-tight text-white">
              Welcome back to your daily soundtrack.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-200/80">
              Sign in to continue from where you left off. Your weather mood, curated playlists, and favorites are ready.
            </p>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              <div className="glass-chip rounded-2xl border border-white/15 px-4 py-4">
                <Headphones className="mb-3 h-5 w-5 text-sky-200" />
                <p className="text-sm font-medium text-white">Adaptive Mixes</p>
              </div>
              <div className="glass-chip rounded-2xl border border-white/15 px-4 py-4">
                <Waves className="mb-3 h-5 w-5 text-cyan-200" />
                <p className="text-sm font-medium text-white">Ambient Sync</p>
              </div>
              <div className="glass-chip rounded-2xl border border-white/15 px-4 py-4">
                <Sparkles className="mb-3 h-5 w-5 text-sky-100" />
                <p className="text-sm font-medium text-white">AI Vibe Scan</p>
              </div>
            </div>
          </section>

          <section className="glass-panel mx-auto flex w-full max-w-[680px] justify-center rounded-[28px] border border-white/25 p-6 shadow-[0_20px_70px_rgba(5,12,26,0.5)] backdrop-blur-2xl sm:p-8">
            <SignIn
              forceRedirectUrl="/home"
              fallbackRedirectUrl="/home"
              signUpUrl="/sign-up"
              appearance={appearance}
            />
          </section>
        </div>
      </main>

    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a1322]">
          <div className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-white/75 backdrop-blur-md animate-pulse">
            Loading VibeTune...
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
