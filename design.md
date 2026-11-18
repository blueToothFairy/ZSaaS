# VibeTune (ZSaaS) - Tài Liệu Thiết Kế Hệ Thống & Luồng Hoạt Động Chi Tiết

> **Phiên bản:** 1.0.0
> **Cập nhật lần cuối:** 2026-03
> **Dự án:** VibeTune SaaS Platform
> **Kho mã nguồn:** `ZSaaS`

---

## 1. Tổng Quan Hệ Thống (System Overview)

### 1.1. Giới thiệu VibeTune

**VibeTune** là một công cụ tìm nhạc nền (AI Soundtrack Finder) dành cho người tạo nội dung (content creators), giúp họ chọn bản nhạc phù hợp nhất cho một nội dung cụ thể — ảnh, video hoặc dự án sáng tạo — sao cho nhạc vừa phù hợp với nội dung vừa phù hợp với cảm xúc người tạo muốn truyền tải.

VibeTune đưa ý định của người tạo lên hàng đầu và kết hợp nó với hiểu biết về nội dung trực quan để gợi ý một danh sách ngắn các bài hát phù hợp, mỗi bài đều đi kèm lý do rõ ràng tại sao nó phù hợp.

Khác biệt với các dịch vụ nhạc cá nhân hóa truyền thống, VibeTune không tạo playlist theo lịch sử nghe hoặc độ phổ biến. Thay vào đó, nó giúp người tạo nội dung trả lời câu hỏi: *bản nhạc nào sẽ làm nội dung này cảm nhận theo cách tôi muốn?*

**Công nghệ hỗ trợ (không phải giá trị cốt lõi):** thị giác máy tính (AI Vision/CLIP), dữ liệu thời tiết và tìm kiếm nhạc (iTunes) là công nghệ hỗ trợ, không phải là mệnh giá của sản phẩm. Khả năng như phân tích video, phối nhịp, cá nhân hóa nâng cao và kho nhạc bản quyền là tính năng trên lộ trình phát triển, chưa phải là phần đã triển khai.

### 1.2. Kiến Trúc Tổng Thể (High-Level Architecture)

Hệ thống được thiết kế theo mô hình **Microservices lai (Hybrid Multi-Service Architecture)** gồm 3 phân hệ độc lập:

1. **Frontend (`saas-platform`)**: Next.js 15+ App Router, React 19, TypeScript, TailwindCSS, Motion, tích hợp xác thực Clerk.
2. **Backend Gateway & Core Services (`backend`)**: Node.js + Express.js 5, TypeScript, tuân thủ kiến trúc phân lớp theo miền (Domain-Driven Layered Architecture), Knex.js ORM, Upstash Redis Caching, Distributed Rate Limiting.
3. **AI Vision Service (`AI_CLIP`)**: Python FastAPI Microservice, ONNX Runtime với mô hình OpenAI CLIP ViT-B/32 Vision Encoder, Vector Cosine Similarity cho tác vụ trích xuất cảm xúc từ hình ảnh.
4. **Hạ tầng lưu trữ & Dịch vụ bên thứ ba (External & Storage)**:
   - **PostgreSQL**: Lưu trữ người dùng, bài hát yêu thích, nhật ký quét AI.
   - **Upstash Redis**: Cache tìm kiếm bài hát, ngữ cảnh thời tiết, distributed rate limiter token bucket.
   - **Clerk Auth**: Quản lý định danh (Identity Provider - IdP), JWT session token.
   - **Apple iTunes Search API**: Kho dữ liệu bài hát và bản nghe thử (30-second audio preview).
   - **Open-Meteo & WeatherAPI**: Dữ liệu khí tượng thủy văn theo tọa độ địa lý.
   - **IP Geolocation (`ipinfo.io`)**: Phân giải vị trí người dùng từ IP / Geo-headers.

```mermaid
graph TB
    subgraph Client ["Client Browser / Mobile Web"]
        UI["Next.js App Router (React 19)"]
        AudioPlayer["Web Audio Player (HTML5 Audio)"]
    end

    subgraph Auth ["Authentication Provider"]
        Clerk["Clerk Auth Service (OAuth / Passkeys / JWT)"]
    end

    subgraph FrontendProxy ["Frontend Layer (saas-platform)"]
        NextServer["Next.js Server / Proxy Rewrite (/api/*)"]
    end

    subgraph BackendGateway ["Backend Core (backend - Express 5)"]
        RateLimiter["Rate Limiting Middleware (Redis Store)"]
        ClerkMW["Clerk Auth Middleware (JWT Verify)"]
      
        Router["Express App Router"]
      
        subgraph Modules ["Business Domain Modules"]
            VibeMod["vibe-scan Module"]
            WeatherMod["weather-time Module"]
            SongMod["song Module"]
            ProfileMod["profile Module"]
            HealthMod["health & admin Modules"]
            KeepAliveMod["keepalive Module"]
        end

        CacheLayer["CacheService (Upstash Redis)"]
        DBLayer["Knex Client (PostgreSQL)"]
    end

    subgraph AIService ["AI Vision Microservice (AI_CLIP - FastAPI)"]
        ONNX["ONNX Runtime (CLIP Vision Encoder)"]
        VibeVector["Cosine Similarity (Vibe Embeddings Matrix)"]
    end

    subgraph ExternalAPIs ["External APIs & Cloud"]
        ItunesAPI["Apple iTunes Search API"]
        WeatherAPIs["WeatherAPI / Open-Meteo API"]
        GeoAPI["ipinfo.io Geolocation"]
        PostgresDB[("PostgreSQL Database")]
        RedisDB[("Upstash Redis")]
    end

    %% Flow connections
    UI -->|1. Đăng nhập / Lấy JWT| Clerk
    UI -->|2. Gọi API /api/*| NextServer
    NextServer -->|Proxy rewrite| RateLimiter
    RateLimiter --> ClerkMW
    ClerkMW --> Router
  
    Router --> VibeMod
    Router --> WeatherMod
    Router --> SongMod
    Router --> ProfileMod
    Router --> HealthMod
    Router --> KeepAliveMod

    VibeMod -->|HTTP POST Multipart| AIService
    VibeMod --> SongMod
    WeatherMod --> WeatherAPIs
    WeatherMod --> GeoAPI
    WeatherMod --> SongMod
  
    SongMod -->|Tra cứu & Caching| CacheLayer
    SongMod -->|Query Catalog| ItunesAPI
    ProfileMod -->|CRUD Favorites| DBLayer
  
    CacheLayer <--> RedisDB
    DBLayer <--> PostgresDB
    RateLimiter <--> RedisDB
  
    UI -.->|3. Stream 30s Audio Preview| ItunesAPI
```

---

## 2. Cấu Trúc Dự Án & Tổ Chức Mã Nguồn (Project Structure)

### 2.1. Phân cấp thư mục gốc (Root Directory Structure)

```
ZSaaS/
├── README.md                      # Hướng dẫn tổng thể, cài đặt và cấu hình
├── design.md                      # Tài liệu thiết kế hệ thống chi tiết (File này)
├── docker-compose.yml             # Điều phối container cho môi trường Local / Staging
│
├── saas-platform/                 # 🌐 Phân hệ Frontend (Next.js 15+ / React 19)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root Layout, bọc ClerkProvider, Font & Meta
│   │   │   ├── page.tsx           # Entry router: redirect /home hoặc /landing-page
│   │   │   ├── globals.css        # CSS Tokens, Design system, Tailwind classes
│   │   │   ├── landing-page/      # Trang giới thiệu sản phẩm khi chưa đăng nhập
│   │   │   ├── home/              # Dashboard chính: Quét vibe, Thời tiết, Player, Favorites
│   │   │   ├── sign-in/           # Clerk Sign-in component wrapper
│   │   │   ├── sign-up/           # Clerk Sign-up component wrapper
│   │   │   └── components/        # Reusable UI & Figma components
│   │   ├── lib/utils/             # image-compressor.ts, file-to-base64.ts
│   │   └── styles/                # CSS themes, typography
│   └── next.config.ts             # Cấu hình API proxy rewrite sang Backend
│
├── backend/                       # ⚙️ Phân hệ Backend API Gateway & Business Logic
│   ├── src/
│   │   ├── server.ts              # Entry point: Kết nối Redis, gắn limiter, khởi động HTTP
│   │   ├── app.ts                 # Đăng ký middleware, CORS, Clerk, Route Modules
│   │   ├── modules/               # Các module chức năng (Domain-Driven Design)
│   │   │   ├── vibe-scan/         # Upload ảnh, gọi AI service, map bài hát
│   │   │   ├── weather-time/      # Phân giải IP/vị trí, tra cứu thời tiết, gợi ý nhạc
│   │   │   ├── song/              # Search iTunes, ranking, scoring, deduplication
│   │   │   ├── profile/           # Quản lý Favorites (PostgreSQL via Knex)
│   │   │   ├── health/            # Kiểm tra trạng thái Redis, DB, Memory
│   │   │   ├── admin/             # Invalidation cache, điều khiển hệ thống
│   │   │   └── keepalive/         # Endpoint giữ server ấm (tránh cold start)
│   │   └── shared/                # Thư viện dùng chung trong backend
│   │       ├── db/                # Singleton kết nối Knex PostgreSQL
│   │       ├── redis/             # Singleton kết nối Upstash Redis
│   │       ├── cache/             # CacheService với TTL chuẩn hóa
│   │       ├── middleware/        # RateLimiting (Redis / In-memory fallback)
│   │       ├── types/             # ClerkRequest, type definitions
│   │       └── utils/             # requestCountry.ts (Phân giải mã quốc gia ISO)
│   └── tsconfig.json              # TypeScript ESM compilation
│
└── AI_CLIP/                       # 🤖 Phân hệ Trí tuệ nhân tạo (FastAPI + ONNX CLIP)
    ├── main.py                    # Ứng dụng FastAPI, endpoint /extract-vibes, /ping
    ├── clip_vision_512.onnx       # Trọng số mô hình CLIP Vision Encoder dạng ONNX
    ├── vibe_embeddings.npy        # Vector nhúng của tập từ khóa tâm trạng (N x 512)
    ├── vibe_keywords.npy          # Danh sách từ khóa cảm xúc/thẩm mỹ tương ứng
    ├── Dockerfile                 # Đóng gói container chạy CPU/Hugging Face Spaces
    └── requirements.txt           # fastapi, uvicorn, onnxruntime, transformers, pillow
```

### 2.2. Quy ước Thiết kế Module Backend (DDD Pattern)

Mỗi module bên trong `backend/src/modules/` đều tuân thủ nguyên lý đóng gói nghiêm ngặt:

- **`{module}.controller.ts`**: Tiếp nhận HTTP request, xác thực đầu vào, gọi service, đóng gói HTTP response và mã lỗi.
- **`{module}.service.ts`**: Chứa toàn bộ Business Logic, độc lập hoàn toàn với framework HTTP (Express).
- **`{module}.repository.ts / {name}.knex.ts`**: Tầng tương tác cơ sở dữ liệu (Knex queries).
- **`{module}.interface.ts`**: Khai báo TypeScript contract cho Service và Repository để hỗ trợ Dependency Injection và Unit Test.
- **`{module}.dto.ts`**: Định nghĩa cấu trúc dữ liệu truyền vào/ra (Data Transfer Object).
- **`{module}.route.ts`**: Định nghĩa đường dẫn Express Router và gắn middleware tương ứng.
- **`{module}.module.ts`**: Nơi khởi tạo instance, tiêm phụ thuộc (Dependency Injection) và export singleton Controller.

