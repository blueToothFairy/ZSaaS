"use client";

import { Bell, Search, Menu } from "lucide-react";

export default function Header() {
  return (
    <div className="flex items-center justify-between p-4 md:p-8">
      <div className="md:hidden">
        <button className="p-2 text-slate-400 hover:text-white transition">
            <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="hidden md:flex items-center gap-4 text-slate-400 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
        <Search className="w-4 h-4" />
        <input 
            type="text" 
            placeholder="Search tools..." 
            className="bg-transparent border-none focus:outline-none text-sm w-64 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-white transition relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-slate-950"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-white">Guest User</p>
                <p className="text-xs text-slate-500">Free Account</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold border-2 border-slate-900 shadow-lg cursor-pointer hover:opacity-90 transition">
                GU
            </div>
        </div>
      </div>
    </div>
  );
}