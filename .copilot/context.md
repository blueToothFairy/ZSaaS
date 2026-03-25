# VibeTune — Architecture Context & Domain Knowledge

> **Last Updated**: March 2026

---

## Key Architecture Decisions

### 1. Modular Express Backend (Controller/Service/Repository Pattern)
- **Decision**: Each feature is a self-contained module with separated concerns
- **Rationale**: Scales well as team grows; easy to add features without touching existing code
- **Example**: `modules/profile/`, `modules/song/`, `modules/vibe-scan/`, `modules/weather-time/`
- **Trade-off**: More boilerplate (DTO, interface, module file) vs. flexibility

### 2. Soft Deletes Instead of Hard Deletes
- **Decision**: Mark records as `is_deleted: true` instead of destroying them
- **Rationale**: Preserves user data history, enables audit trails, allows "undo" features
- **Implementation**: Every query checks `where({ ..., is_deleted: false })`
- **Risk**: Must remember to filter `is_deleted: false` in every query (see REVIEW.md)

### 3. Knex Query Builder (Not Full ORM)
- **Decision**: Use Knex for SQL building instead of TypeORM/Prisma
- **Rationale**: More control, smaller bundle, easier to understand SQL generated
- **Trade-off**: Manual query building vs. auto-migrations (migrations not automated)

### 4. Clerk for Authentication (Not in-house)
- **Decision**: Outsource auth to Clerk instead of custom JWT
- **Rationale**: Reduces security burden, includes SSO/MFA/passwordless options
- **Integration**: `@clerk/express` middleware extracts `userId` from JWT
- **Limitation**: Dependent on Clerk API uptime; price scales with MAU

### 5. AI Vision via CLIP (Not Fine-tuned Model)
- **Decision**: Use pre-trained CLIP model run on Hugging Face Spaces
- **Rationale**: Fast deployment, no ML ops burden, low cost for inference
- **Trade-off**: Generic vibes (not brand-specific); 30s latency acceptable for use case
- **Cost Model**: Charged per computational unit on Hugging Face

### 6. iTunes API for Song Database (Not Custom Catalog)
- **Decision**: Query iTunes API in real-time instead of ingesting catalog
- **Rationale**: Always fresh metadata, legal simplicity (no licensing deals), no storage burden
- **Trade-off**: Slower search (API call per query), dependent on iTunes availability
- **Rate Limit**: Unknown; need to monitor for throttling

### 7. Next.js Frontend with API Proxy (Not Separate API Gateway)
- **Decision**: Route `/api/*` to backend via Next.js rewrites in `next.config.ts`
- **Rationale**: Simpler deployment, no extra container, reduces latency (same origin)
- **Trade-off**: Frontend and backend closely coupled; harder to scale separately

---

## Known Technical Debt & TODOs

> **Last Documented in REVIEW.md (February 2026)**

### Critical Gaps (Performance & Reliability)

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| **No Redis Caching** | iTunes queries repeat 100% latency overhead | Medium | P0 |
| **No Rate Limiting** | Open to DDoS, API quota abuse | Low | P0 |
| **No Circuit Breaker** | CLIP timeout = user sees error, no graceful fallback | Medium | P1 |
| **CORS `origin: '*'`** | CSRF attacks, unauthorized cross-origin access | Low | P0 |
| **No Request Pagination** | `/favorites` returns ALL records; N+1 risk | Low | P1 |
| **No Database Indices** | Missing indexes on (user_id, is_deleted) composite columns | Low | P2 |
| **30s AI Timeout Hardcoded** | Not configurable; network hiccups cause complete failure | Low | P2 |
| **No Environment Validation** | Missing env vars silently fail at runtime | Low | P1 |

### Code Comments Indicating Uncertainty

- **vibe.module.ts**: Conditional CLIP_URL check with warning log (CLIP service optional?)
- **vibe.controller.ts**: Commented-out async DB save of AI results (feature not completed)
- **profile.controller.ts**: Type assertion `(req as any)` instead of proper ClerkRequest typing

### Missing Optimizations

- No caching for repeated user requests
- No pagination for large result sets
- No compression (gzip/brotli) on responses
- No CDN for artwork/images
- No read replicas for database

---

## Business Domain Glossary

### Core Concepts

| Term | Definition | Example |
|------|-----------|---------|
| **Vibe** | A mood/aesthetic descriptor extracted from image via CLIP AI | "lofi", "nostalgic", "neon city" |
| **Favorite** | A song saved by user for later listening | User bookmarks "Song X" after vibe scan |
| **Session** | Time context for music recommendation (morning, evening, etc.) | Morning = upbeat/focus music |
| **Vibe Scan** | User-initiated process: upload image → extract vibes → find songs | Upload desert sunset photo → get lo-fi sunset playlists |
| **Today's Vibe** | Curated playlist based on real-time weather + time of day | Rainy evening = cozy lo-fi + ambient |

