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