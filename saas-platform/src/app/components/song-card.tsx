"use client";

import { useState, useRef } from "react";
import { Play, Pause, ExternalLink, Calendar } from "lucide-react";
import Image from "next/image";

// 1. CẬP NHẬT INTERFACE THEO DATA ITUNES
interface Song {
    trackId: number;
    trackName: string;
    artistName: string;
    collectionName: string; // Tên Album
    artworkUrl100: string; // Ảnh bìa đẹp
    previewUrl: string; // Link nghe thử 30s
    trackViewUrl: string; // Link gốc Apple Music
    primaryGenreName: string; // Thể loại (Vibe)
    releaseDate: string; // Năm phát hành
    trackTimeMillis: number; // Thời lượng
}

// 2. COMPONENT THẺ BÀI HÁT RIÊNG BIỆT (Xử lý Audio Play/Pause)
export const SongCard = ({ song, index }: { song: Song, index: number }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Pause tất cả các audio khác đang chạy (UX optional)
            document.querySelectorAll('audio').forEach(el => el.pause());
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Reset state khi hết bài
    const handleEnded = () => setIsPlaying(false);
    // Reset state khi bị pause bởi audio khác
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    // Format năm: "2017-11-03" -> "2017"
    const releaseYear = song.releaseDate ? new Date(song.releaseDate).getFullYear() : "";
    
    // Format thời gian: 384000 -> "6:24"
    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div 
            className="group relative flex items-center p-3 bg-[#131722]/60 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-pink-500/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Audio Element ẩn */}
            <audio 
                ref={audioRef} 
                src={song.previewUrl} 
                onEnded={handleEnded} 
                onPause={handlePause}
                onPlay={handlePlay}
            />

            {/* Background Gradient Effect khi Hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            {/* Cột 1: Ảnh Bìa & Nút Play */}
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-lg group-hover:shadow-pink-500/20 transition-shadow">
                <img
                    src={song.artworkUrl100?.replace('100x100bb', '300x300bb')} // Hack lấy ảnh nét hơn
                    alt={song.trackName} 
                    className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-110' : 'group-hover:scale-110'}`} 
                />
                
                {/* Overlay Play Button */}
                <button 
                    onClick={togglePlay}
                    className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                    <div className={`p-2 rounded-full backdrop-blur-md border border-white/20 shadow-xl transform transition-transform ${isPlaying ? 'bg-pink-500 text-white scale-100' : 'bg-white/20 text-white hover:scale-110'}`}>
                        {isPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                        ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                    </div>
                </button>
            </div>

            {/* Cột 2: Thông tin bài hát */}
            <div className="flex-1 min-w-0 ml-4 flex flex-col justify-center gap-1 z-10">
                <div className="flex items-center gap-2">
                    <h3 className={`text-base md:text-lg font-bold truncate transition-colors ${isPlaying ? 'text-pink-400' : 'text-slate-100 group-hover:text-white'}`}>
                        {song.trackName}
                    </h3>
                    {/* Tag Explicit nếu có (Option) */}
                    {/* {song.trackExplicitness === 'explicit' && <span className="text-[10px] border border-slate-500 text-slate-400 px-1 rounded">E</span>} */}
                </div>
                
                <p className="text-sm text-slate-400 truncate group-hover:text-slate-300">
                    {song.artistName}
                </p>
                
                {/* Metadata phụ: Genre • Year */}
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-slate-400">
                        {song.primaryGenreName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {releaseYear}
                    </span>
                     <span>•</span>
                    <span>{formatTime(song.trackTimeMillis)}</span>
                </div>
            </div>

            {/* Cột 3: Visualizer & Link */}
            <div className="ml-4 flex flex-col items-end justify-between h-full gap-2 z-10">
                {/* Sóng nhạc giả lập khi đang play */}
                {isPlaying ? (
                    <div className="flex items-end gap-0.5 h-6 mb-1">
                        <div className="w-1 bg-pink-500 animate-[bounce_1s_infinite] h-3"></div>
                        <div className="w-1 bg-purple-500 animate-[bounce_1.2s_infinite] h-5"></div>
                        <div className="w-1 bg-indigo-500 animate-[bounce_0.8s_infinite] h-2"></div>
                        <div className="w-1 bg-pink-400 animate-[bounce_1.1s_infinite] h-4"></div>
                    </div>
                ) : (
                    <div className="h-6"></div> // Spacer
                )}

                <a 
                    href={song.trackViewUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Open in Apple Music"
                >
                    <ExternalLink className="w-5 h-5" />
                </a>
            </div>
        </div>
    );
};