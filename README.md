# 🚀 Giai đoạn 1: Authentication System & User Synchronization (1 ngày)

**Trạng thái:** ✅ Hoàn thành
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