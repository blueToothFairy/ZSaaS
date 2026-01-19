# 🚀 Giai đoạn 1: Authentication System & User Synchronization

**Trạng thái:** ✅ Hoàn thành

**Thời gian:** 9 - 10/1/2026

**Công nghệ:** Next.js 14 (App Router), Clerk Auth, Supabase, Ngrok (Static Domain).

## 📝 Tổng quan

Giai đoạn này tập trung xây dựng nền móng vững chắc cho hệ thống xác thực người dùng và đồng bộ dữ liệu. Mục tiêu là đảm bảo người dùng có thể đăng nhập an toàn, và dữ liệu định danh của họ được tự động sao lưu từ Clerk (Auth Provider) sang Supabase (Database chính) để phục vụ các tính năng nghiệp vụ sau này.

## ✨ Tính năng đã hoàn thành

* **Authentication Flow:** Đăng ký (Sign-up), Đăng nhập (Sign-in) sử dụng Clerk.
* **Social Login:** Tích hợp đăng nhập nhanh qua Google (OAuth).
* **Route Protection:** Bảo vệ các trang nội bộ (Dashboard) bằng Middleware. Chuyển hướng người dùng chưa đăng nhập về trang Sign-in.
* **Data Synchronization:** Cơ chế **Webhook** tự động đồng bộ thông tin User (Email, Tên, Avatar) từ Clerk về bảng `user_profiles` trong Supabase.
* **Smart Redirect:** Xử lý điều hướng thông minh, tránh lặp trang (Redirect Loop) sau khi đăng nhập.

## 🏗️ Kiến trúc & Luồng dữ liệu (Architecture Flow)

1. **User Login:** Người dùng đăng nhập tại Client (Next.js).
2. **Session Management:** Clerk tạo Session Token và lưu vào Cookie (`__session`).
3. **Middleware Guard:**
* File `proxy.ts` chạy trên Server (Edge).
* Kiểm tra Cookie để quyết định cho vào `/dashboard` hay đá về `/sign-in`.


4. **Async Webhook (Sync):**
* Ngay khi User được tạo trên Clerk Cloud.
* Clerk bắn sự kiện `user.created` qua Webhook.
* **Ngrok** nhận tín hiệu -> Chuyển tiếp vào `https://domain:3000/api/webhooks`.
* Server xử lý và lưu User vào **Supabase**.



## ⚙️ Cài đặt & Cấu hình (Setup)

### 1. Biến môi trường (`.env.local`)

Đây là phần quan trọng nhất. Cần đảm bảo các Key chính xác và **không có ký tự thừa**.

```env
# --- Clerk Auth Keys ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_... 

# --- Clerk URLs (Routing) ---
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# --- Supabase (Database) ---
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (Dùng cho Webhook để ghi dữ liệu vào supabase với quyền Admin)

# --- Webhook Secret (Quan trọng) ---
# Lấy từ Dashboard (dùng Ngrok)
WEBHOOK_SECRET=whsec_...

```

### 2. Chạy dự án (How to run)

Để hệ thống Webhook hoạt động, cần chạy song song 2 terminal:

**Terminal 1: Chạy Next.js App**

```bash
npm run dev
```

**Terminal 2: Chạy Ngrok (Static Domain)**
*Lưu ý: Dùng Static Domain để không phải config lại URL trên Clerk mỗi lần khởi động.*

```bash
ngrok http --domain=YOUR-STATIC-DOMAIN.ngrok-free.app 3000
```

## 🧠 Bài học & Lưu ý quan trọng (Dev Notes)

### 1. Vấn đề "Split Brain" (Não bộ chia đôi)

* **Hiện tượng:** Client đã đăng nhập (`useUser` có data) nhưng Server/Middleware báo `null`.
* **Nguyên nhân:** Thường do thiếu hoặc sai `CLERK_SECRET_KEY` trong `.env`. Server không giải mã được Cookie.
* **Khắc phục:** Luôn kiểm tra kỹ Secret Key và restart server khi sửa file `.env`.

