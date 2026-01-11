"use client";

import { useState } from "react";
import { FileText, Sparkles, Copy, Loader2, RefreshCcw } from "lucide-react";

export default function ArticleGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setResult("# The Future of AI in Modern Web Development\n\nArtificial Intelligence is rapidly transforming the landscape of web development. From automated code generation to intelligent design systems, the possibilities are endless.\n\n## Key Impacts\n1. Enhanced User Experience\n2. Automated Testing\n3. Personalized Content Delivery\n\nAs we move forward, the synergy between human creativity and machine efficiency will define the next era of the internet.");
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 shadow-lg shadow-violet-500/10">
          <FileText className="w-8 h-8 text-violet-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Article Generator</h1>
          <p className="text-slate-400">Create SEO-optimized content with advanced AI models.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <form onSubmit={handleGenerate} className="p-6 rounded-3xl border border-slate-800 bg-slate-950/50 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Topic or Title</label>
              <input 
                required
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder:text-slate-600 transition-all"
                placeholder="e.g. The impact of AI on design"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Tone</label>
              <select className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white transition-all appearance-none cursor-pointer">
                <option>Professional</option>
                <option>Casual</option>
                <option>Enthusiastic</option>
                <option>Witty</option>
              </select>
            </div>

            <button 
              disabled={isLoading}
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Generate Article 
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-8">
          <div className="h-full min-h-[500px] rounded-3xl border border-slate-800 bg-slate-950/30 backdrop-blur-md relative overflow-hidden">
            {!result && !isLoading && (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                  <div className="p-4 rounded-full bg-slate-900/50 border border-slate-800 mb-4">
                    <Sparkles className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="font-medium">Ready to create magic</p>
               </div>
            )}
            
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/20 backdrop-blur-sm z-10">
                <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-violet-400 animate-pulse font-medium">Drafting content...</p>
              </div>
            )}

            {result && (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/20">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                        onClick={() => setResult("")}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors" title="Clear">
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors" title="Copy">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">
                  <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-8 text-lg">
                    {result}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}