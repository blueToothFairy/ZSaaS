# GitHub Copilot Instructions for VibeTune

> **Generated from actual codebase analysis.** Last updated: March 2026

## Project Overview

**VibeTune** is an AI-powered music discovery SaaS that generates personalized playlists based on:
- User images (mood, color palette, energy extracted via CLIP AI)
- Real-time weather and time-of-day context
- User preferences and listening history

The platform is a full-stack TypeScript application with a Python AI service, designed for music enthusiasts, creatives, and mood-driven listeners.

---

## Tech Stack

### Frontend (saas-platform/)
- **Framework**: Next.js 16.1+ (App Router)
- **Language**: TypeScript 5.9+ (strict mode)
- **Auth**: Clerk 6.36+ (@clerk/nextjs)
- **UI Components**: Radix UI (full set: accordion, dialog, select, etc.)
- **Styling**: Emotion + Material UI 7.3.5 + TailwindCSS (custom)
- **Database Client**: Supabase JS 2.90+
- **HTTP**: Axios 1.13+
- **Animation**: Motion (Framer Motion)
- **Image Compression**: browser-image-compression 2.0+

### Backend (backend/)
- **Framework**: Express.js 5.2+ (with ESM modules)
- **Language**: TypeScript 5.9+ (strict mode, NodeNext module resolution)
- **Database**: PostgreSQL via pg 8.18+
- **ORM**: Knex 3.1+ (query builder)
- **Auth Middleware**: @clerk/express 1.7+
- **File Upload**: Multer 2.0+
- **HTTP Client**: Axios 1.13+
- **CORS**: CORS middleware (currently permissive)

### AI Service (AI_CLIP/)
- **Framework**: FastAPI (Python 3.9+)
- **Model**: CLIP Vision (onnx runtime)
- **Image Processing**: Pillow
- **ML Libraries**: Transformers (Hugging Face), ONNXRuntime
- **Monitoring**: psutil (memory tracking)
- **Server**: Uvicorn

### Build & Dev Tools
- **Build**: TypeScript compiler (tsc)
- **Dev Server**: tsx 4.21+ (backend), next dev (frontend)
- **Linting**: ESLint (Next.js config, TypeScript support)
- **Package Manager**: npm (inferred from package.json)

---

## Code Style & Conventions

### Naming Conventions (Derived from Actual Code)

#### File & Folder Names
- **Module folders**: kebab-case (`vibe-scan`, `profile`, `song`, `weather-time`)
- **Class filenames**: match class name in PascalCase, plus type suffix
  - `profile.controller.ts` → `ProfileController`
  - `favorites.service.ts` → `FavoritesService`
  - `favorites.knex.ts` → `FavoritesRepository`
- **Type suffixes** (strict convention):
  - `.dto.ts` – Data Transfer Objects (validation schemas)
  - `.controller.ts` – HTTP request handlers
  - `.service.ts` – Business logic
  - `.interface.ts` – TypeScript interfaces
  - `.knex.ts` – Repository implementation (database layer)
  - `.module.ts` – Module exports & dependency injection
  - `.route.ts` – Express route definitions

#### Variables & Functions
- **camelCase**: variables, function names, parameters
  - `userId`, `getFavorites`, `addFavorite`, `favoritedSongIds`
  - `scanProgress`, `sidebarOpen`, `audioElapsed`
- **PascalCase**: classes, interfaces, exported types
  - `FavoritesService`, `CLIPService`, `ProfileController`
  - `WeatherData`, `Song`, `Favorite`
- **UPPER_SNAKE_CASE**: constants & env vars
  - `CLIP_URL`, `DB_HOST`, `MODEL_PATH`, `TEXT_EMB_PATH`

#### Database Naming
- **Table names**: snake_case (`favorites`, `ai_outputs`, `user_profiles`)
- **Column names**: snake_case
  - `user_id`, `song_id`, `is_deleted`, `created_at`, `preview_url`
