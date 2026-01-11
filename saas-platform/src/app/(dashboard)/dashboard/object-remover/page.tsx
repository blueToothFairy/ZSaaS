"use client";

import { useState } from "react";
import { Scissors, UploadCloud, Download, Wand2, Loader2 } from "lucide-react";

export default function ObjectRemoverPage() {
  const [step, setStep] = useState<"upload" | "mask" | "result">("upload");
  const [image, setImage] = useState<string>("");

  const handleUpload = () => {
    setImage("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80");
    setStep("mask");
  };

  const handleProcess = () => {
      setStep("result");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
       <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-500/10">
          <Scissors className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Magic Object Eraser</h1>
          <p className="text-slate-400">Clean up your photos by removing unwanted objects.</p>
        </div>
      </div>

      <div className="p-1 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
        {step === "upload" && (
            <div 
                onClick={handleUpload}
                className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors gap-6"
            >
                <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
                    <UploadCloud className="w-10 h-10 text-slate-400" />
                </div>
                <div className="text-center">
                    <h3 className="text-2xl font-semibold text-white">Click to Upload Photo</h3>
                    <p className="text-slate-500 mt-2">Identify the object you want to erase</p>
                </div>
            </div>
        )}

        {step === "mask" && (
            <div className="flex-1 flex flex-col items-center p-8 gap-6">
                <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-xl max-w-2xl">
                    <img src={image} alt="To Edit" className="w-full h-auto" />
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white text-xs px-3 py-1 rounded-full border border-white/10">
                        Preview Mode
                    </div>
                </div>
                <div className="w-full max-w-2xl space-y-4">
                     <label className="text-sm font-medium text-slate-300">Describe the object to remove</label>
                     <div className="flex gap-4">
                        <input 
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                            placeholder="e.g. people in background, trash can, clouds"
                        />
                        <button 
                            onClick={handleProcess}
                            className="px-6 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-lg shadow-red-900/20 flex items-center gap-2"
                        >
                            <Wand2 className="w-4 h-4" /> Erase Object
                        </button>
                     </div>
                </div>
            </div>
        )}

        {step === "result" && (
             <div className="flex-1 flex flex-col items-center p-8 gap-8 animate-in fade-in">
                <div className="relative rounded-xl overflow-hidden border-2 border-green-500/30 shadow-[0_0_40px_-10px_rgba(34,197,94,0.3)] max-w-2xl">
                    <img src={image} alt="Result" className="w-full h-auto" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-transparent pointer-events-none" />
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setStep("upload")}
                        className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
                    >
                        Start Over
                    </button>
                    <button className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download Result
                    </button>
                </div>
             </div>
        )}
      </div>
    </div>
  );
}