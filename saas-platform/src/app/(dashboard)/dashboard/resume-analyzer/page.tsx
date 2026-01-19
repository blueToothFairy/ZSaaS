"use client";

import { useState, useRef } from "react";
import { FileSearch, Upload, CheckCircle2, AlertCircle, FileText, ChevronRight, Loader2, X, File as FileIcon } from "lucide-react";

export default function ResumeAnalyzerPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<object | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        return;
      }
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }
      setFile(selectedFile);
      setError("");
      setResult(null); // Reset previous result
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cleanAndParseJSON = (text: string): object => {
    try {
      // Find JSON content within potential markdown code blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      return JSON.parse(jsonString);
    } catch (e) {
      // Fallback if parsing fails - create a generic structure
      return {
        overallScore: 0,
        strengths: ["Could not parse structured data"],
        improvements: ["Please try again"],
        executiveSummary: text || "Analysis failed to produce structured output."
      };
    }
  };

  const handleAnalysis = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBuffer }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      const parsedResult = cleanAndParseJSON(data.result);
      console.log("Parsed Result:", parsedResult);
      setResult(parsedResult);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
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
        {/* Left Column: Upload & History */}
        <div className="lg:col-span-5 space-y-6">
            <div 
                onClick={() => !analyzing && fileInputRef.current?.click()}
                className={`w-full aspect-[4/3] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden ${
                    error ? "border-red-500/50 bg-red-500/5" : "border-slate-700 hover:border-yellow-500 bg-slate-900/30 hover:bg-slate-900/60"
                }`}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="application/pdf"
                    onChange={handleFileSelect}
                />

                {analyzing ? (
                     <div className="absolute inset-0 bg-slate-950/90 z-10 flex flex-col items-center justify-center">
                         <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
                         <p className="text-yellow-500 font-mono text-sm animate-pulse">Reading PDF & Analyzing...</p>
                         <p className="text-slate-500 text-xs mt-2">This may take up to 30 seconds</p>
                     </div>
                ) : file ? (
                    <div className="relative flex flex-col items-center text-center p-6 w-full">
                        <button 
                            onClick={clearFile}
                            className="absolute top-[-20px] right-[-20px] p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-4 bg-yellow-500/10 rounded-2xl mb-4 border border-yellow-500/20">
                            <FileIcon className="w-10 h-10 text-yellow-500" />
                        </div>
                        <p className="text-white font-medium truncate max-w-[200px]">{file.name}</p>
                        <p className="text-slate-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAnalysis();
                            }}
                            className="mt-6 px-8 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/20"
                        >
                            Start Analysis
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="p-6 bg-slate-800/50 rounded-full mb-6 group-hover:scale-110 group-hover:bg-yellow-500/20 transition duration-300">
                            <Upload className="w-10 h-10 text-slate-400 group-hover:text-yellow-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-200">Upload PDF Resume</h3>
                        <p className="text-slate-500 text-sm mt-2">Max file size 5MB</p>
                        {error && <p className="text-red-400 text-xs mt-4 font-medium">{error}</p>}
                    </>
                )}
            </div>
            
            {/* History Section (Static as requested) */}
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

        {/* Right Column: Results */}
        <div className="lg:col-span-7">
            {!result ? (
                <div className="h-full min-h-[400px] rounded-3xl border border-slate-800 bg-slate-950/20 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                    <FileSearch className="w-16 h-16 mb-6 opacity-20" />
                    <h3 className="text-xl font-medium text-slate-500">Waiting for analysis</h3>
                    <p className="text-sm max-w-xs mt-2 text-slate-600">Upload your resume to receive a comprehensive breakdown of your strengths and weaknesses powered by Gemini AI.</p>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    {/* Score Card */}
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between relative overflow-hidden group">
                         <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="relative z-10">
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Overall Score</p>
                            <h2 className={`text-6xl font-bold mt-2 ${
                                result.score >= 80 ? "text-emerald-400" : 
                                result.score >= 60 ? "text-yellow-400" : "text-red-400"
                            }`}>
                                {result.score}<span className="text-2xl text-slate-600 ml-1">/100</span>
                            </h2>
                         </div>
                         <div className="relative z-10 w-24 h-24 flex items-center justify-center">
                            <div className={`w-full h-full rounded-full border-8 border-r-transparent rotate-45 ${
                                result.score >= 80 ? "border-emerald-500" : 
                                result.score >= 60 ? "border-yellow-500" : "border-red-500"
                            }`} />
                         </div>
                    </div>

                    {/* Feedback Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                            <h4 className="flex items-center gap-2 text-emerald-400 font-bold mb-3">
                                <CheckCircle2 className="w-5 h-5" /> Strengths
                            </h4>
                            <ul className="space-y-3">
                                {result.strengths.map((item, idx) => (
                                    <li key={idx} className="flex gap-3 text-sm text-slate-300">
                                        <ChevronRight className="w-4 h-4 text-emerald-500/50 flex-shrink-0 mt-0.5" /> 
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20">
                            <h4 className="flex items-center gap-2 text-red-400 font-bold mb-3">
                                <AlertCircle className="w-5 h-5" /> Improvements
                            </h4>
                            <ul className="space-y-3">
                                {result.suggestions.map((item, idx) => (
                                    <li key={idx} className="flex gap-3 text-sm text-slate-300">
                                        <ChevronRight className="w-4 h-4 text-red-500/50 flex-shrink-0 mt-0.5" /> 
                                        {item.section + ": " + item.advice}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-yellow-500" />
                            AI Executive Summary
                        </h4>
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                            {result.summary}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}