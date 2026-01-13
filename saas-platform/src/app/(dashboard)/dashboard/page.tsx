"use client";

import { motion } from "framer-motion";
import { ArrowRight, FileText, Image as ImageIcon, Type, Eraser, Scissors, FileSearch, Music } from "lucide-react";
import { useRouter } from "next/navigation";

const tools = [
  { label: "Article Generator", icon: FileText, href: "/dashboard/article-generator", color: "text-violet-400", bg: "group-hover:bg-violet-500/20 bg-slate-800/50", border: "group-hover:border-violet-500/50", shadow: "group-hover:shadow-violet-500/20", desc: "Create SEO-optimized content in seconds." },
  { label: "Image Generator", icon: ImageIcon, href: "/dashboard/image-generator", color: "text-orange-400", bg: "group-hover:bg-orange-500/20 bg-slate-800/50", border: "group-hover:border-orange-500/50", shadow: "group-hover:shadow-orange-500/20", desc: "Turn your ideas into stunning artwork." },
  { label: "Resume Analyzer", icon: FileSearch, href: "/dashboard/resume-analyzer", color: "text-yellow-400", bg: "group-hover:bg-yellow-500/20 bg-slate-800/50", border: "group-hover:border-yellow-500/50", shadow: "group-hover:shadow-yellow-500/20", desc: "Optimize your professional resume." },
  { label: "Background Remover", icon: Eraser, href: "/dashboard/background-remover", color: "text-emerald-400", bg: "group-hover:bg-emerald-500/20 bg-slate-800/50", border: "group-hover:border-emerald-500/50", shadow: "group-hover:shadow-emerald-500/20", desc: "Remove backgrounds with high precision." },
  { label: "Vibe Tuner", icon: Music, href: "/dashboard/vibe-tuner", color: "text-pink-400", bg: "group-hover:bg-pink-500/20 bg-slate-800/50", border: "group-hover:border-pink-500/50", shadow: "group-hover:shadow-pink-500/20", desc: "Get music matching your photo's vibe." },
  { label: "Object Remover", icon: Scissors, href: "/dashboard/object-remover", color: "text-red-400", bg: "group-hover:bg-red-500/20 bg-slate-800/50", border: "group-hover:border-red-500/50", shadow: "group-hover:shadow-red-500/20", desc: "Remove unwanted objects from photos." },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-12 space-y-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 tracking-tight">
          Explore the Power of AI
        </h2>
        <p className="text-slate-400 font-light text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
          Your comprehensive creative toolkit. From text to images, everything is automated.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            onClick={() => router.push(tool.href)}
            className={`
                group relative p-1 rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-1
            `}
          >
            <div className={`absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 blur-xl ${tool.shadow} bg-current`} />
            
            <div className={`relative h-full p-6 rounded-[22px] bg-[#131722]/80 backdrop-blur-xl border border-white/5 ${tool.border} transition-colors duration-300 overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex items-center gap-x-4 mb-4 relative z-10">
                <div className={`p-3 w-fit rounded-2xl transition-colors duration-300 border border-white/5 ${tool.bg}`}>
                    <tool.icon className={`w-8 h-8 ${tool.color}`} />
                </div>
                <div className="font-semibold text-lg text-slate-200 group-hover:text-white transition-colors">
                    {tool.label}
                </div>
                </div>
                
                <div className="flex justify-between items-end relative z-10">
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 pr-4">{tool.desc}</p>
                    <div className="p-2 rounded-full bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                    </div>
                </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}