### 2. Tên file Middleware

* **Bắt buộc:** Phải đặt tên là `proxy.ts` với next bản mới nhất (ngang hàng thư mục `app` hoặc trong `src`).

### 3. Webhook Latency (Độ trễ)

* Có một độ trễ nhỏ (vài ms) giữa lúc User vào Dashboard và lúc Webhook ghi xong dữ liệu vào Supabase.
* **Xử lý UI:** Tại Frontend, luôn check `null` khi fetch dữ liệu từ Supabase hoặc dùng data từ Clerk (`useUser`) để hiển thị tạm thời.

### 4. Ngrok Configuration

* Không được dùng `localhost:3000` làm Endpoint trên Clerk Dashboard (Clerk không thể gọi vào local).
* Thay vào đó, phải dùng URL của Ngrok (`https://...ngrok-free.app/api/webhooks`).

---
# 🚀 Giai đoạn 2 - Backend Core & AI Integration

**Thời gian thực hiện:** 12 - 13/01/2026  
**Trạng thái:** ✅ Đã hoàn thành  
**Mục tiêu:** Xây dựng kiến trúc Backend vững chắc, tích hợp Gemini AI và kết nối Database an toàn.

---

## 🛠 1. Kiến trúc hệ thống (System Architecture)

Thay vì sử dụng mô hình MVC truyền thống (thường thấy ở Express/Laravel), dự án chuyển sang kiến trúc **Modular Architecture** tối ưu cho **Next.js App Router**:

| Layer | Vị trí | Trách nhiệm | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Presentation** | `src/app/**/page.tsx` | Giao diện UI (React Server Components) | Chỉ hiển thị dữ liệu |
| **Controller** | `src/app/api/**/route.ts` | Xử lý Request/Response, Check Auth | Điều phối luồng dữ liệu |
| **Service** | `src/lib/ai/*.ts` | Logic nghiệp vụ phức tạp (AI, 3rd Party) | Độc lập với Framework |
| **Data Access** | `src/lib/db/*.ts` | Tương tác trực tiếp với Database | Repository Pattern |

---

## 💡 2. Các kỹ thuật đã triển khai (Key Implementations)

### 🔌 Database Singleton Pattern
**Vấn đề:** Trong môi trường Dev, tính năng Hot Reload của Next.js khiến kết nối Database bị khởi tạo lại liên tục, dẫn đến lỗi `Too many connections`.  
**Giải pháp:** Sử dụng biến `globalThis` để lưu trữ instance kết nối, đảm bảo chỉ có **duy nhất 1 kết nối** tồn tại.

### 🧠 Gemini Service & Retry Strategy

**Vấn đề:** Model AI (bản Free/Preview) thường xuyên trả về lỗi `503 Overloaded`.

**Giải pháp:**.
* Cài đặt thuật toán **Exponential Backoff** (Thử lại với thời gian chờ tăng dần: 2s -> 4s -> 6s) để tăng tỷ lệ thành công.

### ✍️ Prompt Engineering: Builder Pattern

Sử dụng Class `PromptBuilder` để xây dựng prompt theo chuẩn **CO-STAR** (Context, Objective, Style, Tone, Audience, Response), giúp code clean và dễ bảo trì hơn cộng chuỗi thủ công.

### 🛡️ Secure Server-side Auth

Tuyệt đối không gửi `userId` từ Client. Sử dụng hàm `auth()` của Clerk ngay tại Server để lấy định danh người dùng, ngăn chặn lỗ hổng giả mạo (Impersonation).

---

## ⚠️ 3. Troubleshooting & Bài học (Lưu ý quan trọng)

Trong quá trình phát triển Phase 2, đã gặp và xử lý triệt để các vấn đề sau:

### ❌ Lỗi `Invalid URL` (Axios on Server)