- **Soft deletes pattern**: boolean `is_deleted` column (observed in FavoritesRepository)

### Class & Type Structure

**Controllers** (Pattern from profile.controller.ts, vibe.controller.ts)
```typescript
export class ProfileController {
  constructor(private readonly favoritesService: FavoritesService) {}
  
  async getFavorites(req: ClerkRequest, res: Response): Promise<void> {
    // Validate userId from Clerk auth
    // Call service
    // Return res.status(code).json({ success: boolean, data?: any, message?: any })
  }
}
```

**Services** (Pattern from favorites.service.ts, CLIP.service.ts)
```typescript
export default class FavoritesService {
  constructor(private readonly favoritesRepository: IFavoritesRepository) {}
  
  async addFavorite(userId: string, favorite: CreateFavoriteDTO): Promise<FavoriteResponseDTO> {
    // Business logic only, no HTTP concerns
    return this.favoritesRepository.addFavorite(userId, favorite);
  }
}
```

**Repositories** (Pattern from favorites.knex.ts)
```typescript
export default class FavoritesRepository implements IFavoritesRepository {
  constructor(private readonly db: Knex) {}
  
  async addFavorite(userId: string, favorite: CreateFavoriteDTO): Promise<FavoriteResponseDTO> {
    const existing = await this.db('favorites').where({ user_id: userId, song_id: favorite.song_id }).first();
    if (existing) {
      if (existing.is_deleted) {
        await this.db('favorites').where({ id: existing.id }).update({ is_deleted: false });
      }
      return existing;
    }
    const [record] = await this.db('favorites').insert({ ... }).returning('*');
    return record;
  }
}
```

**DTOs** (Pattern from favorite.dto.ts)
```typescript
export interface CreateFavoriteDTO {
  song_id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  preview_url?: string;
  external_url?: string;
}

export interface FavoriteResponseDTO {
  id: string;
  user_id: string;
  // ... all fields including timestamps
}
```

**Interfaces** (Pattern from ai-scanner.interface.ts, song-search.interface.ts)
```typescript
export interface Vibe {
  keyword: string;
  score: number;
}

export default interface IAIVibeScanner {
  extractVibes(data: FormData): Promise<Vibe[]>;
}
```

### API Response Format (Strict Pattern)

All endpoints return JSON with this structure:
```json
{
  "success": true/false,
  "data": { ... },        // Only on success (200-299)
  "message": "...",       // Only on error (4xx-5xx)
  "error": "...",         // Alternative error field
  "details": "..."        // Only in development (NODE_ENV === 'development')
}
```

**HTTP Status Codes:**
- `200`: Success with data
- `400`: Bad request (missing fields, invalid format)
- `401`: Unauthorized (no userId from Clerk)
- `500`: Server error (unhandled exception)
- `502`: Bad gateway (external service failure, e.g., iTunes API, CLIP AI)

### Async/Await & Error Handling

- **All async functions** must use `async`/`await`, never `.then()`
- **Controllers** catch all errors and return appropriate HTTP responses
- **Error logging**: `console.error('functionName error:', err.message, fullError)`
- **Distinguish error types**:
  - Axios errors → `axios.isAxiosError(error)` → `502` status
  - Input validation → `400` status
  - Auth missing → `401` status
  - Unexpected → `500` status

### Database Patterns

**Soft Deletes** (observed in favoritesRepository)
```typescript
// Don't delete, just mark as deleted
await this.db('favorites').where({ id }).update({ is_deleted: false || true });

// Always filter in queries
const favorites = await this.db('favorites').where({ user_id, is_deleted: false });
```

**Knex Query Style**:
```typescript
// Preferred style from codebase
await this.db('table_name')
  .where({ column: value })
  .select('*')
  .first() // or omit for multiple rows
  
// INSERT with returning
const [record] = await this.db('table').insert({ ... }).returning('*');

// UPDATE
await this.db('table').where({ id }).update({ field: newValue });
```

### Dependency Injection Pattern

