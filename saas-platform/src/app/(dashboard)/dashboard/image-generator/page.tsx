"use client";

import { useState } from "react";
import { Image as ImageIcon, Download, Loader2, Aperture, Maximize2 } from "lucide-react";

export default function ImageGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setImages([
        "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1614730341194-75c6074065db?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80"
      ]);
      setIsLoading(false);
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 shadow-lg shadow-orange-500/10">
                <ImageIcon className="w-8 h-8 text-orange-500" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-white">Image Generator</h1>
                <p className="text-slate-400">Turn text into stunning visuals.</p>
            </div>
        </div>
      </div>

      <div className="p-1 rounded-3xl bg-gradient-to-r from-orange-500/20 via-red-500/20 to-purple-500/20">
        <form onSubmit={handleGenerate} className="bg-slate-950 rounded-[22px] p-2 flex flex-col md:flex-row gap-2">
            <input 
                required
                className="flex-1 bg-transparent px-6 py-4 text-white placeholder:text-slate-500 focus:outline-none"
                placeholder="A futuristic city with flying cars, neon lights, cyberpunk style..."
            />
            <div className="flex gap-2 p-2">
                 <select className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 focus:outline-none focus:border-orange-500">
                    <option>Square (1:1)</option>
                    <option>Portrait (9:16)</option>
                    <option>Landscape (16:9)</option>
                </select>
                <button 
                    disabled={isLoading}
                    className="px-8 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-900/20 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Art"}
                </button>
            </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[400px]">
        {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse flex items-center justify-center">
                    <Aperture className="w-8 h-8 text-slate-800 animate-spin" />
                </div>
             ))
        ) : images.length > 0 ? (
            images.map((src, index) => (
                <div key={index} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                    <img src={src} alt="AI Generated" className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <div className="flex gap-2 justify-end">
                            <button className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all">
                                <Maximize2 className="w-5 h-5" />
                            </button>
                            <button className="p-2 bg-white text-black rounded-full hover:bg-slate-200 transition-all">
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="col-span-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                <p>Enter a prompt to start creating.</p>
            </div>
        )}
      </div>
    </div>
  );
}