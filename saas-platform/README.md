This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

🚀 Giai đoạn 3: AI Media Processing & Interactive Features (Xử lý Đa phương tiện & Tương tác)
Trạng thái: ✅ Hoàn thành

Thời gian: [Điền ngày hoàn thành] (Ví dụ: 18 - 19/1/2026)

Công nghệ: Next.js, Gemini 1.5 Flash (Vision), iTunes Search API, MediaPipe, Tone.js, Supabase Connection Pooling.

📝 Tổng quan
Giai đoạn 3 đánh dấu bước chuyển mình từ xử lý văn bản thuần túy sang xử lý đa phương tiện (Hình ảnh & Âm thanh). Trọng tâm là xây dựng các trải nghiệm người dùng mang tính tương tác cao (Interactive UI) và tối ưu hóa hiệu năng khi làm việc với dữ liệu lớn (ảnh Base64). Ngoài ra, giai đoạn này cũng giải quyết triệt để vấn đề tương thích mạng (IPv4/IPv6) khi kết nối Database từ môi trường Serverless.

✨ Tính năng đã hoàn thành
1. 🎵 Vibe-based Music Recommender (Gợi ý nhạc theo ảnh)
Input: Người dùng upload ảnh (Selfie, phong cảnh...).

Processing:

Sử dụng Gemini 1.5 Flash (Vision) để phân tích cảm xúc, bối cảnh, màu sắc.

Trích xuất Genre (Thể loại) và Keywords (Từ khóa: Rain, Chill, Night...).

Output: Danh sách bài hát (có link nghe thử 30s) từ iTunes Search API phù hợp với "vibe" của ảnh.

UI: Giao diện Glassmorphism, tích hợp trình phát nhạc Mini Player với hiệu ứng sóng nhạc (Visualizer).

2. 🖐️ Gesture-to-Audio Synthesizer (Tạo nhạc bằng cử chỉ)
Cơ chế: Sử dụng MediaPipe (Computer Vision) chạy trực tiếp trên trình duyệt để bắt tọa độ bàn tay theo thời gian thực.

Mapping: Ánh xạ khoảng cách ngón tay (Pinch) và vị trí không gian (X, Y) thành cao độ và âm lượng.

Audio Engine: Sử dụng Tone.js để tổng hợp âm thanh (Synth) không độ trễ.

🛠️ Giải pháp Kỹ thuật & Thuật toán (Technical Highlights)
🌊 1. Thuật toán "Waterfall Search" (Tìm kiếm Thác nước)
Để giải quyết vấn đề iTunes API không hỗ trợ tìm kiếm theo ngữ nghĩa (Semantic Search), hệ thống sử dụng chiến thuật "Chia để trị":

Level 1 (Strict): Tìm kiếm kết hợp Genre + 3 Keywords (Độ chính xác cao nhất).

Level 2 (Medium): Nếu thiếu kết quả, giảm xuống Genre + 2 Keywords.

Level 3 (Fallback): Cuối cùng tìm theo Genre để đảm bảo luôn có dữ liệu trả về.

Parallel Execution: Sử dụng Promise.all để chạy song song các query, giảm thời gian chờ xuống mức thấp nhất.

🔌 2. Supabase Connection Pooling (Khắc phục lỗi IPv4)
Do môi trường mạng local và một số Docker container không hỗ trợ tốt IPv6, dẫn đến lỗi kết nối ENOTFOUND với Supabase Direct Connection (Port 5432).

Giải pháp: Chuyển sang sử dụng Transaction Pooler (Port 6543) hoặc Session Pooler.

Lợi ích:

Hỗ trợ mạng IPv4.

Quản lý hàng đợi kết nối hiệu quả cho kiến trúc Serverless (Next.js), tránh lỗi Too many connections.

📉 3. Client-side Optimization
Image Compression: Sử dụng browser-image-compression để nén ảnh xuống dưới 1MB trước khi gửi lên Server, giúp tiết kiệm băng thông và tăng tốc độ phân tích của AI.

No Base64 in DB: Quyết định kiến trúc không lưu nội dung ảnh Base64 vào bảng lịch sử chính (ai_outputs) để tránh làm phình Database và tắc nghẽn Event Loop. Chỉ lưu metadata và prompt.

⚠️ 3. Troubleshooting & Bài học (Lưu ý quan trọng)
Những lỗi kỹ thuật "xương máu" đã gặp và cách khắc phục trong giai đoạn này:

❌ Lỗi getaddrinfo ENOTFOUND (Database Connection)
Hiện tượng: Server báo lỗi không tìm thấy host Supabase dù tên miền đúng.

Nguyên nhân: Node.js (v17+) ưu tiên phân giải DNS qua IPv6, nhưng mạng local/WSL chỉ hỗ trợ IPv4.

Fix:

Dùng cross-env thêm cờ: NODE_OPTIONS='--dns-result-order=ipv4first'.

Đổi port kết nối trong .env sang 6543 (Pooler Mode).

❌ Lỗi hiển thị ảnh (Blob URL)
Hiện tượng: Component <Image /> của Next.js báo lỗi thiếu width/height khi hiển thị ảnh preview (blob:...).

Nguyên nhân: Next.js Image Optimization cần kích thước tĩnh, trong khi Blob URL là động.

Fix: Sử dụng thẻ <img> tiêu chuẩn của HTML cho các ảnh preview local để linh hoạt và nhẹ hơn.

❌ Lỗi PayloadTooLarge / Lag Server
Hiện tượng: App bị treo hoặc crash khi cố gắng lưu lịch sử tạo nhạc.

Nguyên nhân: Gửi chuỗi Base64 quá lớn (vài MB) vào câu lệnh INSERT của Database.

Fix: Tách biệt luồng dữ liệu. Chỉ gửi ảnh sang AI để xử lý, khi lưu vào DB thì loại bỏ trường Base64 hoặc chỉ lưu URL (nếu dùng Storage).