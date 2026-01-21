"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Music, UploadCloud, Loader2, Sparkles, Play, Image as ImageIcon, X, Disc } from "lucide-react";
import axios from "axios";
import imageCompression from "browser-image-compression";
import { fileToBase64 } from "@/lib/utils/file-to-base64";
import { SongCard } from "@/app/components/song-card";

// Định nghĩa kiểu dữ liệu cho bài hát
interface Song {
    id: number;
    title: string;
    artist: string;
    coverUrl: string;
}

export default function ImageToPlaylistPage() {
    const [isLoading, setIsLoading] = useState(false);

    // 1. THÊM STATE ĐỂ LƯU FILE THẬT
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);

    // Ref chỉ dùng để reset giá trị input UI, không dùng lấy data
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Xử lý khi người dùng chọn file ảnh
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 2. LƯU FILE VÀO STATE NGAY LẬP TỨC
            setSelectedFile(file);

            // Tạo URL local để xem trước ảnh
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            setSongs([]); // Reset lại danh sách bài hát cũ
        }
    };

    // Xóa ảnh đã chọn
    const handleClearImage = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview); // Giải phóng bộ nhớ
        }
        // 3. RESET CẢ STATE FILE VÀ PREVIEW
        setImagePreview(null);
        setSelectedFile(null);
        setSongs([]);

        // Dùng ref để clear giá trị trong input HTML (để chọn lại được cùng 1 file)
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleGenerate = async () => {
        // 4. KIỂM TRA TRỰC TIẾP TRÊN STATE (Thay vì Ref)
        if (!selectedFile) return;

        setIsLoading(true);

        try {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true
            };

            // 5. DÙNG BIẾN STATE ĐỂ XỬ LÝ
            console.log("Starting compression for:", selectedFile.name);
            const compressedFile = await imageCompression(selectedFile, options);

            console.log("Converting to Base64...");
            const base64ImageFile = await fileToBase64(compressedFile);

            console.log("Sending to API...");
            // Lưu ý: Đảm bảo bạn đã có file route.ts tại /api/match-music hoặc sửa lại đường dẫn đúng
            const response = await axios.post('/api/match-music', {
                base64ImageFile
            });

            const vibeData = response.data.result.slice(0, 50);
            setSongs(vibeData);
        } catch (error) {
            console.error("Error generating playlist:", error);
            alert("Có lỗi xảy ra khi tạo playlist. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Container chính: Full màn hình, 2 cột
        <div className="max-w-[1600px] mx-auto p-4 h-screen flex flex-col gap-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 shrink-0 h-16 px-2">
                <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 shadow-lg shadow-violet-500/10">
                    <ImageIcon className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">AI Image-Vibe Matcher</h1>
                    <p className="text-slate-400 text-sm">Extarct your pixel and recommend matching playlist.</p>
                </div>
            </div>

            {/* Main Grid: 2 Columns Equal Height */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">

                {/* LEFT COLUMN: UPLOAD - KHÔNG SCROLL */}
                <div className="flex flex-col h-full bg-slate-900/30 rounded-3xl border border-slate-800 p-8 overflow-hidden">
                    <div className="h-full flex flex-col justify-center items-center gap-6">

                        {/* Upload Box Container */}
                        <div className="w-full relative group p-1 rounded-[32px] bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-indigo-500/20 max-w-lg">
                            <div className="absolute inset-0 blur-xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <div className="relative rounded-[28px] bg-[#0B0F19]/90 backdrop-blur-2xl border border-white/10 p-6 overflow-hidden flex flex-col items-center gap-4">
                                <div className="w-full">
                                    {!imagePreview ? (
                                        <label
                                            htmlFor="dropzone-file"
                                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-700 hover:border-pink-500/50 rounded-3xl cursor-pointer bg-slate-900/30 hover:bg-slate-900/60 transition-all duration-300 group/label relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover/label:opacity-100 transition-opacity"></div>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                                                <div className="p-4 rounded-full bg-slate-800/80 mb-4 group-hover/label:scale-110 transition-transform shadow-lg shadow-black/20">
                                                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover/label:text-pink-400 transition-colors" />
                                                </div>
                                                <p className="mb-2 text-lg text-slate-300 font-medium">Upload Image</p>
                                                <p className="text-xs text-slate-500">PNG, JPG (MAX. 5MB)</p>
                                            </div>
                                            <input
                                                id="dropzone-file"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                ref={fileInputRef}
                                            />
                                        </label>
                                    ) : (
                                        <div className="relative h-64 w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl group/preview">
                                            <img src={imagePreview} alt="Uploaded preview" className="w-full h-full object-cover object-center scale-105 group-hover/preview:scale-100 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                <button
                                                    onClick={handleClearImage}
                                                    className="p-3 bg-black/50 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110 hover:rotate-90"
                                                    title="Remove Image"
                                                >
                                                    <X className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !selectedFile}
                            className="relative overflow-hidden px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-pink-900/30 hover:shadow-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-3 group/btn w-full max-w-lg justify-center shrink-0"
                        >
                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 ease-in-out"></div>

                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                                    <span className="relative z-10 text-base">Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 relative z-10 group-hover/btn:rotate-12 transition-transform" />
                                    <span className="relative z-10 text-base">Generate Playlist</span>
                                </>
                            )}
                        </button>

                    </div>
                </div>

                {/* RIGHT COLUMN: OUTPUT - SCROLLABLE */}
                <div className="h-full rounded-3xl border border-slate-800 bg-slate-950/20 relative overflow-hidden flex flex-col">
                    {songs.length === 0 && !isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                            <div className="inline-flex p-4 rounded-full bg-slate-800/50 mb-4">
                                <Music className="w-10 h-10 text-slate-600" />
                            </div>
                            <p className="text-slate-400 text-lg font-medium">Ready to find your vibe.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            {isLoading && songs.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
                                    <p className="text-pink-400 animate-pulse">Extracting vibe from pixels...</p>
                                </div>
                            )}

                            {songs.length > 0 && (
                                <>
                                    {songs.length > 0 && (
                                        <div className="shrink-0 px-6 pt-6 pb-2 z-20">
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0B0F19]/95 border border-white/10 shadow-xl backdrop-blur-md">
                                                <Disc className="w-5 h-5 text-pink-500 animate-spin-slow" />
                                                <h2 className="text-lg font-bold text-white">Your Playlist</h2>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 pt-4">
                                        {isLoading && songs.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                                <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
                                                <p className="text-pink-400 animate-pulse">Extracting vibe from pixels...</p>
                                            </div>
                                        )}

                                        {songs.length > 0 && (
                                            <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-5">
                                                {songs.map((song, index) => (
                                                    <SongCard key={song.trackId} song={song} index={index} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}