* **Hiện tượng:** Gọi `axios.post('/api/save-output')` từ `route.ts` bị lỗi.
* **Bài học:** Server Node.js không hiểu đường dẫn tương đối (relative path).
* **Fix:** Không gọi API vòng vo. Import trực tiếp hàm xử lý DB (`saveOutput` từ `lib/db/queries.ts`) để gọi hàm. Vừa nhanh hơn, vừa không lỗi mạng.

### ❌ Lỗi Database Constraints (Foreign Key)

* **Hiện tượng:** Lỗi `Key (user_id) is not present in table "user_profiles"`.
* **Nguyên nhân:** User đăng ký bên Clerk nhưng chưa được đồng bộ (Webhook) về bảng `user_profiles` dưới Local DB.
* **Fix (MVP):** Tạm thời gỡ bỏ ràng buộc khóa ngoại (`Foreign Key`) ở bảng `ai_outputs` để ưu tiên phát triển tính năng AI trước.

---
Chúc mừng bạn đã hoàn thành **Giai đoạn 3**! Đây là giai đoạn cực kỳ quan trọng vì nó không chỉ đụng đến logic AI phức tạp (xử lý đa phương tiện) mà còn giải quyết được các bài toán hạ tầng mạng "hóc búa" (IPv4/IPv6, Connection Pooling).

Dưới đây là nội dung file `README.md` được tổng hợp chi tiết, chuyên nghiệp và đúng format để bạn cập nhật vào dự án.

---

# 🚀 Giai đoạn 3: AI Media Processing & Interactive Features (Xử lý Đa phương tiện & Tương tác)

**Trạng thái:** ✅ Hoàn thành

**Thời gian:** 19/1/2026

**Công nghệ:** Next.js, Gemini 1.5 Flash (Vision), Supabase Connection Pooling.

## 📝 Tổng quan

Giai đoạn 3 đánh dấu bước chuyển mình từ xử lý văn bản thuần túy sang xử lý đa phương tiện (Hình ảnh). Trọng tâm là xây dựng các trải nghiệm người dùng mang tính tương tác cao (Interactive UI) và tối ưu hóa hiệu năng khi làm việc với dữ liệu lớn (ảnh Base64). Ngoài ra, giai đoạn này cũng giải quyết triệt để vấn đề tương thích mạng (IPv4/IPv6) khi kết nối Database từ môi trường Serverless.

## ✨ Tính năng đã hoàn thành

### 1. 🎵 Vibe-based Music Recommender (Gợi ý nhạc theo ảnh)

* **Input:** Người dùng upload ảnh (Selfie, phong cảnh...).
* **Processing:**
* Sử dụng **Gemini 1.5 Flash (Vision)** để phân tích cảm xúc, bối cảnh, màu sắc.
* Trích xuất `Genre` (Thể loại) và `Keywords` (Từ khóa: Rain, Chill, Night...).


* **Output:** Danh sách bài hát (có link nghe thử 30s) từ **iTunes Search API** phù hợp với "vibe" của ảnh.
* **UI:** Giao diện Glassmorphism, tích hợp trình phát nhạc Mini Player với hiệu ứng sóng nhạc (Visualizer).

---

### 2. 📄 AI Resume Analyzer (Chuyên gia Phân tích CV)

Hệ thống đóng vai trò như một HR Manager chuyên nghiệp, giúp người dùng tối ưu hóa hồ sơ xin việc trước khi gửi đi.

* **Input:** File CV định dạng PDF (Text-based).
* **Processing:**
* **Server-side Parsing:** Sử dụng thư viện `pdf-parse` (v2) tại API Route để trích xuất văn bản thô từ file PDF buffer một cách an toàn, tránh lỗi thiếu thư viện `fs` ở phía Client.
* **Contextual Analysis:** Gửi văn bản đã trích xuất kèm Prompt chuyên sâu (theo khung CO-STAR) tới **Gemini 2.5 Flash**.
* **JSON Enforcement:** Ép mô hình trả về kết quả dưới dạng JSON thuần túy để dễ dàng render lên giao diện.


