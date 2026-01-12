"use client";

import { useState } from "react";
import axios from "axios";
import { FileText, Sparkles, Copy, Loader2, RefreshCcw, Wand2 } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho Form
interface FormData {
  topic: string;
  role: string;
  style: string;
  tone: string;
  audience: string;
  format: string;
  length: string;
}

export default function ArticleGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");

  // State quản lý toàn bộ form input
  const [formData, setFormData] = useState<FormData>({
    topic: "",
    role: "Content Writer", // Mặc định
    style: "Descriptive",
    tone: "Professional",
    audience: "General Reader",
    format: "Markdown",
    length: "Medium (~500 words)"
  });

  // Hàm xử lý khi thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post('/api/generate', formData);
      setResult(response.data.result);
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  // Class chung cho các input để code gọn hơn
  const inputClass = "w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder:text-slate-600 transition-all";
  const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wider ml-1";

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 shadow-lg shadow-violet-500/10">
          <Wand2 className="w-8 h-8 text-violet-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Article Generator</h1>
          <p className="text-slate-400">Craft perfectly structured content with precise controls.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: FORM INPUT */}
        <div className="lg:col-span-4 space-y-4">
          <form onSubmit={handleGenerate} className="p-6 rounded-3xl border border-slate-800 bg-slate-950/50 backdrop-blur-xl shadow-2xl flex flex-col gap-5">
            
            {/* 1. Topic (Full width) */}
            <div className="space-y-2">
              <label className={labelClass}>Topic / Title</label>
              <input 
                name="topic"
                required
                value={formData.topic}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. The future of AI in Web Dev"
              />
            </div>

            {/* Grid 2 columns cho các field ngắn */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* 2. Role */}
              <div className="space-y-2">
                <label className={labelClass}>Role</label>
                <input 
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Expert"
                />
              </div>

              {/* 3. Audience */}
              <div className="space-y-2">
                <label className={labelClass}>Audience</label>
                <input 
                  name="audience"
                  value={formData.audience}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Beginners"
                />
              </div>

              {/* 4. Tone */}
              <div className="space-y-2">
                <label className={labelClass}>Tone</label>
                <select name="tone" value={formData.tone} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                  <option>Professional</option>
                  <option>Casual</option>
                  <option>Enthusiastic</option>
                  <option>Witty</option>
                  <option>Serious</option>
                </select>
              </div>

              {/* 5. Style */}
              <div className="space-y-2">
                <label className={labelClass}>Style</label>
                <select name="style" value={formData.style} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                  <option>Descriptive</option>
                  <option>Persuasive</option>
                  <option>Narrative</option>
                  <option>Technical</option>
                </select>
              </div>

               {/* 6. Length */}
               <div className="space-y-2">
                <label className={labelClass}>Length</label>
                <select name="length" value={formData.length} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                  <option value="short">Short (~200 words)</option>
                  <option value="medium">Medium (~500 words)</option>
                  <option value="long">Long (~1000 words)</option>
                </select>
              </div>

              {/* 7. Format */}
              <div className="space-y-2">
                <label className={labelClass}>Format</label>
                <select name="format" value={formData.format} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                  <option value="text">Plain Text</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button 
                disabled={isLoading}
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Generate Content
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: RESULT */}
        <div className="lg:col-span-8">
          <div className="h-full min-h-[600px] rounded-3xl border border-slate-800 bg-slate-950/30 backdrop-blur-md relative overflow-hidden flex flex-col">
            
            {/* Empty State */}
            {!result && !isLoading && (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                  <div className="p-6 rounded-full bg-slate-900/50 border border-slate-800 mb-6 shadow-xl">
                    <FileText className="w-12 h-12 opacity-40" />
                  </div>
                  <p className="font-medium text-lg">Fill in the form to generate magic</p>
               </div>
            )}
            
            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/60 backdrop-blur-sm z-10 transition-all">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-800 rounded-full"></div>
                    <div className="absolute top-0 w-16 h-16 border-4 border-violet-500/50 border-t-violet-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-violet-400 animate-pulse font-medium tracking-wide">AI is thinking...</p>
              </div>
            )}

            {/* Result State */}
            {result && (
              <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
                {/* Result Toolbar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/40">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                        onClick={() => setResult("")}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Clear">
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => navigator.clipboard.writeText(result)}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Copy">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Result Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                  <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-8 text-lg selection:bg-violet-500/30 selection:text-white">
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