Each module has a `.module.ts` file that instantiates and exports the controller:
```typescript
// vibe.module.ts pattern
const clipService = new CLIPService();
const iTunesSearchService = new ITunesSearchService();
const aiRepo = new KnexAIOutputsRepository(db);
const vibeScannerService = new VibeScannerService(clipService, iTunesSearchService, aiRepo);
const vibeController = new VibeScannerController(vibeScannerService);
export default vibeController;
```

### ESM Imports & Module Resolution

- **Use ESM syntax**: `import X from './file.js'` (with `.js` extension for local imports)
- **TypeScript config**: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`
- **Type imports**: Use `import type` when importing only types
- **Package.json**: `"type": "module"` (backend only)

### Frontend Patterns (Next.js)

**Component Structure**:
```typescript
'use client'  // Mark interactive components

import { useState, useRef, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';

// Inline interfaces at top of file
interface Song { id: string; title: string; ... }

export default function AppDashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  
  const [state, setState] = useState<Type>(null);
  
  useEffect(() => { /* fetch data */ }, []);
  
  return <div>...</div>;
}
```

**API Calls**:
- Use `axios` (not `fetch`)
- Call `/api/*` endpoints (proxied to backend via `next.config.ts` rewrite)
- Response typing: `axios.get<ResponseType>('/api/...')`

---

## Architecture Rules

### Module Structure (Backend)

Each module in `src/modules/` follows this pattern:

```
modules/
└── vibe-scan/
    ├── vibe.controller.ts
    ├── vibe.module.ts
    ├── vibe.route.ts
    ├── services/
    │   ├── CLIP.service.ts
    │   ├── index.ts (exports VibeScannerService)
    ├── repositories/
    │   └── ai-outputs.knex.ts
    ├── interfaces/
    │   ├── ai-scanner.interface.ts
    │   ├── ai-output-repo.interface.ts
    └── dto/
        └── ai-repo.ts
```

**Key Rule**: Each module is **self-contained** and exports its controller via `.module.ts`.

### Routing Pattern

Routes are registered in `app.ts`:
```typescript
app.use('/api/vibe-scan', vibeScannerRouter);
app.use('/api/song', songRouter);
app.use('/api/weather-time', weatherTimeRouter);
app.use('/api/profile', profileRouter);
```

Each route file (e.g., `vibe.route.ts`) defines Express routes and calls the module's controller.

### Authentication

- **Middleware**: `clerkMiddleware()` from `@clerk/express` (applied globally in `app.ts`)
- **Custom Type**: `ClerkRequest` extends Express Request with `auth` property
- **Pattern**: Extract `userId` from `req.auth?.userId` in controllers
- **Validation**: Return `401` if `!userId` instead of proceeding

### Database Connection

- **Singleton Pattern**: `knexClient.ts` exports a global `db` instance
- **Config**: Reads from env vars (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`)
- **Pool**: `{ min: 0, max: 10 }` (from knexClient.ts)
- **Connection String**: Uses object config with `ssl: { rejectUnauthorized: false }` (Supabase compatibility)

### External Service Integration

- **iTunes API**: `ITunesSearchService` in `song/services/`
  - Endpoint: `https://itunes.apple.com/search`
  - Params: `term`, `media`, `entity`, `limit`, `country`
  - Response: Deduplicates, transforms to internal `Song` format
  
- **CLIP AI Service**: `CLIPService` in `vibe-scan/services/`
  - Endpoint: `${CLIP_URL}/extract-vibes` (POST with FormData)
  - Timeout: **30 seconds** (⚠️ no fallback – fragile pattern)
  - Response: `{ top_keywords: Vibe[] }`

- **Weather API**: Assumed in `weather-time/` (details inferred from route)

- **Clerk Auth**: `@clerk/express` middleware integration
  - Returns `userId` in `req.auth.userId`

### File Upload & Image Processing

- **Multer**: Configured in vibe.controller for file handling
  - Limit: 10 MB (`maxContentLength`, `maxBodyLength`)
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`
  
- **Frontend Compression**: `browser-image-compression` (saas-platform)
  - Reduces file size before upload

---

## ✅ What TO Do

### Adding a New Feature

1. **Create module folder** under `src/modules/{kebab-case-name}/`

2. **Define types first**:
   - Create `dto/{name}.dto.ts` – Input/output types
   - Create `interfaces/{name}.interface.ts` – Service contract

3. **Implement in layers**:
   - Create `{name}.controller.ts` – Handle HTTP request/response
   - Create `services/{name}.service.ts` – Core business logic
   - Create `repositories/{name}.knex.ts` – Database access (if needed)

4. **Export from module**: Create `{name}.module.ts` with dependency injection

5. **Wire routes**: Create `{name}.route.ts` and register in `app.ts`

6. **Frontend integration**: Call `/api/{feature}/*` from Next.js component

### Adding a New API Endpoint

**Backend**:
```typescript
// 1. Add method to controller
async getResource(req: ClerkRequest, res: Response): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  
  try {
    const data = await this.service.getResource(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed", ...dev });
  }
}

// 2. Add route
router.get('/resource', (req, res) => controller.getResource(req as any, res));

// 3. Frontend: axios.get('/api/{module}/resource')
```

### Handling Errors

```typescript
try {
  // operation
} catch (error: unknown) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error('functionName error:', err.message, error);
  
  if (axios.isAxiosError(error)) {
    res.status(502).json({ error: "External service failed" });
  } else {
    res.status(500).json({ error: "Internal server error" });
  }
}
```

### TypeScript Best Practices

- Use strict mode (enabled globally)
- Use `Promise<Type>` for all async functions
- Define `interface` before implementation
- Use `default export` for controllers, services, repositories
- Use `import type` for type-only imports
- Avoid `any` – provide explicit types

### Database Queries

```typescript
// Good: Knex chaining style
const results = await this.db('favorites')
  .where({ user_id: userId, is_deleted: false })
  .select('*');

// Never: Soft deletes without checking is_deleted
// ❌ Bad: const results = await this.db('favorites').where({ user_id });
// ✅ Good: const results = await this.db('favorites').where({ user_id, is_deleted: false });
```

---

## ⚠️ What NOT to Do

### Anti-Patterns Found in Codebase

1. **CORS Configuration**
   - ❌ Current: `cors({ origin: '*' })` – allows any origin
   - ✅ Should be: `cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'] })`
   - **Risk**: CSRF attacks, unauthorized cross-origin requests

2. **No Rate Limiting**
   - ❌ Current: All endpoints open to unlimited requests
   - ✅ Should add: `express-rate-limit` on all `/api/*` routes
   - **Risk**: DDoS, brute force on favorites API, AI service overload

3. **No Caching**
   - ❌ Current: Every iTunes search and CLIP extraction hits external services
   - ✅ Should add: Redis cache with TTL (1 hour for iTunes, 24 hours for CLIP)
   - **Risk**: Latency overhead, API quota exhaustion, cost spike

4. **No Circuit Breaker for AI Service**
   - ❌ Current: Hard-coded 30s timeout, no fallback
   - ✅ Should add: `opossum` circuit breaker pattern with graceful degradation
   - **Risk**: Cascading failures, user sees errors instead of fallback

5. **No Request Validation (in some endpoints)**
   - ❌ Incomplete validation in controllers
   - ✅ Should use: `class-validator` or enforce DTO validation in all controllers
   - **Risk**: SQL injection, malformed data in database

6. **No Request Pagination**
   - ❌ Current: `/favorites` returns ALL records
   - ✅ Should add: `limit` & `offset` query params
   - **Risk**: Memory exhaustion, N+1 queries, slow responses with large datasets

7. **Hardcoded Magic Numbers**
   - ❌ `maxRetries = 3`, `timeout: 30000`, `limit: 50`
   - ✅ Should move to `.env` or config file
   - **Risk**: Hard to adjust in production without redeploying

8. **Error Messages in Development**
   - ❌ Returning `err.message` to frontend in production
   - ✅ Current code does check `NODE_ENV === 'development'` ✓ (good)
   - **Risk**: Information disclosure if not done carefully

9. **Type Casting Without Validation**
   - ❌ `req.auth.userId` assumed to exist after null check above
   - ✅ Current code does check – good pattern ✓

10. **Direct console.log in Production**
    - ❌ `console.log('searchSongs')` spam
    - ✅ Should use structured logging (winston, pino) or remove dev logs
    - **Risk**: Log bloat, security info leakage

11. **No Environment Validation**
    - ❌ Current: `CLIP_URL` may be undefined, crashes later
    - ✅ Should validate on startup with `joi` or `zod`
    - **Risk**: Silent failures, hard-to-debug deployment issues

12. **Mixed Async Patterns**
    - ❌ Using `async/await` everywhere ✓ (good, no `.then()` chains in main code)
    - ✅ Keep it consistent – you're already doing this well

13. **Unhandled Promise Rejections**
    - ❌ If async operation in non-awaited code
    - ✅ Current code awaits everything – good ✓

14. **No Input Sanitization**
    - ❌ Query strings from iTunes API not validated
    - ✅ Should sanitize string inputs before passing to external APIs
    - **Risk**: Injection attacks

15. **Service Naming Inconsistency**
    - ❌ `CLIPService` vs `ITunesSearchService` – mixed naming
    - ✅ Should be: `ClipService` or `ClipModel` (PascalCase, match other services)

16. **Vietnamese Comments in Core Code**
    - ❌ `tsconfig.json` has Vietnamese explanations
    - ✅ Use English only for international teams
    - **Risk**: Non-English speakers can't understand config decisions

---

## ⚠️ Inconsistencies Found

| Issue | Location | Current | Recommended Fix |
|-------|----------|---------|-----------------|
| **Class naming** | CLIPService | `CLIPService` (all caps) | `ClipService` (match iTunesSearchService pattern) |
| **Response format** | All controllers | Inconsistent `error` vs `message` field | Standardize to `{ success, data \| error, [details] }` |
| **Environment validation** | Backend startup | No validation of required env vars | Add `joi` or `zod` validation in `server.ts` |
| **Error logging** | Controllers | Logs full `error` object | Log only `error.message` or structured format |
| **CORS** | `app.ts` | `origin: '*'` | Should read from `process.env.ALLOWED_ORIGINS` |
| **Type assertions** | Controllers | `req as any` in route handlers | Create proper `ClerkRequest` types instead |
| **File size validation** | vibe.controller | Comment says "max 1MB" but code checks 10MB | Update validation to 10MB as documented, or clarify intent |

---

## External Integrations Reference

- **Clerk Auth**: `@clerk/express` middleware, extracts `userId` from JWT
- **iTunes Search**: `https://itunes.apple.com/search` – public API, no auth needed
- **CLIP AI Service**: Custom FastAPI service deployed on Hugging Face (or similar)
- **Supabase PostgreSQL**: Managed PostgreSQL instance with SSL
- **Weather API**: *(Endpoint unclear; infer from weather-time handler)*

---

## Development Workflow

### Local Setup
```bash
# Backend
cd backend
npm install
npm run dev  # runs 'tsx watch ./src/server.ts'

# Frontend
cd saas-platform
npm install
npm run dev  # runs 'next dev'

# AI Service (Python)
cd AI_CLIP
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Environment Variables
See `.env.local` files (not in repo; create from README instructions)

### Build for Production
```bash
# Backend
npm run build  # tsc → dist/

# Frontend
npm run build  # next build

# AI Service
# Deploy to Hugging Face Spaces or custom server
```

---

## Related Documentation

- See `docs/project-structure.md` for detailed folder structure
- See `.github/agents/dev-assistant.md` for agent-specific workflows
- See `.copilot/context.md` for business domain & architecture decisions