* **Output:**
* **Match Score:** Chấm điểm độ mạnh của hồ sơ trên thang 100.
* **SWOT Analysis:** Phân tích điểm mạnh, điểm yếu.
* **Actionable Advice:** Gợi ý sửa đổi cụ thể cho từng mục (Kinh nghiệm, Kỹ năng, v.v.).



---

## 🛠️ Giải pháp Kỹ thuật & Thuật toán (Technical Highlights)

### 🌊 1. Thuật toán "Waterfall Search" (Tìm kiếm Thác nước)

Để giải quyết vấn đề iTunes API không hỗ trợ tìm kiếm theo ngữ nghĩa (Semantic Search), hệ thống sử dụng chiến thuật "Chia để trị":

1. **Level 1 (Strict):** Tìm kiếm kết hợp `Genre + 3 Keywords` (Độ chính xác cao nhất).
2. **Level 2 (Medium):** Nếu thiếu kết quả, giảm xuống `Genre + 2 Keywords`.
3. **Level 3 (Fallback):** Cuối cùng tìm theo `Genre` để đảm bảo luôn có dữ liệu trả về.
4. **Parallel Execution:** Sử dụng `Promise.all` để chạy song song các query, giảm thời gian chờ xuống mức thấp nhất.

### 🔌 2. Supabase Connection Pooling (Khắc phục lỗi IPv4)

Do môi trường mạng local và một số Docker container không hỗ trợ tốt IPv6, dẫn đến lỗi kết nối `ENOTFOUND` với Supabase Direct Connection (Port 5432).

* **Giải pháp:** Chuyển sang sử dụng **Transaction Pooler** (Port `6543`) hoặc Session Pooler.
* **Lợi ích:**
* Hỗ trợ mạng **IPv4**.
* Quản lý hàng đợi kết nối hiệu quả cho kiến trúc Serverless (Next.js), tránh lỗi `Too many connections`.



### 📉 3. Client-side Optimization

* **Image Compression:** Sử dụng `browser-image-compression` để nén ảnh xuống dưới 1MB trước khi gửi lên Server, giúp tiết kiệm băng thông và tăng tốc độ phân tích của AI.

---

## ⚠️ 3. Troubleshooting & Bài học (Lưu ý quan trọng)

Những lỗi kỹ thuật "xương máu" đã gặp và cách khắc phục trong giai đoạn này:

### ❌ Lỗi `getaddrinfo ENOTFOUND` (Database Connection)

* **Hiện tượng:** Server báo lỗi không tìm thấy host Supabase dù tên miền đúng.
* **Nguyên nhân:** Node.js (v17+) ưu tiên phân giải DNS qua IPv6, nhưng mạng local/WSL đôi khi chỉ hỗ trợ IPv4.
* **Fix:**
1. Dùng `cross-env` thêm cờ: `NODE_OPTIONS='--dns-result-order=ipv4first'`.
2. Đổi port kết nối trong `.env` sang **6543** (Pooler Mode).



### ❌ Lỗi hiển thị ảnh (`Blob URL`)

* **Hiện tượng:** Component `<Image />` của Next.js báo lỗi thiếu `width/height` khi hiển thị ảnh preview (`blob:...`).
* **Nguyên nhân:** Next.js Image Optimization cần kích thước tĩnh, trong khi Blob URL là động.
* **Fix:** Sử dụng thẻ `<img>` tiêu chuẩn của HTML cho các ảnh preview local để linh hoạt và nhẹ hơn.

### ❌ Lỗi `Module not found: Can't resolve 'fs'` (PDF Parsing)

* **Hiện tượng:** App báo lỗi khi import `pdf-parse` trực tiếp vào Page (Client Component).
* **Nguyên nhân:** Thư viện này phụ thuộc vào module hệ thống `fs` của Node.js, vốn không tồn tại trên trình duyệt.
* **Fix:** Chuyển toàn bộ logic đọc file vào API Route (`app/api/analyze-cv/route.ts`). Client chỉ gửi `FormData` chứa file về Server.

---