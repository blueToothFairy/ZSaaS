"use client";

import { useState } from "react";
import { Type, ArrowRight, Loader2, Wand2 } from "lucide-react";

export default function BlogTitlesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setTitles([
        "10 Secrets to Mastering React in 2026",
        "Why UX Design is More Important Than Ever",
        "The Ultimate Guide to Serverless Databases",
        "How AI is Reshaping the Creative Industry",
        "5 Mistakes Every Junior Developer Makes"
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 shadow-lg shadow-pink-500/10 mb-4">
          <Type className="w-10 h-10 text-pink-500" />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Blog Title Generator</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-lg">Struggling with headlines? Let AI craft catchy, SEO-friendly titles for your next viral post.</p>
      </div>

      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-25" />
        <form onSubmit={handleGenerate} className="relative flex items-center bg-slate-900 rounded-xl p-2 border border-slate-800 shadow-2xl">
          <input 
            required
            className="flex-1 bg-transparent px-6 py-4 text-lg text-white placeholder:text-slate-500 focus:outline-none"
            placeholder="Enter your keywords (e.g., React, Web Dev)"
          />
          <button 
            disabled={isLoading}
            className="px-8 py-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            Generate
          </button>
        </form>
      </div>

      <div className="space-y-4 pt-8">
        {titles.map((title, index) => (
          <div 
            key={index}
            className="group flex items-center justify-between p-6 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-pink-500/50 hover:bg-slate-900/80 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-3"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <span className="text-lg font-medium text-slate-200 group-hover:text-white">{title}</span>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
          </div>
        ))}
        {titles.length === 0 && !isLoading && (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-500">No titles generated yet.</p>
            </div>
        )}
      </div>
    </div>
  );
}