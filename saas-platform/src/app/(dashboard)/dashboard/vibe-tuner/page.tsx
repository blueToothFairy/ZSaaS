"use client";

import { useState, useRef } from "react";
import { Music, UploadCloud, Loader2, Sparkles, Play, Image as ImageIcon, X, Disc } from "lucide-react";
import axios from "axios";
import imageCompression from "browser-image-compression";
import { fileToBase64 } from "@/lib/utils/file-to-base64";

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
            
            console.log("Success:", response.data);
            if (response.data.songs) {
                setSongs(response.data.songs);
            }
            
        } catch (error) {
            console.error("Error generating playlist:", error);
            alert("Có lỗi xảy ra khi tạo playlist. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header Title */}
            <div className="text-center space-y-4 mb-12 relative">
                <div className="inline-flex relative p-4 mb-2">
                    <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative p-3 rounded-2xl bg-[#0B0F19]/60 border border-pink-500/30 shadow-lg shadow-pink-500/10 backdrop-blur-md group">
                        <ImageIcon className="w-8 h-8 text-pink-400 absolute -left-2 -top-2 rotate-[-10deg] opacity-60 group-hover:rotate-[-20deg] group-hover:scale-110 transition-all duration-300" />
                        <Music className="w-12 h-12 text-pink-500 relative z-10 group-hover:scale-105 transition-transform" />
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-pink-200 to-purple-400">
                    Image to Vibe Playlist
                </h1>
                <p className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">
                    Struggling to pick music? Upload an image and let AI extract its vibe into the perfect soundtrack.
                </p>
            </div>

            {/* Main Upload Section */}
            <div className="relative group p-1 rounded-[32px] bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-indigo-500/20">
                <div className="absolute inset-0 blur-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                <div className="relative rounded-[28px] bg-[#0B0F19]/80 backdrop-blur-2xl border border-white/10 p-8 overflow-hidden flex flex-col items-center gap-8">
                    <div className="w-full max-w-2xl">
                        {!imagePreview ? (
                            <label
                                htmlFor="dropzone-file"
                                className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-slate-700 hover:border-pink-500/50 rounded-3xl cursor-pointer bg-slate-900/30 hover:bg-slate-900/60 transition-all duration-300 group/label relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover/label:opacity-100 transition-opacity"></div>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                                    <div className="p-4 rounded-full bg-slate-800/80 mb-4 group-hover/label:scale-110 transition-transform shadow-lg shadow-black/20">
                                        <UploadCloud className="w-12 h-12 text-slate-400 group-hover/label:text-pink-400 transition-colors" />
                                    </div>
                                    <p className="mb-3 text-xl text-slate-300 font-medium">Click to upload or drag and drop</p>
                                    <p className="text-sm text-slate-500">PNG, JPG or WEBP (MAX. 5MB)</p>
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
                            <div className="relative h-80 w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl group/preview">
                                <img src={imagePreview} alt="Uploaded preview" className="w-full h-full object-cover object-center scale-105 group-hover/preview:scale-100 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <button
                                        onClick={handleClearImage}
                                        className="p-4 bg-black/50 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110 hover:rotate-90"
                                        title="Remove Image"
                                    >
                                        <X className="w-8 h-8" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Button - Disabled logic updated based on selectedFile */}
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !selectedFile} 
                        className="relative overflow-hidden px-10 py-5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-pink-900/30 hover:shadow-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-4 group/btn w-full max-w-md justify-center"
                    >
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 ease-in-out"></div>

                        {isLoading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin relative z-10" />
                                <span className="relative z-10">Analyzing Vibe...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6 relative z-10 group-hover/btn:rotate-12 transition-transform" />
                                <span className="relative z-10">Generate Playlist</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4 pt-8 relative z-10">
                {songs.length > 0 && (
                    <div className="flex items-center gap-3 mb-6 pl-2 animate-in fade-in slide-in-from-bottom-5">
                        <Disc className="w-6 h-6 text-pink-500 animate-spin-slow" />
                        <h2 className="text-2xl font-bold text-white">Your Vibe Playlist</h2>
                    </div>
                )}

                <div className="grid gap-3">
                    {songs.map((song, index) => (
                        <div
                            key={song.id}
                            className="group flex items-center p-3 pr-5 bg-[#131722]/60 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-pink-500/30 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden backdrop-blur-md"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                            <div className="relative w-16 h-16 rounded-xl overflow-hidden mr-5 border border-white/10 flex-shrink-0 bg-slate-800 shadow-lg group-hover:shadow-pink-500/20 transition-shadow">
                                <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <Play className="w-8 h-8 text-white fill-white/80" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 relative z-10 flex flex-col justify-center h-full">
                                <h3 className="text-lg font-semibold text-slate-200 group-hover:text-white truncate transition-colors">{song.title}</h3>
                                <p className="text-sm text-slate-400 truncate group-hover:text-pink-300/80 transition-colors">{song.artist}</p>
                            </div>

                            <div className="ml-4 relative z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                <button className="p-3 rounded-full bg-pink-500/20 text-pink-400 hover:text-white hover:bg-pink-500 transition-all shadow-lg shadow-pink-500/10">
                                    <Play className="w-5 h-5 fill-current" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {songs.length === 0 && !isLoading && (
                    <div className="text-center py-20 border-2 border-dashed border-slate-800/50 rounded-3xl bg-slate-900/20 backdrop-blur-sm animate-in fade-in">
                        <div className="inline-flex p-4 rounded-full bg-slate-800/50 mb-4">
                            <Music className="w-10 h-10 text-slate-600" />
                        </div>
                        <p className="text-slate-400 text-lg font-medium">Upload an image to get started.</p>
                        <p className="text-slate-600 text-sm mt-2">Your playlist will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}