### User Archetypes (Inferred from README)

1. **Music Enthusiasts** – Discover beyond algorithm; want context-aware playlists
2. **Creatives** (designers, photographers, content creators) – Find aesthetic-matched soundtracks
3. **Mood-Driven Listeners** – Music that matches current environment
4. **SaaS Developers** – Exploring AI/ML integration patterns

### Data Entities

#### Favorite
```typescript
{
  id: string;
  user_id: string;          // From Clerk auth
  song_id: string;          // From iTunes API
  title: string;            // Song title
  artist: string;           // Artist name
  album: string;            // Album name
  artwork: string;          // Album artwork URL (100x100px from iTunes)
  preview_url?: string;     // 30s preview from iTunes
  external_url?: string;    // iTunes Store link
  is_deleted: boolean;      // Soft delete flag
  created_at?: timestamp;
}
```

#### Vibe
```typescript
{
  keyword: string;    // E.g., "lofi", "rainy", "midnight", "nostalgic"
  score: number;      // Confidence (0-1 or 0-100)
}
```

#### Song (Internal Format)
```typescript
{
  id: string;           // iTunes track ID
  title: string;
  artist: string;
  album: string;
  artwork: string;      // Album artwork URL
  previewUrl?: string;  // 30s preview URL
  duration?: number;    // Song length in ms
  externalUrl?: string; // iTunes store link
}
```

#### Weather (Inferred from frontend)
```typescript
{
  temperature: number;
  weatherCode: number;    // WMO weather code
  humidity: number;
  windSpeed: number;
  condition: string;      // E.g., "rainy", "sunny"
}
```

---

## External Service Integrations

### Clerk Authentication
- **Purpose**: Secure user identity & JWT-based auth
- **Integration**: `@clerk/express` middleware in backend; `@clerk/nextjs` in frontend
- **Key Data**: Extract `userId` from `req.auth.userId` (backend) or `useAuth().user.id` (frontend)
- **Failure Mode**: If Clerk is down, auth middleware fails; API returns 401
- **Cost**: Based on Monthly Active Users (MAU)

### iTunes Search API
- **Endpoint**: `https://itunes.apple.com/search`
- **Params**: `{ term, media: 'music', entity: 'song', limit, country }`
- **Response**: Array of tracks with metadata (name, artist, artwork100px, previewUrl)
- **Deduplication**: Service removes duplicate results (same track_id)
- **Rate Limiting**: Unknown rate limit; no documented throttling observed yet
- **Cost**: Free (Apple provided)

### CLIP Vision Model (Hugging Face)
- **Endpoint**: `${CLIP_URL}/extract-vibes` (POST with FormData + image)
- **Model**: `openai/clip-vit-base-patch32` (open-source)
- **Input**: Image file (JPEG, PNG, WebP; max 10MB)
- **Output**: `{ top_keywords: [{ keyword: string, score: number }] }`
- **Latency**: 3-5s per request (network + model inference)
- **Timeout**: Hard-coded 30 seconds (no retry/circuit breaker)
- **Cost**: Charged per GPU-hour on Hugging Face Spaces

### Weather API (Inferred from Code)
- **Used in**: `weather-time/` module for "Today's Vibe" feature
- **Data**: Real-time weather (temp, humidity, wind) + time of day
- **Endpoint**: Not explicitly shown; likely Open-Meteo or equivalent
- **Cost Model**: Unknown (possibly free tier)

### PostgreSQL Database (Supabase)
- **Purpose**: Store user favorites, AI analysis history
- **Auth**: Connection string with `ssl: { rejectUnauthorized: false }` (Supabase requirement)
- **Connection Pool**: Knex pool with `min: 0, max: 10`
- **Backup**: Supabase provides daily backups
- **Failure Mode**: If DB is down, all endpoints return 500

---

## Feature Workflows (Happy Paths)

### Workflow 1: Vibe Scan (Image → Songs)
```
1. User uploads image (JPG, PNG, WebP; < 10MB) via frontend
2. Frontend compresses image with browser-image-compression
3. POST /api/vibe-scan with FormData (image)
4. Backend validates file type & size
5. VibeScannerService calls CLIP AI service
6. CLIP extracts top vibes (e.g., "lofi", "nostalgic", "rainy")
7. Backend calls iTunes API with vibes as search terms
8. iTunesSearchService deduplicates results
9. Return songs to frontend
10. User can add songs to favorites (saved to DB)
```