---

## 3. Chi Tiết Các Luồng Hoạt Động Cốt Lõi (Core Operational Flows)

Mục này mô tả chi tiết 6 luồng hoạt động chính của hệ thống VibeTune. Mỗi luồng được cấu trúc đồng bộ gồm: **Mục tiêu nghiệp vụ**, **Các thành phần tham gia**, **Sơ đồ tương tác (Mermaid Diagram)**, **Mô tả tuần tự chi tiết từng bước thực thi (Step-by-Step Breakdown)** và **Cơ chế kiểm soát lỗi & Ngoại lệ**.

---

### 3.1. Luồng 1: Khởi Tạo & Quản Lý Phiên Người Dùng (Authentication & Session Flow)

#### 🎯 Mục tiêu nghiệp vụ:

Đảm bảo an toàn danh tính, phân quyền chặt chẽ giữa người dùng ẩn danh (Guest) và người dùng đã xác thực (Authenticated User); đồng thời đồng bộ hóa phiên làm việc từ Frontend Next.js sang Backend Express thông qua JWT Token an toàn.

#### 👥 Các thành phần tham gia:

- **Client Browser**: Trình duyệt người dùng.
- **Next.js Root Server Component (`saas-platform/src/app/page.tsx`)**: Bộ lọc điều hướng ban đầu.
- **Clerk Identity Provider (Clerk Auth Service)**: Dịch vụ xác thực danh tính bên thứ ba.
- **Frontend Dashboard (`saas-platform/src/app/home/page.tsx`)**: Giao diện chính sau khi đăng nhập.
- **Backend Auth Middleware (`backend/src/app.ts` - `clerkMiddleware`)**: Bộ xác thực token trên API.

#### 📊 Sơ đồ tuần tự (Sequence Diagram):

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant Client as Frontend (Next.js)
    participant Clerk as Clerk Service (IdP)
    participant NextMW as Next.js Root Router (page.tsx)
    participant Backend as Express Backend
    participant ClerkMW as @clerk/express MW

    User->>Client: 1. Truy cập trang web (/)
    Client->>NextMW: 2. Gọi Server Component RootPage
    NextMW->>Clerk: 3. Kiểm tra Session Token trong cookie
    alt Chưa đăng nhập (Session = null)
        Clerk-->>NextMW: userId = null
        NextMW-->>Client: 4. Redirect 307 sang /landing-page
        User->>Client: 5. Bấm "Sign In" / "Sign Up"
        Client->>Clerk: 6. Thực hiện xác thực (Email, Google OAuth, Passkeys)
        Clerk-->>Client: 7. Thiết lập Cookie phiên & Trả về Token
        Client->>Client: 8. Chuyển hướng sang /home
    else Đã đăng nhập (Session hợp lệ)
        Clerk-->>NextMW: userId = "user_2xxxx"
        NextMW-->>Client: 4. Redirect 307 sang /home
    end

    Note over Client, Backend: Giai đoạn gọi API được bảo vệ (Private Endpoints)
    Client->>Clerk: 9. useAuth().getToken() lấy JWT Bearer Token
    Clerk-->>Client: 10. Trả về JWT Token
    Client->>Backend: 11. Gửi HTTP Request + Header [Authorization: Bearer <token>]
    Backend->>ClerkMW: 12. Giải mã và thẩm định chữ ký số JWT
    alt Token không hợp lệ / Hết hạn
        ClerkMW-->>Client: 13. Phản hồi 401 Unauthorized
    else Token hợp lệ
        ClerkMW->>Backend: 13. Gắn context người dùng: req.auth = { userId, ... }
        Backend->>Backend: 14. Tiếp tục thực thi Controller nghiệp vụ
    end
