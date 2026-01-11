"use client";

import { useState } from "react";
import { FileSearch, Upload, CheckCircle2, AlertCircle, FileText, ChevronRight, Loader2 } from "lucide-react";

export default function ResumeAnalyzerPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<boolean>(false);

  const handleAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
        setResult(true);
        setAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
       <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
          <FileSearch className="w-8 h-8 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Resume AI Analyzer</h1>
          <p className="text-slate-400">Get detailed feedback and scoring for your CV.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
            <div 
                onClick={handleAnalysis}
                className="w-full aspect-[4/3] border-2 border-dashed border-slate-700 hover:border-yellow-500 rounded-3xl flex flex-col items-center justify-center bg-slate-900/30 hover:bg-slate-900/60 transition-all cursor-pointer group relative overflow-hidden"
            >
                {analyzing ? (
                     <div className="absolute inset-0 bg-slate-950/80 z-10 flex flex-col items-center justify-center">
                         <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
                         <p className="text-yellow-500 font-mono text-sm animate-pulse">Scanning keywords...</p>
                     </div>
                ) : (
                    <>
                        <div className="p-6 bg-slate-800/50 rounded-full mb-6 group-hover:scale-110 group-hover:bg-yellow-500/20 transition duration-300">
                            <Upload className="w-10 h-10 text-slate-400 group-hover:text-yellow-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-200">Upload PDF Resume</h3>
                        <p className="text-slate-500 text-sm mt-2">Max file size 5MB</p>
                    </>
                )}
            </div>
            
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <h4 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Recent Scans
                </h4>
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-slate-800 transition cursor-pointer border border-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-10 bg-slate-800 rounded flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-slate-500">PDF</span>
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium">Software_Eng_CV.pdf</p>
                                    <p className="text-xs text-slate-500">2 days ago</p>
                                </div>
                            </div>
                            <div className="text-emerald-400 font-bold text-sm">85/100</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="lg:col-span-7">
            {!result ? (
                <div className="h-full rounded-3xl border border-slate-800 bg-slate-950/20 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                    <FileSearch className="w-16 h-16 mb-6 opacity-20" />
                    <h3 className="text-xl font-medium text-slate-500">Waiting for upload</h3>
                    <p className="text-sm max-w-xs mt-2">Upload your resume to receive a comprehensive breakdown of your strengths and weaknesses.</p>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
                         <div>
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Overall Score</p>
                            <h2 className="text-5xl font-bold text-white mt-1">92<span className="text-2xl text-slate-500">/100</span></h2>
                         </div>
                         <div className="w-24 h-24 rounded-full border-8 border-emerald-500 border-r-transparent rotate-45" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                            <h4 className="flex items-center gap-2 text-emerald-400 font-bold mb-3">
                                <CheckCircle2 className="w-5 h-5" /> Strengths
                            </h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-emerald-500/50" /> Strong Action Verbs</li>
                                <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-emerald-500/50" /> Quantifiable Metrics</li>
                                <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-emerald-500/50" /> Clear Formatting</li>
                            </ul>
                        </div>
                        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20">
                            <h4 className="flex items-center gap-2 text-red-400 font-bold mb-3">
                                <AlertCircle className="w-5 h-5" /> Improvements
                            </h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-red-500/50" /> Missing LinkedIn URL</li>
                                <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-red-500/50" /> Grammar Check Needed</li>
                            </ul>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                        <h4 className="text-white font-bold mb-4">AI Executive Summary</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            This candidate demonstrates strong technical proficiency in full-stack development. The experience section effectively highlights leadership capabilities, but could benefit from more specific keywords related to cloud architecture to pass automated ATS filters.
                        </p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}