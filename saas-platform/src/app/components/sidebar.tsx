"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Image as ImageIcon, 
  Type, 
  Eraser, 
  Scissors, 
  FileSearch,
  Zap,
  Settings,
  Sparkles,
  Music
} from "lucide-react";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", color: "text-sky-400" },
  { label: "Article Generator", icon: FileText, href: "/dashboard/article-generator", color: "text-violet-400" },
  { label: "Vibe Tuner", icon: Music, href: "/dashboard/vibe-tuner", color: "text-pink-400" },
  { label: "Image Generator", icon: ImageIcon, href: "/dashboard/image-generator", color: "text-orange-400" },
  { label: "Background Remover", icon: Eraser, href: "/dashboard/background-remover", color: "text-emerald-400" },
  { label: "Object Remover", icon: Scissors, href: "/dashboard/object-remover", color: "text-red-400" },
  { label: "Resume Analyzer", icon: FileSearch, href: "/dashboard/resume-analyzer", color: "text-yellow-400" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings", color: "text-slate-400" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#0B0F19]/60 backdrop-blur-2xl border-r border-white/5 relative overflow-hidden">
      <div className="px-3 py-2 flex items-center pl-8 mb-8 z-10">
        <div className="relative w-8 h-8 mr-4 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg blur opacity-75 animate-pulse"></div>
            <div className="relative bg-black rounded-lg w-full h-full flex items-center justify-center border border-white/10">
                <Sparkles className="w-4 h-4 text-white" />
            </div>
        </div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-slate-400">
          AI Studio
        </h1>
      </div>

      <div className="px-3 py-2 flex-1 space-y-1 z-10">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-300 border relative overflow-hidden ${
                isActive 
                  ? "bg-white/10 border-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                  : "text-slate-400 border-transparent hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center flex-1 relative z-10">
                <route.icon className={`h-5 w-5 mr-3 transition-transform duration-300 group-hover:scale-110 ${route.color}`} />
                {route.label}
              </div>
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-50" />
              )}
            </Link>
          );
        })}
      </div>

       <div className="px-4 py-4 z-10">
            <div className="relative bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 rounded-2xl p-4 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-2 mb-2 relative z-10">
                    <div className="p-1 bg-yellow-500/20 rounded-md">
                        <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    </div>
                    <p className="text-xs font-bold text-white tracking-wide">Free Plan</p>
                </div>
                <div className="w-full bg-slate-800/50 rounded-full h-1.5 mb-2 border border-white/5">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full w-[70%] shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                </div>
                <p className="text-[10px] text-slate-400 mb-3 font-medium">3/5 Free Generations Used</p>
                <button className="relative text-xs w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white transition-all font-semibold shadow-lg shadow-indigo-900/20 border border-white/10 group-hover:shadow-indigo-500/25">
                    Upgrade to Pro
                </button>
            </div>
       </div>
    </div>
  );
}