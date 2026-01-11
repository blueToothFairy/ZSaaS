"use client";

import { useState } from "react";
import { Eraser, UploadCloud, Download, Image as ImageIcon, Loader2 } from "lucide-react";

export default function BackgroundRemoverPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  const handleUpload = () => {
    setIsProcessing(true);
    setUploadedImage("https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=800&q=80");
    setTimeout(() => {
        setProcessedImage("https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=800&q=80"); 
        setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
       <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <Eraser className="w-8 h-8 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Background Remover</h1>
          <p className="text-slate-400">Instantly remove backgrounds with pixel-perfect precision.</p>
        </div>
      </div>

      {!uploadedImage ? (
          <div 
            onClick={handleUpload}
            className="w-full h-96 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-3xl flex flex-col items-center justify-center bg-slate-900/30 hover:bg-slate-900/60 transition-all cursor-pointer group"
          >
            <div className="p-6 bg-slate-800 rounded-full mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition duration-300">
                <UploadCloud className="w-12 h-12 text-slate-400 group-hover:text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-200">Upload an Image</h3>
            <p className="text-slate-500 mt-2">Drag & drop or click to browse</p>
            <p className="text-xs text-slate-600 mt-8 px-4 py-1 rounded-full bg-slate-800">Supports PNG, JPG, WEBP</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                     <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Original</span>
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-700 bg-[url('https://ui.shadcn.com/placeholder.svg')]">
                     <img src={uploadedImage} alt="Original" className="object-cover w-full h-full" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                     <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Result</span>
                     {processedImage && (
                         <button className="text-xs flex items-center gap-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white px-3 py-1 rounded-lg transition-colors">
                             <Download className="w-3 h-3" /> Save
                         </button>
                     )}
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-emerald-500/30 bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                     {isProcessing ? (
                         <div className="flex flex-col items-center gap-3">
                             <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                             <p className="text-sm text-emerald-400/80 animate-pulse">Removing background...</p>
                         </div>
                     ) : (
                         <img src={processedImage!} alt="Processed" className="object-cover w-full h-full" />
                     )}
                </div>
            </div>
            
            <button 
                onClick={() => { setUploadedImage(null); setProcessedImage(null); }}
                className="md:col-span-2 mx-auto mt-4 text-slate-400 hover:text-white transition underline underline-offset-4"
            >
                Upload new image
            </button>
          </div>
      )}
    </div>
  );
}