```

#### 📝 Mô tả tuần tự từng bước (Step-by-Step Breakdown):

- **Bước 1 (Yêu cầu khởi tạo trang)**: Người dùng nhập địa chỉ gốc (`/`) trên trình duyệt. Request đầu tiên được tiếp nhận tại Server Component `RootPage` (`saas-platform/src/app/page.tsx`).
- **Bước 2 (Kiểm tra phiên Server-side)**: `RootPage` gọi hàm `auth()` từ thư viện `@clerk/nextjs/server` để phân tích các cookie phiên được mã hóa (`__session`) gửi kèm trong HTTP request header.
- **Bước 3 (Phân nhánh điều hướng Gatekeeper)**:
  * *Trường hợp A (Chưa đăng nhập)*: Biến `userId` trả về giá trị `null` hoặc `undefined`. Next.js thực hiện lệnh `redirect('/landing-page')` ngay tại tầng máy chủ. Trình duyệt tải trang giới thiệu dịch vụ (Landing Page), giới thiệu các tính năng cốt lõi và cung cấp các nút bấm CTA ("Get Started", "Sign In").
  * *Trường hợp B (Đã đăng nhập)*: `userId` trả về chuỗi định danh người dùng (ví dụ: `user_2tX...`). Next.js thực hiện lệnh `redirect('/home')`, đưa thẳng người dùng vào Dashboard ứng dụng mà không cần render lại trang trung gian.
- **Bước 4 (Thực hiện Đăng nhập / Đăng ký)**: Khi người dùng tại Landing Page bấm "Sign In", ứng dụng chuyển sang route `/sign-in` (hoặc modal). Người dùng nhập thông tin xác thực qua Email/Mật khẩu hoặc các nhà cung cấp OAuth liên kết (Google, GitHub, Passkeys).
- **Bước 5 (Cấp phát Session & Token)**: Sau khi Clerk xác thực thành công, Clerk thiết lập cookie phiên bảo mật trên trình duyệt và trả về đối tượng `UserResource` cho Client Context. Frontend tự động điều hướng người dùng về `/home` căn cứ theo thiết lập `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`.
- **Bước 6 (Khởi tạo Bearer Token cho API)**: Khi trang Dashboard `/home` cần gọi các API riêng tư phía Backend (như tải ảnh quét vibe, lấy danh sách yêu thích, thêm/xóa bài hát), hook `useAuth().getToken()` được kích hoạt để tạo ra một chuỗi JSON Web Token (JWT) ngắn hạn. Chuỗi token này được gán vào HTTP Header: `Authorization: Bearer <JWT_TOKEN>`.
- **Bước 7 (Backend thẩm định chữ ký số)**: Yêu cầu đi vào Backend Express thông qua middleware toàn cục `clerkMiddleware()` (`backend/src/app.ts`). Middleware kiểm tra tính toàn vẹn của token bằng cách đối chiếu chữ ký với Public Key của Clerk Network.
- **Bước 8 (Thiết lập Auth Context)**: Nếu JWT hợp lệ, middleware trích xuất payload và gắn đối tượng xác thực vào request: `req.auth = { userId: "user_...", sessionId: "sess_..." }`. Controller nghiệp vụ tiếp tục thực thi.

#### 🛡️ Kiểm soát lỗi & Ngoại lệ (Error Handling):

- Nếu Token thiếu hoặc không đúng định dạng trên các endpoint yêu cầu xác thực (`/api/vibe-scan`, `/api/profile/*`), Controller chủ động trả về HTTP `401 Unauthorized` kèm thông báo `{ "error": "Unauthorized" }`.
- Nếu Token hết hạn giữa phiên làm việc, SDK Clerk trên Frontend tự động refresh token ngầm trước khi thực hiện cuộc gọi API tiếp theo.

---

### 3.2. Luồng 2: Gợi Ý Âm Nhạc Theo Thời Tiết & Ngữ Cảnh Thời Gian (Today's Vibe Flow)

#### 🎯 Mục tiêu nghiệp vụ:

Tự động phát hiện bối cảnh môi trường thực tế của người dùng (tọa độ địa lý, nhiệt độ, kiểu thời tiết, khung giờ sinh hoạt) và chuyển đổi thành danh sách bài hát phù hợp tức thời mà không yêu cầu người dùng phải tự tìm kiếm.

#### 👥 Các thành phần tham gia:

- **Frontend Dashboard (`/home`)**: Giao diện hiển thị widget thời tiết, dynamic background và playlist.
- **`WeatherTimeController` (`backend/src/modules/weather-time/`)**: Tiếp nhận request và điều phối.
- **`WeatherService`**: Phân giải IP, định vị địa lý và truy vấn dữ liệu khí tượng.
- **`WeatherGenreService`**: Động cơ suy diễn âm nhạc (Rule-based Inference Engine) ánh xạ thời tiết sang thể loại và tâm trạng.
- **`SongSearchService` & `ITunesSearchService`**: Tìm kiếm bài hát theo từ khóa và xếp hạng đa vùng.
- **Upstash Redis**: Bộ nhớ tạm lưu trữ kết quả ngữ cảnh (Context Caching).
- **External Services**: Open-Meteo API / WeatherAPI, `ipinfo.io`, Apple iTunes Search API.

#### 📊 Sơ đồ tuần tự (Sequence Diagram):

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant Client as Frontend (/home)
    participant Controller as WeatherTimeController
    participant WService as WeatherService
    participant WGService as WeatherGenreService
    participant Geo as ipinfo.io / Geo Headers
    participant WeatherAPI as Open-Meteo / WeatherAPI
    participant SongSearch as ITunesSearchService
    participant Redis as Upstash Redis
    participant ITunes as Apple iTunes API

    User->>Client: 1. Mở trang Dashboard /home
    Client->>Client: 2. Lấy Timezone trình duyệt (Intl.DateTimeFormat)
    Client->>Controller: 3. GET /api/weather-time/today-vibe?tz=Asia/Ho_Chi_Minh
  
    Controller->>Controller: 4. Phân giải IP & Country từ Headers (CF, X-Forwarded, Accept-Language)
    Controller->>WService: 5. getCurrentWeather(serviceOptions, clientCountryCode)
  
    WService->>Geo: 6. Tra cứu tọa độ Lat/Lon từ IP (hoặc fallback theo Timezone/Country)
    Geo-->>WService: 7. Trả về Lat, Lon, CountryCode (ví dụ: 21.02, 105.85, VN)
  
    WService->>WeatherAPI: 8. GET thời tiết theo tọa độ (Temp, WeatherCode, Humidity, Condition)
    WeatherAPI-->>WService: 9. Trả về dữ liệu khí tượng thời gian thực
    WService-->>Controller: 10. Trả về đối tượng WeatherData hoàn chỉnh
  
    Controller->>Controller: 11. Trích xuất giờ địa phương & phân loại Session (morning/afternoon/evening/night)
    Controller->>WGService: 12. matchGenreToWeather(temp, weatherCode, humidity, condition, hour)
    Note over WGService: Phân tích 4 chiều:<br/>- Khung giờ: Thể loại nền<br/>- Nhiệt độ: Năng lượng âm nhạc<br/>- Mã WMO: Sắc thái tâm trạng<br/>- Độ ẩm: Độ sâu không gian
    WGService-->>Controller: 13. Trả về WeatherGenreMatch (genres, keywords, mood, reasoning)
  
    Controller->>SongSearch: 14. searchByKeywords(topKeywords, limit=75, country=VN)
  
    SongSearch->>Redis: 15. Kiểm tra Cache theo khóa context:{weather}:{session}
    alt Cache Hit (Đã có dữ liệu trong 30 phút qua)
        Redis-->>SongSearch: 16. Trả về danh sách bài hát đã cache
    else Cache Miss (Chưa có cache hoặc cache hết hạn)
        SongSearch->>SongSearch: 17. Tạo Query Variants & Tìm kiếm theo thứ tự Storefront (VN -> US)
        SongSearch->>ITunes: 18. Truy vấn iTunes Search API
        ITunes-->>SongSearch: 19. Trả về kết quả bài hát từ Apple Catalog
        SongSearch->>SongSearch: 20. Chấm điểm độ tương quan, Khử trùng lặp, Xếp hạng
        SongSearch->>Redis: 21. Ghi Cache với TTL 30 phút (context:...) và 6 giờ (search:...)
    end
  
    SongSearch-->>Controller: 22. Trả về mảng Song[] đã xếp hạng
    Controller-->>Client: 23. 200 OK: { weather, songs, genres, mood, reasoning, session }
    Client->>Client: 24. Cập nhật Dynamic Background, đồng hồ, widget thời tiết và nạp bài vào playlist
```

#### 📝 Mô tả tuần tự từng bước (Step-by-Step Breakdown):

- **Bước 1 (Khởi tạo Dashboard & Đọc Timezone)**: Khi Dashboard `/home` tải trên trình duyệt, hook `useEffect` lấy múi giờ thực tế của người dùng thông qua JavaScript API: `Intl.DateTimeFormat().resolvedOptions().timeZone` (ví dụ: `"Asia/Ho_Chi_Minh"`, `"America/New_York"`).
- **Bước 2 (Gửi yêu cầu ngữ cảnh)**: Client gọi API `GET /api/weather-time/today-vibe?tz=...` kèm theo múi giờ.
- **Bước 3 (Bóc tách Header phân giải Địa lý)**: `WeatherTimeController` tiếp nhận request, sử dụng tiện ích `resolveCountryCodeFromRequest` để kiểm tra danh sách header ưu tiên:
  1. `cf-ipcountry` (từ Cloudflare CDN).
  2. `x-vercel-ip-country` (từ Vercel Edge).
  3. `cloudfront-viewer-country` (từ AWS CloudFront).
  4. Header `Accept-Language` (bóc tách mã vùng từ ngôn ngữ trình duyệt, ví dụ: `vi-VN` $\to$ `VN`).
     Đồng thời, hàm trích xuất địa chỉ IP công khai của Client qua `x-forwarded-for` hoặc `x-real-ip`, loại bỏ tiền tố IPv6 (`::ffff:`) và bỏ qua các dải IP nội bộ (`127.0.0.1`, `::1`).
- **Bước 4 (Phân giải tọa độ địa lý qua IP)**: `WeatherService.getLocationFromIP` thực hiện tra cứu:
  * Nếu có IP hợp lệ: Gọi dịch vụ `ipinfo.io` lấy tọa độ vĩ độ (`lat`), kinh độ (`lon`), quốc gia (`country`), mã quốc gia (`countryCode`).
  * Nếu IP nội bộ hoặc tra cứu thất bại: Dịch vụ tự động fallback tra cứu tọa độ trung tâm (Centroid) theo mã quốc gia hoặc theo múi giờ đã gửi lên.
- **Bước 5 (Truy vấn dữ liệu thời tiết thời gian thực)**: `WeatherService.getWeatherForLocation` kết nối tới nhà cung cấp thời tiết (`Open-Meteo` hoặc `WeatherAPI`) để lấy các chỉ số khí tượng tại tọa độ xác định: nhiệt độ thực tế (`temperature`), mã thời tiết chuẩn WMO (`weatherCode`), độ ẩm (`humidity`), tốc độ gió (`windSpeed`) và chuỗi thời gian địa phương (`currentTime`).
- **Bước 6 (Xác định phiên trong ngày - Session Determination)**: Dịch vụ tách giờ từ `currentTime` (`hour`) và phân chia phiên sinh hoạt:
  * $05\text{h} - 12\text{h}$: `morning` (Buổi sáng).
  * $12\text{h} - 18\text{h}$: `afternoon` (Buổi chiều).
  * $18\text{h} - 21\text{h}$: `evening` (Buổi tối).
  * $21\text{h} - 05\text{h}$: `night` (Đêm khuya).
- **Bước 7 (Suy diễn Âm nhạc & Tâm trạng - Music Inference Engine)**: `WeatherGenreService.matchGenreToWeather` thực hiện ma trận phân tích đa chiều:
  * *Phân tích khung giờ (`analyzeTimeOfDay`)*: Đưa ra thể loại và từ khóa nền (ví dụ: buổi sáng $\to$ `acoustic, lo-fi, gentle morning`; đêm khuya $\to$ `ambient, chillwave, nocturnal`).
  * *Phân tích nhiệt độ (`analyzeTemperature`)*: Điều chỉnh năng lượng bài hát (lạnh $\to$ sâu lắng, ấm/nóng $\to$ sôi động, tiết tấu nhanh).
  * *Phân tích mã WMO (`analyzeWeatherCondition`)*: Xác định Mood và Thể loại đặc trưng (mưa $\to$ `cozy melancholic`, jazz, rainy beats; nắng rực rỡ $\to$ `bright energetic`, pop, dance).
  * *Tổng hợp ngữ cảnh (`composeContextKeywords`)*: Ghép nối các từ khóa thành chuỗi mô tả hoàn chỉnh và sinh câu diễn giải tự nhiên (`reasoning`).
- **Bước 8 (Kiểm tra Cache Ngữ cảnh - Tầng 1 Context-Level Cache)**: `SongSearchService` kiểm tra khóa Cache đại diện duy nhất cho toàn bộ bối cảnh: `context:{weather}:{session}` (ví dụ: `context:rain showers:evening`):
  * *Trường hợp 1 (Cache Hit - Đã có dữ liệu trong 30 phút qua)*: Lấy nguyên gói danh sách bài hát (75 bài) đã được xếp hạng hoàn chỉnh từ Redis ra trả về ngay lập tức trong 5ms. **Toàn bộ quá trình dừng tại đây**, hệ thống **HOÀN TOÀN KHÔNG CẦN** tính toán hay đụng đến Top-16 từ khóa, không gọi iTunes API, tiết kiệm 100% tài nguyên CPU và Network.
  * *Trường hợp 2 (Cache Miss - Chưa có cache hoặc cache đã hết hạn)*: Hệ thống mới bắt đầu kích hoạt chuyển giao dữ liệu sang Bước 9.
- **Bước 9 (Kích hoạt Top-16 Từ Khóa & Truy vấn Cache Bài Hát - Tầng 2 Song-Level Cache)**:
  * Khi Tầng 1 bị Miss, hệ thống lấy **Top-16 từ khóa** dẫn đầu từ mảng `weatherGenreMatch.keywords` (bao gồm các từ đơn và các cụm từ ghép chéo ngữ cảnh).
  * Hàm `buildQueryVariants(topKeywords)` bóc tách và sinh ra tối đa **14 biến thể truy vấn** (`queries`).
  * Với mỗi biến thể truy vấn tại mỗi Storefront quốc gia (`country`), hệ thống kiểm tra **Tầng Cache thứ 2**: `search:{query}:{limit}:{country}` (ví dụ: `search:rain showers evening:50:VN`, `search:lo-fi:50:VN`).
  * Nếu biến thể nào đã có trong Tầng 2 (TTL 6 giờ) $\to$ Lấy từ Redis. Biến thể nào chưa có $\to$ Gọi HTTP GET tới Apple iTunes Search API.
  * Toàn bộ bài hát thu thập được đưa vào thuật toán chấm điểm `calculateSongScore`, khử trùng lặp và sắp xếp theo độ tương thích.
- **Bước 10 (Ghi ngược vào Cache & Hoàn tất Phản hồi)**:
  * Kết quả Playlist hoàn chỉnh gồm 75 bài hát được **lưu ngược lại vào Tầng 1** `context:{weather}:{session}` với TTL 30 phút (để phục vụ ngay cho những người dùng tiếp theo).
  * Các bài hát mới tìm từ Apple cũng được lưu vào **Tầng 2** `search:{query}:{limit}:{country}` với TTL 6 giờ.
  * Controller đóng gói JSON gồm thông tin thời tiết, session, mood, reasoning và danh sách `Song[]` trả về client với mã `200 OK`.
- **Bước 11 (Cập nhật giao diện động tại Client)**:
  * Hàm `getWeatherAssets` kích hoạt, tự động chuyển đổi hình nền động của Dashboard tương ứng với thời tiết (mưa rơi `rainy.jfif`, mây trôi `cloudy.png`, nắng ấm `sunny.png`...).
  * Widget thời tiết hiển thị nhiệt độ, độ ẩm, biểu tượng trạng thái và đoạn văn giải thích `reasoning`.
  * Danh sách bài hát được đưa vào hàng đợi phát nhạc của Dashboard.

#### 🛡️ Kiểm soát lỗi & Ngoại lệ (Error Handling):

- Nếu API thời tiết bên ngoài gặp sự cố hoặc timeout, hệ thống tự động fallback về cấu hình thời tiết mặc định theo giờ hệ thống (ví dụ: mặc định trời quang nhẹ, nhiệt độ 22°C) để đảm bảo trải nghiệm nghe nhạc của người dùng không bao giờ bị gián đoạn.
- Nếu Redis không khả dụng, hệ thống ghi log cảnh báo và truy vấn trực tiếp từ iTunes mà không làm crash ứng dụng.

---

### 3.3. Luồng 3: Quét Vibe Bằng Hình Ảnh AI (AI Vision Vibe Scan Flow)

#### 🎯 Mục tiêu nghiệp vụ:

Cho phép người dùng tải lên một bức ảnh bất kỳ (phong cảnh, trang phục, tác phẩm nghệ thuật, selfie...), hệ thống sử dụng mạng nơ-ron thị giác máy tính để phân tích thẩm mỹ, ánh sáng, màu sắc và cảm xúc của bức ảnh, từ đó tạo ra một danh sách bài hát mang đúng "vibe" tương ứng.

#### 👥 Các thành phần tham gia:

- **Frontend Uploader (`saas-platform/src/app/home/page.tsx`)**: Vùng kéo thả, chọn ảnh và thanh hiển thị tiến trình quét.
- **Client Image Compressor (`image-compressor.ts`)**: Nén ảnh trên trình duyệt bằng Canvas API.
- **`VibeScannerController` & `Multer` (`backend/src/modules/vibe-scan/`)**: Nhận file multipart và kiểm tra hợp lệ.
- **`CLIPService`**: HTTP Client giao tiếp giữa Backend Express và AI Microservice.
- **`AI_CLIP` Microservice (`AI_CLIP/main.py`)**: Ứng dụng Python FastAPI chứa mô hình AI.
- **Mô hình ONNX CLIP Vision**: Mô hình học sâu OpenAI CLIP ViT-B/32 định dạng ONNX Runtime.
- **Ma trận Nhúng Vector (`vibe_embeddings.npy`, `vibe_keywords.npy`)**: Cơ sở dữ liệu vector từ khóa tâm trạng.
- **`SongSearchService` & Apple iTunes API**: Tìm kiếm bài hát dựa trên từ khóa do AI trích xuất.

#### 📊 Sơ đồ tuần tự (Sequence Diagram):

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant Client as Frontend (Vibe Scanner)
    participant Compressor as Browser Image Compressor
    participant Backend as Express Vibe Controller
    participant Multer as Multer MemoryStorage
    participant AIService as Python FastAPI (AI_CLIP)
    participant ONNX as ONNX Runtime Engine
    participant ITunesService as ITunesSearchService
    participant ITunes as Apple iTunes API

    User->>Client: 1. Kéo thả hoặc chọn file ảnh (JPG, PNG, WebP)
    Client->>Compressor: 2. Gọi compressImage(file, maxSize=500KB)
    Compressor-->>Client: 3. Trả về Compressed File Blob
    Client->>Client: 4. Đọc FileReader tạo preview & Khởi chạy Progress Animation (0% -> 90%)
  
    Client->>Backend: 5. POST /api/vibe-scan (multipart/form-data) + Header [Authorization: Bearer <token>]
    Backend->>Multer: 6. Tiếp nhận Stream và lưu trữ vào req.file.buffer trong RAM
    Backend->>Backend: 7. Thẩm định MIME type (jpeg/png/webp) & Kích thước (<= 10MB)
  
    Backend->>AIService: 8. POST http://localhost:8000/extract-vibes (FormData chứa file Buffer)
  
    AIService->>AIService: 9. Đọc binary qua Pillow Image.open(), chuyển hệ màu RGB
    AIService->>AIService: 10. Preprocess qua CLIPProcessor -> Tensor pixel_values (1, 3, 224, 224)
    AIService->>ONNX: 11. session.run(pixel_values) trên CPU Execution Provider
    ONNX-->>AIService: 12. Trả về Image Vector Embedding thô (1 x 512)
  
    AIService->>AIService: 13. Chuẩn hóa L2-Norm: v_norm = v / ||v||
    AIService->>AIService: 14. Tính Cosine Similarity: S = v_norm * Text_Matrix^T (1 x N)
    AIService->>AIService: 15. Sắp xếp điểm số giảm dần, trích xuất Top 10 Keywords & Scores
    AIService-->>Backend: 16. 200 OK: { top_keywords: [{ keyword, score }, ...] }
  
    Backend->>Backend: 17. Lọc lấy Top 8 từ khóa có điểm số cao nhất
    Backend->>ITunesService: 18. searchByKeywords(topKeywords, limit=20, country)
  
    ITunesService->>ITunes: 19. Truy vấn iTunes Search API cho các biến thể từ khóa
    ITunes-->>ITunesService: 20. Trả về danh sách bài hát thô
    ITunesService->>ITunesService: 21. Chấm điểm tương thích, Khử trùng lặp, Xếp hạng
    ITunesService-->>Backend: 22. Trả về danh sách Song[] hoàn chỉnh
  
    Backend-->>Client: 23. 200 OK: { success: true, songs: [...] }
    Client->>Client: 24. Đặt Progress = 100%, tắt Loading, Render Playlist kết quả
```

#### 📝 Mô tả tuần tự từng bước (Step-by-Step Breakdown):

- **Bước 1 (Chọn ảnh & Kích hoạt giao diện)**: Người dùng chọn một bức ảnh từ máy tính hoặc kéo thả vào khung uploader.
- **Bước 2 (Nén ảnh phía Client - Client-side Compression)**: Để tối ưu băng thông mạng và tránh nghẽn bộ nhớ backend, hàm `compressImage(file, 500)` trong file `saas-platform/src/lib/utils/image-compressor.ts` đọc file ảnh vào phần tử HTML Canvas, giảm kích thước ảnh sao cho dung lượng sau nén không vượt quá 500KB.
- **Bước 3 (Giả lập tiến trình phản hồi mượt mà)**: Client sử dụng `FileReader` để đọc ảnh sang Base64 DataURL hiển thị ảnh xem trước (preview). Đồng thời, một bộ đếm thời gian (`setInterval` 40ms) tăng dần thanh tiến trình quét từ 0% đến mức tối đa 90% để người dùng thấy hệ thống đang tích cực xử lý.
- **Bước 4 (Đóng gói và gửi Multipart Request)**: File nén được đính vào đối tượng `FormData` với trường `file`. Client lấy Clerk JWT Token và gửi HTTP POST tới endpoint `/api/vibe-scan`.
- **Bước 5 (Tiếp nhận & Thẩm định tại Backend)**:
  * Middleware `Multer` (cấu hình `memoryStorage`) hứng luồng nhị phân và lưu vào `req.file.buffer`.
  * `VibeScannerController` kiểm tra:
    1. Kiểm tra xác thực `req.auth.userId` (trả về 401 nếu thiếu).
    2. Kiểm tra sự tồn tại của file (trả về 400 nếu không có file).
    3. Kiểm tra định dạng `mimetype` (chỉ chấp nhận `image/jpeg`, `image/png`, `image/webp`).
    4. Kiểm tra kích thước file (tối đa 10MB).
- **Bước 6 (Chuyển tiếp sang Microservice AI)**: `VibeScannerService` đóng gói buffer ảnh vào `FormData` của Node.js, gọi POST tới Python FastAPI microservice tại đường dẫn `${CLIP_URL}/extract-vibes` với thời gian chờ tối đa (timeout) là 30 giây.
- **Bước 7 (Tiền xử lý hình ảnh tại Python FastAPI)**:
  * Hàm `extract` trong `AI_CLIP/main.py` đọc chuỗi byte từ `UploadFile`.
  * Thư viện Pillow chuyển đổi dữ liệu thành đối tượng ảnh RGB (`Image.open(io.BytesIO(contents)).convert("RGB")`).
  * `CLIPProcessor` (từ HuggingFace Transformers) thực hiện chuẩn hóa độ sáng, độ tương phản và thay đổi kích thước ảnh về chuẩn $224 \times 224$ pixels, xuất ra mảng NumPy tensor `pixel_values` kích thước $(1, 3, 224, 224)$.
- **Bước 8 (Thực thi mô hình ONNX Runtime)**:
  * Mảng tensor được đưa vào phiên suy luận `onnxruntime.InferenceSession` chạy mô hình `clip_vision_512.onnx`.
  * Mô hình được tối ưu chạy trên `CPUExecutionProvider` với cấu hình đơn luồng (`intra_op_num_threads = 1`, `inter_op_num_threads = 1`) và tắt bộ nhớ đệm mem-arena nhằm giữ mức tiêu thụ RAM ổn định dưới 300MB trên môi trường cloud miễn phí.
  * Đầu ra là vector nhúng hình ảnh `image_embeddings` với 512 chiều biểu diễn đặc trưng thị giác cấp cao.
- **Bước 9 (Tính toán Độ tương đồng Vector Cosine)**:
  * Vector ảnh được chuẩn hóa L2:
    $$
    \vec{v}_{\text{norm}} = \frac{\vec{v}}{\|\vec{v}\|_2}
    $$
  * Tính tích vô hướng giữa vector ảnh đã chuẩn hóa và ma trận nhúng văn bản đã tải sẵn trong RAM `text_matrix` ($N \times 512$):
    $$
    \vec{S} = \vec{v}_{\text{norm}} \cdot \mathbf{M}_{\text{text}}^T
    $$
  * Mỗi phần tử $S_i$ chính là chỉ số tương quan Cosine giữa bức ảnh và từ khóa tâm trạng thứ $i$.
  * Hàm `np.argsort(-scores[0])[:10]` trích xuất 10 vị trí có điểm số cao nhất, ghép với nhãn từ khóa trong mảng `keywords` để tạo danh sách `top_keywords` (ví dụ: `[{"keyword": "cyberpunk neon", "score": 0.32}, ...]`).
- **Bước 10 (Ánh xạ sang Kho nhạc iTunes & Tái sử dụng Cache Tầng 2)**:
  * Backend nhận kết quả Top 10 từ khóa, lấy ra 8 từ khóa dẫn đầu.
  * Gọi `SongSearchService.searchByKeywords(topKeywords, limit=20, country)` để tìm kiếm bài hát.
  * **Tại đây CÓ SỬ DỤNG REDIS CACHE (Tầng 2 - Song-Level Cache)**: Hệ thống sinh ra các biến thể truy vấn từ 8 từ khóa này và kiểm tra trước trong Redis theo khóa `search:{query}:{limit}:{country}` (TTL 6 giờ). Nếu các từ khóa thẩm mỹ do AI sinh ra (như `"cyberpunk"`, `"neon"`, `"golden hour"`) đã từng được tìm kiếm trước đó bởi người dùng khác, danh sách bài hát sẽ được **lấy thẳng từ Redis trong 5ms mà không cần gọi Apple iTunes API**.
  * Các bài hát thu thập được đưa vào thuật toán xếp hạng `calculateSongScore`, khử bài trùng và trả về danh sách 20 bài hát xuất sắc nhất.
- **Bước 11 (Cập nhật giao diện hoàn tất)**:
  * Backend phản hồi HTTP `200 OK` kèm danh sách `Song[]`.
  * Client xóa timer giả lập, lập tức đặt tiến trình `scanProgress = 100%`, tắt trạng thái quay loading và hiển thị các thẻ bài hát kết quả kèm ảnh bìa album, tên ca sĩ và nút phát thử nhạc.

#### 🛡️ Kiểm soát lỗi & Ngoại lệ (Error Handling):

- Nếu định dạng ảnh không hợp lệ hoặc file bị lỗi hỏng (corrupted), FastAPI trả về `400 Invalid image`, backend chuyển tiếp mã lỗi `400` cho client hiển thị thông báo lỗi thân thiện ("Invalid file type").
- Nếu AI Microservice bị sập hoặc quá tải (502 Bad Gateway), backend bắt lỗi Axios và trả về thông báo "Failed to extract vibes. AI service temporarily unavailable", giao diện client hủy loading và cho phép người dùng thử lại ảnh khác.

---

### 3.4. Luồng 4: Tìm Kiếm Bài Hát & Cơ Chế Xếp Hạng Đa Vùng (Song Search & Multi-Region Ranking)

#### 🎯 Mục tiêu nghiệp vụ:

Xử lý các truy vấn tìm kiếm âm nhạc (từ ô tìm kiếm của người dùng hoặc từ khóa do AI/Thời tiết sinh ra), khắc phục rào cản bản quyền khu vực (Geographic Licensing Restrictions) trên Apple Catalog và áp dụng thuật toán chấm điểm để đưa các bài hát phù hợp nhất lên đầu.

#### 👥 Các thành phần tham gia:

- **`SongController` & `ITunesSearchService` (`backend/src/modules/song/`)**: Lõi xử lý nghiệp vụ tìm kiếm.
- **`CacheService` & Upstash Redis**: Lưu trữ tạm các kết quả truy vấn.
- **Apple iTunes Search API**: Nguồn cung cấp metadata âm nhạc toàn cầu.

#### 📊 Sơ đồ luồng xử lý (Flowchart):

```mermaid
flowchart TD
    Start(["Nhận yêu cầu: Keywords, Limit, Preferred Country"]) --> Norm["1. Chuẩn hóa Keywords & Quốc gia:<br/>- Chuyển chữ thường, bỏ khoảng trắng<br/>- Kiểm tra định dạng mã ISO (VN, US...)"]
    Norm --> GenVariants["2. Sinh Biến Thể Truy Vấn (buildQueryVariants):<br/>- Ghép cặp từ khóa liền kề (Pairs)<br/>- Các từ khóa đơn lẻ hàng đầu<br/>- Ghép hậu tố phong cách ('chill', 'vibe', 'music')"]
    GenVariants --> CountryOrder["3. Thiết Lập Thứ Tự Storefront (buildCountrySearchOrder):<br/>- Ưu tiên 1: Preferred Country (VN)<br/>- Ưu tiên 2: Quốc gia khu vực tương đồng (JP, KR, SG...)<br/>- Ưu tiên 3: Kho nhạc toàn cầu (US)"]
  
    CountryOrder --> LoopQueries["4. Duyệt qua từng Quốc gia & từng Biến thể Truy vấn"]
  
    subgraph FetchWithCache ["Thu thập ứng viên (Fetch & Cache)"]
        CheckCache{"5. Kiểm tra Cache Redis<br/>Key: search:{query}:{limit}:{country}"}
        CheckCache -- Hit --> UseCached["Lấy danh sách bài hát từ Redis"]
        CheckCache -- Miss --> CallITunes["Gọi iTunes Search API (timeout 10s)"]
        CallITunes --> SaveCache["Ghi kết quả vào Redis (TTL = 6 giờ)"]
        SaveCache --> Collect["Đưa bài hát vào danh mục Ứng viên (Candidates)"]
        UseCached --> Collect
    end
  
    LoopQueries --> FetchWithCache
    Collect --> ScoreCalc["6. Thuật toán Chấm Điểm (calculateSongScore):<br/>- Khớp từ khóa trong Tiêu đề: +30 điểm<br/>- Khớp từ khóa trong Tên Nghệ sĩ: +25 điểm<br/>- Khớp từ khóa trong Tên Album: +15 điểm<br/>- Bản quyền thuộc Quốc gia ưu tiên: +20 điểm<br/>- Khớp chính xác Query Variant: +10 điểm"]
  
    ScoreCalc --> Deduplicate["7. Khử Trùng Lặp (Deduplication):<br/>- Composite Key: lower(artist)|lower(title)<br/>- So sánh: Giữ lại bản ghi có Score cao nhất"]
    Deduplicate --> SortRank["8. Sắp xếp danh sách ứng viên giảm dần theo Score"]
    SortRank --> SliceLimit["9. Cắt danh sách lấy đúng số lượng theo yêu cầu (Limit)"]
    SliceLimit --> ReturnResult(["10. Đóng gói và trả về SearchResult"])
```

#### 📝 Mô tả tuần tự từng bước (Step-by-Step Breakdown):

1. **Bước 1 (Chuẩn hóa đầu vào)**: Dịch vụ tiếp nhận mảng từ khóa `keywords`, số lượng giới hạn `limit` (mặc định 10 đến 75 bài) và mã quốc gia ưu tiên `country` (mặc định `"US"`). Hàm `normalizeKeywords` lọc bỏ các từ rỗng, chuyển chữ thường và loại bỏ các ký tự đặc biệt gây lỗi truy vấn.
1. **Bước 2 (Sinh biến thể truy vấn - Query Expansion)**: Một từ khóa đơn lẻ thường cho kết quả tìm kiếm hạn hẹp. Hàm `buildQueryVariants` tự động sinh ra tập hợp biến thể phong phú:
   * Kết hợp các cặp từ khóa đi kèm với nhau (ví dụ: `["rainy", "coffee", "morning"]` $\to$ `"rainy coffee"`, `"coffee morning"`).
   * Các từ khóa đơn lẻ có trọng số cao nhất.
   * Bổ sung các hậu tố chuyên biệt về âm nhạc (ví dụ: `"rainy music"`, `"coffee vibe"`).
     Số lượng truy vấn đồng thời được giới hạn tối đa 14 biến thể để không làm nghẽn mạng.
1. **Bước 3 (Xây dựng thứ tự quốc gia tìm kiếm - Multi-Region Search Order)**: Nhiều bài hát bị hạn chế bản quyền tại một số quốc gia (ví dụ: bài hát V-Pop chỉ có trên Storefront Việt Nam, một số bài US-UK chỉ có trên Storefront Mỹ). Hàm `buildCountrySearchOrder` sắp xếp danh sách tìm kiếm:
   1. Quốc gia người dùng đang sinh sống (`preferredCountry`, ví dụ: `VN`).
   2. Các thị trường âm nhạc lân cận cùng khu vực văn hóa.
   3. Thị trường lớn nhất (`US`) làm chốt chặn bảo đảm luôn có kết quả.
1. **Bước 4 (Thu thập ứng viên với Redis Cache-First)**:
   * Ứng dụng duyệt qua từng cặp `(query, country)`.
   * Tạo khóa cache: `search:{query_lowercase}:{limit}:{country_uppercase}`.
   * Kiểm tra Redis qua `cacheService.getCachedSongSearch(cacheKey)`. Nếu có dữ liệu trong cache, tái sử dụng ngay lập tức mà không cần gọi ra ngoài.
   * Nếu chưa có cache, dịch vụ gửi HTTP GET tới `https://itunes.apple.com/search` với các tham số: `term`, `media=music`, `entity=song`, `limit=50`, `country`. Sau khi nhận kết quả từ Apple, lưu ngược lại vào Redis với thời gian sống (TTL) là 6 giờ.
1. **Bước 5 (Thuật toán Chấm Điểm Độ Tương Thích - Song Scoring Algorithm)**: Với mỗi bài hát thu thập được, hàm `calculateSongScore` tính toán điểm số phù hợp dựa trên quy tắc trọng số:
   * Nếu bất kỳ từ khóa nào xuất hiện trong tên bài hát (`trackName`): $+30$ điểm.
   * Nếu bất kỳ từ khóa nào xuất hiện trong tên nghệ sĩ (`artistName`): $+25$ điểm.
   * Nếu bất kỳ từ khóa nào xuất hiện trong tên album (`collectionName`): $+15$ điểm.
   * Nếu bài hát đến từ chính Storefront của quốc gia người dùng (`preferredCountry`): $+20$ điểm (ưu tiên âm nhạc nội địa).
   * Nếu bài hát khớp chính xác với cụm từ truy vấn: $+10$ điểm.
1. **Bước 6 (Khử trùng lặp thông minh - Deduplication)**: Khi tìm kiếm qua nhiều storefront quốc gia và nhiều từ khóa biến thể, một bài hát có thể bị trả về nhiều lần. Dịch vụ sử dụng một bảng băm `Map<string, SearchCandidate>` với khóa định danh duy nhất:
   $$
   \text{Key} = \text{lower(artistName)} \,|\, \text{lower(trackName)}
   $$

   Nếu phát hiện bài hát đã tồn tại trong Map, hệ thống chỉ giữ lại bản ghi có điểm số (`score`) cao hơn và loại bỏ bản ghi thấp hơn.
1. **Bước 7 (Xắp xếp và phân trang)**: Chuyển toàn bộ ứng viên trong Map thành mảng, sắp xếp giảm dần theo `score`, sau đó cắt mảng theo số lượng `limit` yêu cầu và trả về kết quả cuối cùng.

#### 🛡️ Kiểm soát lỗi & Ngoại lệ (Error Handling):

- Nếu một truy vấn iTunes cụ thể bị lỗi (ví dụ: lỗi mạng hoặc iTunes trả về 403/500 đối với một quốc gia nhất định), dịch vụ bọc lệnh gọi trong khối `try/catch`, ghi log cảnh báo và tiếp tục chạy các truy vấn tiếp theo mà không làm gián đoạn toàn bộ luồng tìm kiếm.
- Nếu toàn bộ các truy vấn đều thất bại (mạng mất kết nối hoàn toàn), hệ thống sẽ đọc từ `fallback:default` trong Redis (danh sách bài hát dự phòng được cache 24 giờ) để trả về cho người dùng.

---

### 3.5. Luồng 5: Quản Lý Bài Hát Yêu Thích & Trải Nghiệm Optimistic UI (Favorites Flow)

#### 🎯 Mục tiêu nghiệp vụ:

Cho phép người dùng lưu trữ, gỡ bỏ hoặc kiểm tra trạng thái yêu thích của các bài hát vào thư viện cá nhân với phản hồi giao diện tức thì (Zero-Latency Feel) bằng kỹ thuật Optimistic UI, đồng thời bảo đảm tính toàn vẹn và nhất quán của dữ liệu trên cơ sở dữ liệu PostgreSQL.

#### 👥 Các thành phần tham gia:

- **Giao diện Dashboard (`saas-platform/src/app/home/page.tsx`)**: Component hiển thị nút Heart và danh sách Favorites.
- **React Local State (`favorites`, `favoritedSongIds`)**: Lưu trữ trạng thái giao diện tức thời.
- **`ProfileController` (`backend/src/modules/profile/`)**: Tiếp nhận các yêu cầu REST API cho favorites.
- **`FavoritesService` & `FavoritesRepository` (Knex.js)**: Thực thi logic nghiệp vụ và truy vấn cơ sở dữ liệu.
- **PostgreSQL Database**: Bảng `favorites` lưu trữ dữ liệu bền vững.

#### 📊 Sơ đồ tuần tự (Sequence Diagram):

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant UI as Giao diện Dashboard (React)
    participant State as Local State (favorites, favoritedSongIds)
    participant API as Axios HTTP Client
    participant Controller as ProfileController
    participant Repo as FavoritesRepository (Knex)
    participant DB as PostgreSQL Database

    User->>UI: 1. Bấm vào icon Heart trên thẻ bài hát
  
    Note over UI, State: GIAI ĐOẠN 1: CẬP NHẬT GIAO DIỆN TỨC THÌ (Optimistic UI - 0ms)
    alt Đang yêu thích -> Bỏ yêu thích
        UI->>State: 2a. Xóa song.id khỏi Set favoritedSongIds
        UI->>State: 2b. Lọc bỏ bài hát khỏi mảng favorites
        State-->>UI: 2c. Icon Heart chuyển sang dạng Outline (Xám) ngay lập tức
    else Chưa yêu thích -> Thêm yêu thích
        UI->>State: 2a. Thêm song.id vào Set favoritedSongIds
        UI->>State: 2b. Đẩy đối tượng Song vào mảng favorites
        State-->>UI: 2c. Icon Heart chuyển sang dạng Filled (Đỏ rực) ngay lập tức
    end

    Note over UI, DB: GIAI ĐOẠN 2: ĐỒNG BỘ DỮ LIỆU NGẦM PHÍA SAU (Background Sync)
    UI->>API: 3. Lấy Clerk JWT Bearer Token & Khởi tạo Request
    alt Thao tác Thêm Yêu Thích
        API->>Controller: 4. POST /api/profile/favorites (Body: DTO bài hát)
        Controller->>Controller: 5. Xác thực req.auth.userId & Kiểm tra dữ liệu bắt buộc (title, artist, artwork...)
        Controller->>Repo: 6. addFavorite(userId, favoriteDTO)
        Repo->>DB: 7. SELECT * FROM favorites WHERE user_id = :userId AND song_id = :songId
        alt Bản ghi đã tồn tại nhưng is_deleted = true (Đã từng xóa trước đây)
            Repo->>DB: 8. UPDATE favorites SET is_deleted = false WHERE id = :id RETURNING *
        else Bản ghi chưa từng tồn tại
            Repo->>DB: 8. INSERT INTO favorites (user_id, song_id, title, artist, album, artwork, is_deleted) VALUES (...) RETURNING *
        end
        DB-->>Repo: 9. Trả về bản ghi FavoriteResponseDTO
        Repo-->>Controller: 10. Trả về DTO kết quả
        Controller-->>API: 11. 201 Created: { success: true, data: result }
    else Thao tác Xóa Yêu Thích
        API->>Controller: 4. DELETE /api/profile/favorites/:songId
        Controller->>Controller: 5. Xác thực req.auth.userId & Bóc tách songId
        Controller->>Repo: 6. removeFavorite(userId, songId)
        Repo->>DB: 7. UPDATE favorites SET is_deleted = true WHERE user_id = :userId AND song_id = :songId
        DB-->>Repo: 8. Trả về số dòng bị ảnh hưởng (affectedRows > 0)
        Repo-->>Controller: 9. Trả về boolean true/false
        Controller-->>API: 10. 200 OK: { success: true, message: "Track removed" }
    end

    alt Nếu API gặp sự cố (Lỗi mạng hoặc 500 Server Error)
        API-->>UI: 12. Bắt lỗi ngoại lệ trong khối catch
        UI->>State: 13. (Tùy chọn) Khôi phục lại trạng thái cũ (Rollback) & Hiển thị thông báo Toast
    end
```

#### 📝 Mô tả tuần tự từng bước (Step-by-Step Breakdown):

- **Bước 1 (Tương tác nút Heart)**: Người dùng bấm vào biểu tượng trái tim trên thẻ bài hát bất kỳ. Hàm `handleToggleFavorite(song, e)` được kích hoạt. Lệnh `e.stopPropagation()` được gọi đầu tiên để ngăn sự kiện nổi bọt (Bubble event) kích hoạt trình phát nhạc.
- **Bước 2 (Cập nhật giao diện tức thì - Optimistic UI Update)**:
  * Hàm kiểm tra trạng thái hiện tại: `const isFav = favoritedSongIds.has(song.id)`.
  * Tạo một bản sao mới của Set: `const newFavIds = new Set(favoritedSongIds)`.
  * *Nếu đang là yêu thích*: Xóa ID khỏi Set (`newFavIds.delete(song.id)`), loại bỏ bài hát khỏi mảng `favorites` trong React State. Icon đổi sang màu xám mờ.
  * *Nếu chưa yêu thích*: Thêm ID vào Set (`newFavIds.add(song.id)`), đưa bài hát vào danh sách `favorites`. Icon đổi sang màu đỏ rực rỡ kèm animation co giãn nhẹ.
  * Toàn bộ thao tác hoàn tất trong 0ms, đem lại cảm giác phản hồi tức thì cho người dùng.
- **Bước 3 (Gửi yêu cầu đồng bộ ngầm)**:
  * Client gọi `getToken()` từ Clerk để lấy JWT Token hợp lệ.
  * Nếu là thao tác thêm: Gọi `axios.post('/api/profile/favorites', payload, headers)`.
  * Nếu là thao tác xóa: Gọi `axios.delete('/api/profile/favorites/${song.id}', headers)`.
- **Bước 4 (Thẩm định dữ liệu tại Controller)**:
  * `ProfileController` kiểm tra `req.auth?.userId`. Nếu không có, lập tức trả về mã `401 Unauthorized`.
  * Đối với thao tác thêm mới: Controller kiểm tra tính toàn vẹn của DTO: các trường `song_id`, `title`, `artist`, `album`, `artwork` không được để trống (trả về mã `400 Bad Request` nếu thiếu).
- **Bước 5 (Xử lý tầng Repository với Cơ chế Soft Delete)**:
  * `FavoritesRepository.addFavorite` truy vấn cơ sở dữ liệu để tìm bản ghi có `user_id` và `song_id` tương ứng.
  * *Trường hợp bản ghi đã tồn tại trong DB nhưng có cờ `is_deleted = true`* (người dùng từng thích rồi bỏ thích trước đó): Thực hiện khôi phục trạng thái bằng câu lệnh:
    ```sql
    UPDATE favorites SET is_deleted = false, updated_at = NOW() WHERE id = :existingId;
    ```
  * *Trường hợp bản ghi chưa từng tồn tại*: Thực hiện chèn mới bản ghi:
    ```sql
    INSERT INTO favorites (user_id, song_id, title, artist, album, artwork, preview_url, external_url, is_deleted)
    VALUES (:userId, :songId, :title, :artist, :album, :artwork, :previewUrl, :externalUrl, false)
    RETURNING *;
    ```
  * *Đối với thao tác xóa (`removeFavorite`)*: Thực hiện xóa mềm (Soft Delete) để bảo toàn lịch sử nghe và phân tích:
    ```sql
    UPDATE favorites SET is_deleted = true, updated_at = NOW() WHERE user_id = :userId AND song_id = :songId;
    ```
- **Bước 6 (Phản hồi Client)**: Backend phản hồi mã `201 Created` kèm dữ liệu bài hát hoặc mã `200 OK` xác nhận xóa thành công.
- **Bước 7 (Đồng bộ danh sách yêu thích khi khởi động)**: Mỗi khi người dùng đăng nhập hoặc mở Dashboard, một request `GET /api/profile/favorites` được gửi ngầm để tải toàn bộ danh sách bài hát yêu thích đang hoạt động (`is_deleted = false`) và nạp lại vào `favoritedSongIds` Set.

#### 🛡️ Kiểm soát lỗi & Ngoại lệ (Error Handling):

- Nếu mạng bị ngắt kết nối giữa chừng hoặc server trả về lỗi 500, khối `catch` trong React component ghi nhận lỗi. Trong trường hợp cần thiết, ứng dụng có thể thực hiện hoàn tác (Rollback) trạng thái của Set `favoritedSongIds` và mảng `favorites` về giá trị trước khi bấm, đồng thời hiển thị thông báo lỗi (Toast alert) cho người dùng biết thao tác chưa được lưu.

---

### 3.6. Luồng 6: Trình Phát Nhạc Trực Tuyến & Tương Tác Âm Thanh (Audio Player Flow)

#### 🎯 Mục tiêu nghiệp vụ:

Cung cấp trải nghiệm nghe nhạc thử nghiệm 30 giây chất lượng cao mượt mà trực tiếp từ Apple CDN, tích hợp các bộ điều khiển âm thanh hoàn chỉnh (Phát/Dừng, Tua thời gian, Chuyển bài trước/sau, Tự động chuyển bài) và các hoạt ảnh đồ họa sinh động (Equalizer Animation).

#### 👥 Các thành phần tham gia:

- **`audioRef` (`HTMLAudioElement`)**: Phần tử âm thanh HTML5 native được điều khiển qua React Ref.
- **React Audio Controller (`saas-platform/src/app/home/page.tsx`)**: Quản lý State bài hát, tiến trình và hàng đợi.
- **Visualizer Component (`Equalizer`)**: Hoạt ảnh các cột sóng âm thanh bằng Framer Motion.
- **Apple Music Audio CDN**: Máy chủ phân phối các đoạn âm thanh nghe thử 30 giây định dạng AAC/M4A.

#### 📊 Sơ đồ trạng thái phát nhạc (State Machine Diagram):

```mermaid
stateDiagram-v2
    [*] --> Idle: Trình phát sẵn sàng (Chưa chọn bài)

    Idle --> Loading: 1. Người dùng bấm Play trên bài hát có previewUrl
    Loading --> Playing: 2. Tải Audio Metadata & Buffer thành công
    Loading --> Error: 2. previewUrl không hợp lệ hoặc lỗi mạng
  
    state Playing {
        [*] --> StreamingAudio
        StreamingAudio --> UpdateTimeline: Event 'timeupdate' (Tính % tiến trình & số giây đã qua)
        StreamingAudio --> AnimateEqualizer: Motion SVG Equalizer nhảy ngẫu nhiên
    }

    Playing --> Paused: 3. Người dùng bấm nút Pause (audio.pause())
    Paused --> Playing: 4. Người dùng bấm nút Play tiếp tục (audio.play())

    Playing --> Seeking: 5. Người dùng click vào thanh Timeline
    Seeking --> Playing: 6. Gán audio.currentTime = percentage * duration

    Playing --> TrackEnded: 7. Phát hết 30s preview (Event 'ended')
    TrackEnded --> AutoNext: 8. Tự động gọi handleNextTrack()
    AutoNext --> Playing: Phát bài kế tiếp trong Current Playlist
    AutoNext --> Idle: Nếu đã là bài hát cuối cùng trong Playlist
  
    Error --> Idle: Đặt lại state & thông báo cho người dùng
```

#### 📝 Mô tả tuần tự từng bước (Step-by-Step Breakdown):

- **Bước 1 (Chọn bài hát & Kích hoạt trình phát)**: Người dùng bấm vào nút Play trên một thẻ bài hát trong danh sách Today's Vibe, AI Scan Results hoặc Favorites. Hàm `playTrack(song, playlist)` được gọi:
  * Kiểm tra điều kiện tiên quyết: Nếu bài hát không có thuộc tính `previewUrl`, hàm dừng lại nhằm tránh nạp file rỗng.
  * Cập nhật React State: `currentTrack = song` và `currentPlaylist = playlist`.
- **Bước 2 (Nạp nguồn âm thanh & Khởi động phát)**:
  * Gán URL nghe thử vào phần tử audio: `audioRef.current.src = song.previewUrl`.
  * Gọi phương thức `audioRef.current.play()`. Lệnh này được bọc trong Promise `.catch()` để ngăn ngừa lỗi vi phạm chính sách Autoplay Policy của trình duyệt nếu người dùng chưa tương tác với trang.
- **Bước 3 (Đăng ký & Lắng nghe Sự kiện Âm thanh - Event Listeners)**: Trong hook `useEffect`, ứng dụng gắn các hàm xử lý sự kiện vào đối tượng `audioRef.current`:
  * `loadedmetadata`: Khi trình duyệt tải xong thông tin độ dài file, cập nhật `audioDuration = audio.duration` (thường là khoảng 30.0 giây).
  * `timeupdate`: Được kích hoạt liên tục (khoảng 4 lần/giây) khi bài hát đang phát. Hàm tính toán:

    $$
    \text{audioElapsed} = \text{audio.currentTime}
    $$

    $$
    \text{audioProgress (\%)} = \left( \frac{\text{audio.currentTime}}{\text{audio.duration}} \right) \times 100
    $$

    Các giá trị này điều khiển độ dài thanh tiến trình (Progress Bar) màu xanh/tím trên giao diện.
  * `play` và `pause`: Tự động đồng bộ cờ Boolean `isAudioPlaying = true` hoặc `false`.
  * `ended`: Được kích hoạt khi bài hát chạy hết 30 giây. Tự động gọi hàm `handleNextTrack()`.
- **Bước 4 (Kích hoạt Hoạt ảnh Visualizer Equalizer)**:
  * Khi `isAudioPlaying = true`, Component `<Equalizer active={true} />` kích hoạt 5 cột sóng SVG.
  * Sử dụng thư viện `motion/react`, mỗi cột sóng co giãn theo trục dọc (`scaleY`) từ $0.3$ đến $1.0$ với độ trễ (delay) khác nhau ($0.12s \times i$) tạo hiệu ứng sóng âm nhảy múa nhịp nhàng theo điệu nhạc.
- **Bước 5 (Điều khiển tương tác - User Controls)**:
  * *Dừng / Tiếp tục phát*: Bấm nút Play/Pause trên thanh điều khiển dưới cùng kích hoạt hàm `toggleAudioPlayPause()`: kiểm tra nếu đang phát thì gọi `audio.pause()`, nếu đang dừng thì gọi `audio.play()`.
  * *Tua nhanh / Tua chậm (Seeking)*: Khi người dùng bấm vào thanh tiến trình, hàm `handleProgressClick(e)` đo tọa độ click chuột so với chiều rộng phần tử:
    $$
    \text{percentage} = \frac{e.\text{clientX} - \text{rect.left}}{\text{rect.width}}, \quad \text{audio.currentTime} = \text{percentage} \times \text{audio.duration}
    $$

    Âm thanh lập tức nhảy đến đúng thời điểm được chọn.
  * *Chuyển bài thủ công (Next / Previous Track)*:
    - Bấm nút Next (`handleNextTrack`): Tìm vị trí `idx` của `currentTrack` trong `currentPlaylist`. Nếu `idx < currentPlaylist.length - 1`, lập tức gọi `playTrack(currentPlaylist[idx + 1], currentPlaylist)`.
    - Bấm nút Prev (`handlePrevTrack`): Nếu `idx > 0`, phát bài hát liền trước `currentPlaylist[idx - 1]`.
- **Bước 6 (Tự động chuyển bài liên tục - Continuous Playback)**: Khi sự kiện `ended` phát ra, hệ thống tự động tìm và phát bài kế tiếp trong danh sách hiện tại. Người dùng có thể nghe liên tục toàn bộ danh sách nhạc gợi ý mà không cần bấm chuyển từng bài thủ công.

#### 🛡️ Kiểm soát lỗi & Ngoại lệ (Error Handling):

- Nếu đường link `previewUrl` của Apple bị hết hạn hoặc lỗi kết nối CDN, trình duyệt phát ra sự kiện `error`, cờ `isAudioPlaying` tự động chuyển về `false` và trình phát dừng lại một cách an toàn mà không làm treo ứng dụng.
- Định dạng thời gian được bảo vệ bằng hàm `formatTime`: nếu `seconds` là `NaN` hoặc rỗng, trả về mặc định `"0:00"`.

---

## 4. Thiết Kế Cơ Sở Dữ Liệu & Bộ Nhớ Tạm (Database & Cache Design)

### 4.1. Cơ sở dữ liệu quan hệ PostgreSQL

Hệ thống sử dụng **PostgreSQL** kết nối qua Knex.js Client với cơ chế connection pooling (Min: 0, Max: 10, SSL enabled):

#### Bảng: `favorites` (Lưu danh sách bài hát yêu thích)

| Cột (Column)    | Kiểu dữ liệu (Data Type) | Ràng buộc (Constraints) | Mô tả                                             |
| :--------------- | :-------------------------- | :------------------------ | :-------------------------------------------------- |
| `id`           | `UUID` / `BIGSERIAL`    | `PRIMARY KEY`           | Khóa chính tự sinh                               |
| `user_id`      | `VARCHAR(255)`            | `NOT NULL, INDEX`       | Định danh người dùng từ Clerk (`user_2...`) |
| `song_id`      | `VARCHAR(100)`            | `NOT NULL`              | ID bài hát từ nhà cung cấp (iTunes Track ID)   |
| `title`        | `VARCHAR(500)`            | `NOT NULL`              | Tên bài hát                                      |
| `artist`       | `VARCHAR(500)`            | `NOT NULL`              | Tên nghệ sĩ / ban nhạc                          |
| `album`        | `VARCHAR(500)`            | `NOT NULL`              | Tên album phát hành                              |
| `artwork`      | `TEXT`                    | `NOT NULL`              | URL ảnh bìa chất lượng cao (100x100 / 600x600) |
| `preview_url`  | `TEXT`                    | `NULLABLE`              | URL file âm thanh nghe thử 30s (AAC/MP3)          |
| `external_url` | `TEXT`                    | `NULLABLE`              | Link mở bài hát trực tiếp trên Apple Music    |
| `is_deleted`   | `BOOLEAN`                 | `DEFAULT FALSE, INDEX`  | Cờ xóa mềm (Soft Delete)                         |
| `created_at`   | `TIMESTAMP`               | `DEFAULT NOW()`         | Thời điểm thêm vào yêu thích                 |
| `updated_at`   | `TIMESTAMP`               | `DEFAULT NOW()`         | Thời điểm cập nhật cuối cùng                 |

> **Chỉ mục tối ưu (Indexes):**
>
> - `idx_favorites_user_deleted`: `CREATE INDEX ON favorites(user_id, is_deleted);` (Giúp truy vấn danh sách yêu thích của người dùng đạt tốc độ $O(\log N)$).
> - `idx_favorites_user_song`: `CREATE UNIQUE INDEX ON favorites(user_id, song_id);` (Chống trùng lặp dữ liệu mức DB).

#### Bảng: `ai_outputs` (Lịch sử phân tích hình ảnh AI)

| Cột (Column)    | Kiểu dữ liệu  | Ràng buộc                                | Mô tả                                         |
| :--------------- | :--------------- | :----------------------------------------- | :---------------------------------------------- |
| `id`           | `UUID`         | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Khóa chính                                    |
| `user_id`      | `VARCHAR(255)` | `NOT NULL, INDEX`                        | Clerk User ID                                   |
| `feature_type` | `VARCHAR(50)`  | `NOT NULL`                               | Loại tác vụ (`match_music`, `vibe_scan`) |
| `input_params` | `JSONB`        | `NOT NULL`                               | Thông tin file ảnh, kích thước, tên file  |
| `output_data`  | `JSONB`        | `NOT NULL`                               | Danh sách từ khóa và bài hát trích xuất |
| `created_at`   | `TIMESTAMP`    | `DEFAULT NOW()`                          | Thời điểm phân tích                        |

---

### 4.2. Thiết Kế Bộ Nhớ Tạm Upstash Redis (Caching Architecture)

Do sử dụng tài nguyên Redis Free-tier (chỉ hỗ trợ Database 0), VibeTune triển khai chiến lược **Namespace Key Prefixing** theo môi trường để tránh xung đột dữ liệu:

$$
\text{Key Format: } \langle \text{env} \rangle\text{:vibetune:}\langle \text{domain} \rangle\text{:}\langle \text{params} \rangle
$$

```
Ví dụ thực tế:
- dev:vibetune:search:taylor swift:25:US
- prod:vibetune:context:rainy:morning
- prod:vibetune:fallback:default
```

#### Ma Trận Chiến Lược Bộ Nhớ Tạm (Cache Policy Matrix)

| Tên nhóm Cache            | Quy tắc đặt Khóa (Key Pattern)   | TTL (Thời gian sống) | Mục đích & Lý do thiết kế                                                                                                    |
| :-------------------------- | :----------------------------------- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Song Search**       | `search:{query}:{limit}:{country}` | **6 giờ**       | Metadata bài hát từ iTunes hiếm khi thay đổi. Giảm thiểu số lượng request tới Apple API, tránh bị Rate Limit.        |
| **Contextual Vibe**   | `context:{weather}:{session}`      | **30 phút**     | Thời tiết và buổi trong ngày thay đổi liên tục. Cần làm mới định kỳ nhưng vẫn giảm tải tính toán trùng lặp. |
| **Fallback Playlist** | `fallback:default`                 | **24 giờ**      | Danh sách bài hát dự phòng khi toàn bộ dịch vụ bên ngoài (Weather/iTunes) gặp sự cố (Circuit Breaker pattern).       |
| **Rate Limit Auth**   | `rl:auth:{userId}`                 | **15 phút**     | Token bucket đếm số lượng request của từng người dùng đăng nhập.                                                      |
| **Rate Limit Public** | `rl:public:{ip}`                   | **15 phút**     | Token bucket đếm số lượng request theo địa chỉ IP ẩn danh.                                                                |

#### 🔄 Kiến Trúc Bộ Nhớ Đệm 2 Tầng (Two-Tier Caching Architecture)

Hệ thống kết hợp 2 cấp độ cache độc lập để tối đa hóa tốc độ phản hồi và hạn chế tối đa việc gọi trùng lặp ra ngoài:

```mermaid
flowchart TD
    Req["Client yêu cầu Today's Vibe"] --> Tier1{"TẦNG 1: Context-Level Cache<br/>Key: context:{weather}:{session}<br/>(Ví dụ: context:rain showers:evening)"}
  
    Tier1 -- "Cache HIT (<= 30 phút)" --> ReturnContext["Lấy nguyên Playlist 75 bài từ Redis (5ms)<br/>-> Dừng lại, KHÔNG đụng tới Top-16 keywords, KHÔNG gọi iTunes"]
    ReturnContext --> ResponseClient(["Phản hồi Client 200 OK"])
  
    Tier1 -- "Cache MISS" --> ActivateKeywords["KÍCH HOẠT TOP-16 KEYWORDS<br/>- Lấy 16 từ khóa từ WeatherGenreMatch<br/>- Sinh tối đa 14 Query Variants"]
  
    ActivateKeywords --> LoopQueries["Duyệt qua từng Query Variant & Quốc gia"]
  
    subgraph Tier2 ["TẦNG 2: Song-Level Cache (search:{query}:{limit}:{country})"]
        CheckSongCache{"Tồn tại trong Redis?<br/>(TTL: 6 giờ)"}
        CheckSongCache -- HIT --> GetFromRedis["Đọc mảng bài hát từ Redis"]
        CheckSongCache -- MISS --> CallApple["Gọi HTTP GET tới Apple iTunes API"]
        CallApple --> WriteSongCache["Ghi kết quả vào Redis Tầng 2 (TTL: 6h)"]
        GetFromRedis --> MergeCandidates["Gom vào danh mục Ứng viên"]
        WriteSongCache --> MergeCandidates
    end
  
    LoopQueries --> Tier2
    MergeCandidates --> Scoring["Chấm điểm (Scoring), Khử trùng lặp, Xếp hạng"]
    Scoring --> WriteTier1["GHI NGƯỢC LẠI VÀO TẦNG 1:<br/>Key: context:{weather}:{session} (TTL: 30 phút)"]
    WriteTier1 --> ResponseClient
```

- **Mối liên hệ giữa 2 tầng:**
  1. **Tầng 1 (Context Cache)** có mức độ trừu tượng cao nhất, bao trùm toàn bộ kết quả của một buổi thời tiết cụ thể.
  2. **Top-16 Keywords** đóng vai trò là **cầu nối kích hoạt có điều kiện**: Chỉ khi Tầng 1 bị MISS thì mới lôi Top-16 từ khóa ra để băm nhỏ thành các truy vấn cho **Tầng 2 (Song Cache)**.
  3. Sau khi Tầng 2 hoàn tất tổng hợp danh sách bài hát, kết quả này được **ghi ngược lại vào Tầng 1** để phục vụ tức thì cho tất cả những người dùng truy cập tiếp theo trong vòng 30 phút.

---

## 5. Bảo Mật, Giới Hạn Tần Suất & Khả Năng Chống Chịu (Resilience & Security)

### 5.1. Phân Tầng Giới Hạn Tần Suất (Distributed Rate Limiting)

Hệ thống sử dụng middleware `rate-limit-redis` tích hợp trực tiếp vào Redis Client. Nếu Redis gặp sự cố kết nối, hệ thống tự động fallback về bộ nhớ RAM cục bộ (In-Memory Limiter) để không làm gián đoạn dịch vụ:

```mermaid
graph TD
    Req[Request tới Backend] --> Identify{Xác thực người dùng?}
  
    Identify -- "Có (req.auth.userId)" --> AuthLimiter["Authenticated Limiter<br/>Max: 20 req / 15 phút<br/>Key: rl:auth:{userId}"]
    Identify -- "Không (Public IP)" --> PublicLimiter["Public Limiter<br/>Max: 100 req / 15 phút<br/>Key: rl:public:{ip}"]
  
    AuthLimiter --> CheckLimit{Vượt ngưỡng?}
    PublicLimiter --> CheckLimit
  
    CheckLimit -- Có --> Err429["429 Too Many Requests<br/>Header: Retry-After"]
    CheckLimit -- Không --> NextMW[Tiếp tục chuyển vào Controller]
```

### 5.2. Cơ Chế Giữ Ấm Dịch Vụ (Keep-Alive / Anti-Cold-Start Mechanism)

Các hạ tầng đám mây miễn phí (Render, Railway, Hugging Face Spaces) thường rơi vào trạng thái ngủ đông (Sleep Mode) sau 15 phút không có lưu lượng truy cập:

- **Keepalive Router (`backend/src/modules/keepalive/`)**: Cung cấp route `GET /` siêu nhẹ.
- Định kỳ, một cron job ngoài hoặc frontend ping vào endpoint này và `AI_CLIP/ping` để giữ RAM của FastAPI model và Node.js server luôn "nóng", giảm tối đa độ trễ chờ đợi (Cold start delay từ 45s xuống < 200ms).

### 5.3. Xử Lý Suy Thoái Duyên Dáng (Graceful Degradation)

1. **Lỗi AI Service**: Nếu microservice Python quá tải hoặc chết, backend bắt lỗi Axios và trả về danh sách nhạc theo thể loại dự phòng thay vì trả về lỗi 500 trắng cho người dùng.
2. **Lỗi Weather API**: Nếu không lấy được tọa độ hoặc thời tiết, `WeatherService` tự động rơi về kịch bản thời tiết mặc định căn cứ theo giờ hệ thống (ví dụ: ban đêm $\to$ nhạc chill/ambient).
3. **Lỗi Redis**: Mọi hàm đọc/ghi `cacheService` đều được bọc trong khối `try/catch`. Nếu Redis ngắt kết nối, ứng dụng ghi log cảnh báo và tiếp tục truy vấn thẳng vào cơ sở dữ liệu/API bên ngoài mà không làm crash tiến trình.

---

## 6. Đặc Tả Chi Tiết API (RESTful API Specifications)

### 6.1. Nhóm API Quét Cảm Xúc (Vibe Scan)

#### 🔹 `POST /api/vibe-scan`

- **Mô tả:** Tải lên ảnh, phân tích vibe qua AI CLIP và lấy danh sách bài hát gợi ý.
- **Xác thực:** Bắt buộc (Clerk Token: `Bearer <token>`).
- **Content-Type:** `multipart/form-data` (Field name: `file`, Dung lượng tối đa: 10MB).
- **Phản hồi thành công (200 OK):**

```json
{
  "success": true,
  "songs": [
    {
      "id": "1440857781",
      "title": "Golden Hour",
      "artist": "Kacey Musgraves",
      "album": "Golden Hour",
      "artwork": "https://is1-ssl.mzstatic.com/image/thumb/Music128/.../source/100x100bb.jpg",
      "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/.../preview.m4a",
      "externalUrl": "https://music.apple.com/us/album/golden-hour/..."
    }
  ]
}
```

- **Mã lỗi thường gặp:**
  - `400 Bad Request`: Không có file tải lên hoặc định dạng file không nằm trong danh sách hỗ trợ (`image/jpeg`, `image/png`, `image/webp`).
  - `401 Unauthorized`: Thiếu hoặc sai token xác thực.
  - `502 Bad Gateway`: AI microservice không phản hồi hoặc gặp lỗi xử lý tensor.

---

### 6.2. Nhóm API Thời Tiết & Ngữ Cảnh (Weather & Time)

#### 🔹 `GET /api/weather-time/today-vibe`

- **Mô tả:** Lấy thông tin thời tiết hiện tại và playlist phù hợp với thời tiết & khung giờ.
- **Xác thực:** Công khai (Public).
- **Query Params:**
  - `tz` *(tùy chọn)*: Timezone của trình duyệt (ví dụ: `Asia/Ho_Chi_Minh`, `America/New_York`).
- **Phản hồi thành công (200 OK):**

```json
{
  "success": true,
  "data": {
    "weather": {
      "temperature": 24,
      "weatherCode": 80,
      "humidity": 82,
      "windSpeed": 12,
      "condition": "Rain showers",
      "currentTime": "2026-03-13T19:30",
      "location": {
        "latitude": 21.0285,
        "longitude": 105.8542,
        "country": "Vietnam",
        "countryCode": "VN"
      }
    },
    "genres": ["lo-fi", "jazz", "acoustic", "chillhop"],
    "mood": "cozy melancholic",
    "reasoning": "A gentle rainy evening with cool air calls for cozy lo-fi beats and warm acoustic tones.",
    "session": "evening",
    "songs": [
      {
        "id": "154321987",
        "title": "Coffee in the Rain",
        "artist": "Lo-Fi Beats Collective",
        "album": "Rainy Days Vol. 1",
        "artwork": "https://is1-ssl.mzstatic.com/image/thumb/.../100x100bb.jpg",
        "previewUrl": "https://audio-ssl.itunes.apple.com/.../preview.m4a"
      }
    ]
  }
}
```

---

### 6.3. Nhóm API Quản Lý Bài Hát Yêu Thích (Profile & Favorites)

#### 🔹 `GET /api/profile/favorites`

- **Mô tả:** Lấy danh sách toàn bộ bài hát đã được người dùng lưu vào mục yêu thích.
- **Xác thực:** Bắt buộc (`req.auth.userId`).
- **Phản hồi (200 OK):**

```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "id": "uuid-v4",
        "song_id": "1440857781",
        "title": "Golden Hour",
        "artist": "Kacey Musgraves",
        "album": "Golden Hour",
        "artwork": "https://...",
        "preview_url": "https://...",
        "external_url": "https://..."
      }
    ],
    "total": 1
  }
}
```

#### 🔹 `POST /api/profile/favorites`

- **Mô tả:** Thêm bài hát vào danh sách yêu thích.
- **Xác thực:** Bắt buộc.
- **Body Payload (JSON):**

```json
{
  "song_id": "1440857781",
  "title": "Golden Hour",
  "artist": "Kacey Musgraves",
  "album": "Golden Hour",
  "artwork": "https://...",
  "preview_url": "https://...",
  "external_url": "https://..."
}
```

- **Phản hồi:** `201 Created`

#### 🔹 `DELETE /api/profile/favorites/:songId`

- **Mô tả:** Xóa bài hát khỏi danh sách yêu thích (thực hiện soft-delete).
- **Xác thực:** Bắt buộc.
- **Phản hồi:** `200 OK` `{ "success": true, "message": "Track removed from favorites" }`

#### 🔹 `GET /api/profile/favorites/:songId/status`

- **Mô tả:** Kiểm tra nhanh một bài hát cụ thể đã được người dùng yêu thích hay chưa.
- **Xác thực:** Bắt buộc.
- **Phản hồi (200 OK):** `{ "success": true, "data": { "isFavorited": true } }`

---

### 6.4. Nhóm API Tìm Kiếm Nhạc (Song Search)

#### 🔹 `POST /api/song/search`

- **Body:** `{ "query": "Lofi Hip Hop", "limit": 20 }`
- **Xác thực:** Công khai hoặc Authenticated.
- **Phản hồi:** Danh sách `Song[]` kèm tổng số kết quả tìm kiếm.

---

### 6.5. Nhóm API Kiểm Tra Sức Khỏe & Quản Trị (Health & Admin)

| Phương thức | Đường dẫn               | Chức năng                                        | Phân quyền   |
| :------------- | :-------------------------- | :------------------------------------------------- | :------------- |
| `GET`        | `/health`                 | Kiểm tra kết nối Database, Redis, Uptime        | Public         |
| `GET`        | `/health/cache`           | Xem tỷ lệ Cache Hit/Miss của Redis              | Public / Admin |
| `POST`       | `/admin/cache/clear`      | Xóa sạch bộ nhớ đệm môi trường hiện tại | Admin only     |
| `POST`       | `/admin/cache/invalidate` | Xóa cache theo mẫu (pattern matching)            | Admin only     |
| `GET`        | `/`                       | Keep-alive ping endpoint (trả về status 200)     | Public         |

---

## 7. Môi Trường Biến Cấu Hình (Environment Variables Reference)

### 7.1. Phân hệ Backend (`backend/.env.local` hoặc `.env`)

```env
# Cấu hình Cổng & Môi trường
PORT=5000
NODE_ENV=development

# Cơ sở dữ liệu PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=vibetune_db
DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/vibetune_db

# Bộ nhớ tạm & Giới hạn tần suất Upstash Redis
REDIS_URL=rediss://default:your_upstash_token@your-cluster.upstash.io:6379

# Xác thực Clerk
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Dịch vụ AI Vision
CLIP_URL=http://localhost:8000

# Dịch vụ bên ngoài (Thời tiết & Định vị)
WEATHERAPI_CURRENT_URL=https://api.weatherapi.com/v1/current.json
OPEN_METEO_URL=https://api.open-meteo.com/v1/forecast
WEATHER_API_KEY=your_weatherapi_key_here
```

### 7.2. Phân hệ Frontend (`saas-platform/.env.local`)

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home

# Backend Proxy Destination
API_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 7.3. Phân hệ AI Service (`AI_CLIP/.env`)

```env
MODEL_PATH=clip_vision_512.onnx
TEXT_EMB_PATH=vibe_embeddings.npy
KEYWORDS_PATH=vibe_keywords.npy
LOG_LEVEL=INFO
```

---

## 8. Hướng Dẫn Vận Hành & Khởi Chạy Hệ Thống (Operations & Local Setup)

### 8.1. Khởi động 3 phân hệ bằng dòng lệnh cục bộ

Mở 3 cửa sổ dòng lệnh riêng biệt:

- **Cửa sổ 1 - AI Microservice:**

  ```bash
  cd AI_CLIP
  python -m venv venv
  # Kích hoạt venv (Windows: venv\Scripts\activate | Unix: source venv/bin/activate)
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
  ```
- **Cửa sổ 2 - Backend REST API:**

  ```bash
  cd backend
  npm install
  npm run dev
  # Lắng nghe tại http://localhost:5000
  ```
- **Cửa sổ 3 - Frontend Next.js:**

  ```bash
  cd saas-platform
  npm install
  npm run dev
  # Lắng nghe tại http://localhost:3000
  ```

### 8.2. Kiểm tra tính toàn vẹn (Verification Checklist)

1. Truy cập `http://localhost:8000/ping` $\to$ Nhận `{"status": "ok"}`.
2. Truy cập `http://localhost:5000/api/weather-time/today-vibe` $\to$ Nhận JSON thời tiết và danh sách bài hát kèm status `200`.
3. Truy cập `http://localhost:3000` $\to$ Chuyển hướng sang `/landing-page` nếu chưa đăng nhập, hiển thị Dashboard `/home` sau khi xác thực Clerk.
4. Tải lên một bức ảnh bất kỳ trong mục **AI Vibe Scan** $\to$ Kiểm tra xem có trích xuất danh sách bài hát và thanh audio player có phát được bản preview 30s hay không.

---

## 9. Định Hướng Mở Rộng Hệ Thống (Future Roadmap)

1. **Bộ sưu tập & Danh sách phát cá nhân (Playlists & Collections)**: Bổ sung bảng `playlists` và `playlist_songs` cho phép người dùng gom nhóm bài hát yêu thích theo chủ đề cá nhân.
2. **Theo dõi lịch sử nghe nhạc (`song_plays`)**: Ghi nhận hành vi nghe nhạc thực tế để tích hợp thuật toán Collaborative Filtering tinh chỉnh độ chính xác gợi ý theo thời gian.
3. **Mở rộng nhà cung cấp âm nhạc (Multi-Music Provider)**: Tích hợp thêm Spotify Web API và YouTube Music API song song với Apple iTunes để hỗ trợ phát full-length track cho người dùng có tài khoản Premium.
4. **Mô hình AI nhúng trực tiếp trên Edge/Client**: Thử nghiệm biên dịch CLIP sang ONNX WebGL hoặc WebGPU chạy trực tiếp trong trình duyệt người dùng nhằm giảm tải hoàn toàn chi phí server AI.