### Workflow 2: Today's Vibe (Weather + Time → Songs)
```
1. Frontend loads "Today's Vibe" section on mount
2. GET /api/weather-time/today-vibe
3. WeatherTimeService fetches current weather + time of day
4. Generates vibe keywords based on weather (e.g., rainy = "lo-fi", "cozy")
5. Calls iTunes API with these keywords
6. Returns curated playlist + reasoning to frontend
7. User can play preview or add to favorites
```

### Workflow 3: Favorite Management
```
1. User clicks heart icon on a song
2. POST /api/profile/favorites { song_id, title, artist, ... }
3. FavoritesRepository checks if already favorited (is_deleted = true case)
4. If soft-deleted, restore (is_deleted = false)
5. If new, insert record
6. Return success + updated favorite object
7. Frontend updates local state immediately
```

---

## Deployment Architecture (Current)

```
┌─────────────────────────────────────────────────────────────┐
│  Users (Browser)                                            │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS
        ┌──────────▼──────────┐
        │  Vercel (Frontend)  │  saas-platform/
        │  Next.js            │  - Static + SSR
        │  Port: 443          │  - Clerk auth
        └──────────┬──────────┘
                   │ /api/* rewrites to
        ┌──────────▼──────────────────┐
        │  Render (Backend)           │  backend/
        │  Express.js +               │  - REST API
        │  Node.js 18+                │  - Clerk middleware
        │  Port: 5000                 │  - Knex + PostgreSQL
        └──────────┬──────────────────┘
                   │
    ┌──────────────┼──────────────┬──────────────────┐
    │              │              │                  │
    │ iTunes API   │ PostgreSQL    │  CLIP AI Service │
    │ (Search)     │ (Supabase)    │  (Hugging Face)  │
    │              │              │  (FastAPI)       │
    └──────────────┴──────────────┴──────────────────┘
```

### Hosting Details
- **Frontend**: Vercel (auto-deploys from GitHub main)
- **Backend**: Render (auto-deploys from GitHub main; can cold-start)
- **Database**: Supabase PostgreSQL (shared instance or dedicated)
- **AI Service**: Hugging Face Spaces (Python FastAPI CLIP model)

---

## Known Risks & Assumptions

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| iTunes API rate limiting or changes | Medium | Service stops working | Monitor API responses; implement fallback catalog |
| CLIP service timeout (30s hard limit) | Medium | User sees error; no graceful fallback | Add circuit breaker + fallback empty results |
| Clerk auth service down | Low | All users locked out | No client-side workaround; wait for Clerk |
| PostgreSQL connection pool exhaustion | Low | New requests timeout | Monitor pool usage; increase max connections if needed |
| CORS misconfiguration allows exploits | High | CSRF, data theft | Switch from `origin: '*'` to allowlist |
| Missing database indices | Low | Query latency increases with data | Profile queries; add composite (user_id, is_deleted) index |
| No caching → API quota exceeded | Medium | Vibe scans blocked by iTunes rate limit | Implement Redis cache with 1hr TTL |

---

## Future Roadmap Hints (Inferred)

From code comments and README:
- [ ] **Personalization**: ML model to refine recommendations based on user history
- [ ] **Playlist Saving**: Save generated playlists (not just individual favorites)
- [ ] **Social**: Share vibes with other users
- [ ] **Mobile App**: React Native client
- [ ] **Spotify Integration**: Add Spotify as music source (require OAuth)
- [ ] **Audio Fingerprinting**: Recognize songs from audio samples
- [ ] **Real-time Collaboration**: Multiple users curating playlist together

---

## Environment Variables (Reference)

### Backend (.env)
```bash
# Server
PORT=5000
NODE_ENV=development|production

# Database (Supabase)
DB_HOST=...supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=...
DB_NAME=postgres

# Auth
CLERK_SECRET_KEY=...  # From Clerk dashboard

# AI Service
CLIP_URL=https://...hf.space/  # Hugging Face Space URL

# Optional
WEATHER_API_KEY=...
```

### Frontend (.env.local)
```bash
# API Proxy
API_URL=http://localhost:5000  # Dev; set to https://backend-domain.com in prod

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

---

## Code Quality Observations

### Strengths
- ✅ Strict TypeScript throughout (strict: true)
- ✅ Async/await patterns (no .then() chains)
- ✅ Error handling with proper status codes
- ✅ Modular architecture scales well
- ✅ Clear separation of concerns (controller → service → repository)

### Weaknesses
- ❌ No unit tests ([mentioned in REVIEW.md](REVIEW.md#tests))
- ❌ No rate limiting (vulnerable to abuse)
- ❌ No caching (high latency, API quota risk)
- ❌ Missing input sanitization
- ❌ CORS too permissive
- ❌ Hardcoded timeouts (not configurable)
- ❌ Comments in Vietnamese (internationalization issue)

