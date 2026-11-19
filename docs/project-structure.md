# VibeTune Project Structure

> **An annotated guide to the actual directory layout and conventions used in the codebase.**

---

## Root-Level Directory Tree

```
ZSaaS/
├── README.md                    # Main project overview, features, and setup
├── REVIEW.md                    # Comprehensive system architecture review (Feb 2026)
│
├── AI_CLIP/                     # Python AI Vision Service
│   ├── app/
│   │   ├── main.py              # FastAPI app factory and lifespan
│   │   ├── api/routes.py        # Health and image-analysis endpoints
│   │   ├── core/                # Environment settings and logging
│   │   └── services/clip.py     # ONNX model loading and inference
│   ├── assets/
│   │   ├── models/              # ONNX model variants
│   │   ├── catalog/             # Embeddings and keyword labels
│   │   └── clip_processor/      # Local preprocessing/tokenizer files
│   ├── scripts/                 # Offline pipeline notes and experiments
│   │   ├── flow.txt              # CLIP extraction flow notes
│   │   └── pipeline.ipynb        # Model/export and catalog experiments
│   ├── tests/                   # Unit and API tests
│   ├── requirements.txt         # Pinned runtime dependencies
│   ├── requirements-dev.txt     # Test dependencies
│   ├── Dockerfile               # Hugging Face Spaces image (port 7860)
│   ├── AI_HOSTING_HF.md         # Hugging Face deployment steps
│   └── README.md                # AI service setup and deployment guide
│
├── backend/                     # Express.js + TypeScript REST API
│   ├── package.json             # Backend dependencies (Express, Knex, Clerk, etc.)
│   ├── tsconfig.json            # TypeScript strict mode, ESM configuration
│   ├── src/
│   │   ├── server.ts            # Entry point; loads env vars, creates HTTP server
│   │   ├── app.ts               # Express app setup; registers all routes & middleware
│   │   │
│   │   ├── shared/              # Shared utilities & types used across modules
│   │   │   ├── db/
│   │   │   │   └── knexClient.ts # PostgreSQL connection (Singleton pattern)
│   │   │   └── types/
│   │   │       └── ClerkRequest.ts # Type definition for authenticated requests
│   │   │
│   │   └── modules/             # Feature modules (each self-contained)
│   │       ├── profile/
│   │       │   ├── profile.controller.ts       # Handle GET/POST/DELETE /favorites
│   │       │   ├── profile.module.ts           # Dependency injection & exports
│   │       │   ├── profile.route.ts            # Express router definition
│   │       │   ├── services/
│   │       │   │   ├── index.ts                # Export main service (FavoritesService)
│   │       │   │   └── favorites.service.ts    # Business logic for favorites
│   │       │   ├── repositories/
│   │       │   │   └── favorites.knex.ts       # Database access layer
│   │       │   ├── interfaces/
│   │       │   │   ├── profile.interface.ts    # ProfileRepository contract
│   │       │   │   └── favorites.interface.ts  # IFavoritesRepository contract
│   │       │   └── dto/
│   │       │       └── favorite.dto.ts         # CreateFavoriteDTO, FavoriteResponseDTO
│   │       │
│   │       ├── song/
│   │       │   ├── song.controller.ts          # searchSongs(), searchByKeywords()
│   │       │   ├── song.module.ts              # Service instantiation
│   │       │   ├── song.route.ts               # POST routes for song search
│   │       │   ├── services/
│   │       │   │   ├── index.ts                # Export SongSearchService
│   │       │   │   └── itunes.search.service.ts # Query iTunes API
│   │       │   ├── interfaces/
│   │       │   │   └── song-search.interface.ts # ISongSearch contract
│   │       │   └── dto/                        # (not present; could add)
│   │       │
│   │       ├── vibe-scan/
│   │       │   ├── vibe.controller.ts          # POST /vibe-scan with image upload
│   │       │   ├── vibe.module.ts              # Wire up CLIP + iTunes services
│   │       │   ├── vibe.route.ts               # Multer middleware + route
│   │       │   ├── services/
│   │       │   │   ├── index.ts                # Export VibeScannerService
│   │       │   │   └── CLIP.service.ts         # Call HuggingFace CLIP API
│   │       │   ├── repositories/
│   │       │   │   └── ai-outputs.knex.ts      # Store AI extraction results
│   │       │   ├── interfaces/
│   │       │   │   ├── ai-scanner.interface.ts # IAIVibeScanner contract
│   │       │   │   └── ai-output-repo.interface.ts # AIRepository contract
│   │       │   └── dto/
│   │       │       └── ai-repo.ts              # AI output structure
│   │       │
│   │       ├── weather-time/
│   │       │   ├── weather-time.controller.ts  # getTodayVibe()
│   │       │   ├── weather-time.module.ts      # Service wiring
│   │       │   ├── weather-time.route.ts       # GET /today-vibe
│   │       │   └── services/
│   │       │       └── index.ts                # WeatherTimeService logic
│   │       │
│   │       └── song-searching/                 # (stub; not yet implemented)
│   │
│   └── dist/                    # (generated) Compiled JavaScript output
│
├── saas-platform/               # Next.js 16+ Frontend (React + TypeScript)
│   ├── package.json             # Frontend dependencies (Next, Clerk, Radix UI, etc.)
│   ├── tsconfig.json            # TypeScript config for Next.js
│   ├── next.config.ts           # API proxy rewrite; experimental serverComponents
│   ├── eslint.config.mjs         # ESLint rules (extends Next.js + TypeScript)
│   ├── postcss.config.mjs        # TailwindCSS processing
│   ├── .next/                   # (generated) Next.js build output
│   │
│   ├── public/                  # Static assets (favicon, etc.)
│   │
│   └── src/
│       ├── proxy.ts             # (utility; purpose unclear)
│       │
│       ├── app/
│       │   ├── layout.tsx        # Root layout; ClerkProvider wrapper
│       │   ├── page.tsx          # Main dashboard component (vibe scan, favorites, player)
│       │   ├── globals.css       # Global styles
│       │   │
│       │   ├── home/
│       │   │   └── page.tsx      # (home page; route unclear)
│       │   │
│       │   ├── profile/
│       │   │   └── page.tsx      # User profile page
│       │   │
│       │   ├── sign-in/
│       │   │   └── [[...sign-in]]/  # Clerk auth (catch-all route)
│       │   │
│       │   ├── sign-up/
│       │   │   └── [[...sign-up]]/  # Clerk auth (catch-all route)
│       │   │
│       │   └── components/
│       │       ├── figma/
│       │       │   └── ImageWithFallback.tsx  # Reusable image component
│       │       └── ui/                        # (appears empty; could add Radix UI components)
│       │
│       ├── lib/
│       │   ├── services/         # (currently empty)
│       │   └── utils/
│       │       ├── file-to-base64.ts       # Convert files to base64
│       │       ├── image-compressor.ts     # Compress images before upload
│       │       └── pdf-parser.ts           # (mentioned; purpose unclear)
│       │
│       └── styles/
│           ├── globals.css       # TailwindCSS + custom tokens
│           ├── index.css         # Component library styles
│           ├── theme.css         # Theme variables
│           ├── fonts.css         # Custom font definitions
│           └── tailwind.css      # TailwindCSS directives
```

---

## Module Architecture Pattern (Backend)

Every backend module follows this structure:

```
modules/{module-name}/
├── {module}.controller.ts       # HTTP handlers (request/response)
├── {module}.module.ts           # Dependency injection & exports
├── {module}.route.ts            # Express Router definition
├── services/
│   ├── index.ts                 # Export all services
│   └── {feature}.service.ts     # Business logic
├── repositories/               # Optional; only if database access needed
│   └── {feature}.knex.ts        # Database queries (Knex)
├── interfaces/                 # TypeScript contracts
│   └── {feature}.interface.ts   # Service/Repository interfaces
└── dto/                         # Data Transfer Objects
    └── {name}.dto.ts            # Request/response types
```

### Example: profile Module
```
profile/
├── profile.controller.ts        # getFavorites(), addFavorite(), removeFavorite()
├── profile.module.ts            # Instantiate and export ProfileController
├── profile.route.ts             # Define GET/POST/DELETE routes
├── services/
│   ├── index.ts                 # export { default } from './favorites.service.js'
│   └── favorites.service.ts     # FavoritesService.addFavorite(), getFavorites()
├── repositories/
│   └── favorites.knex.ts        # FavoritesRepository with Knex queries
├── interfaces/
│   ├── profile.interface.ts      # ProfileRepository (unused; legacy?)
│   └── favorites.interface.ts    # IFavoritesRepository contract
└── dto/
    └── favorite.dto.ts          # CreateFavoriteDTO, FavoriteResponseDTO
```

---

## Purpose of Major Directories

### AI_CLIP/
**Purpose**: Independent Python service for AI-powered image analysis via CLIP model.

- **app/main.py**: FastAPI app factory; loads service resources through lifespan
- **app/api/routes.py**: `GET /ping` and `POST /extract-vibes` endpoints
- **app/services/clip.py**: ONNX session, catalog validation, and ranking
- **assets/**: Deployable model, embeddings, keyword labels, and local processor
- **Deployment**: Containerized and deployed to Hugging Face Spaces or cloud VM

**Why Separate?**
- Decoupled from Node.js backend; can scale independently
- CLIP inference is CPU-heavy (may need GPU in future)
- Can be versioned and updated separately

### backend/
**Purpose**: REST API for all business logic, authentication, and data persistence.

- **Controllers**: Handle HTTP requests/responses (status codes, JSON format)
- **Services**: Encapsulate business logic (no HTTP concerns)
- **Repositories**: Abstract database layer (can swap PostgreSQL for MongoDB)
- **DTOs**: Validate and transform incoming/outgoing data

**Architecture Principle**: Separation of concerns allows easy testing and refactoring.

### saas-platform/
**Purpose**: User-facing web application built with React/Next.js.

- **App Router**: File-based routing (Next.js 13+)
- **Clerk Auth**: User authentication UI & token management
- **API Proxy**: Routes `/api/*` to backend via `next.config.ts` rewrites
- **Components**: Reusable UI (mostly Radix UI + Emotion + Material UI)
- **Styles**: TailwindCSS + custom theme CSS

**Key Files**:
- `page.tsx`: Main dashboard with vibe scanner, favorites, player
- `layout.tsx`: Global layout with ClerkProvider wrapper
- `next.config.ts`: Proxy configuration to backend

---

## Naming Conventions Summary

### File Names

| Pattern | Example | Used For |
|---------|---------|----------|
| `{name}.controller.ts` | `profile.controller.ts` | HTTP request handlers |
| `{name}.service.ts` | `favorites.service.ts` | Business logic |
| `{name}.knex.ts` | `favorites.knex.ts` | Database repository |
| `{name}.module.ts` | `profile.module.ts` | Module exports & DI |
| `{name}.route.ts` | `profile.route.ts` | Express router |
| `{name}.interface.ts` | `favorites.interface.ts` | TypeScript contracts |
| `{name}.dto.ts` | `favorite.dto.ts` | Data validation types |

### Folder Names

| Pattern | Example | Structure |
|---------|---------|-----------|
| kebab-case | `vibe-scan`, `weather-time` | Module folders |
| lowercase | `services`, `repositories`, `interfaces`, `dto` | Category folders |

### Class & Variable Names

| Context | Pattern | Example |
|---------|---------|---------|
| Classes | PascalCase | `FavoritesService`, `ITunesSearchService` |
| Interfaces | PascalCase, prefix `I` | `IFavoritesRepository`, `IAIVibeScanner` |
| Functions | camelCase | `getFavorites()`, `addFavorite()` |
| Variables | camelCase | `userId`, `isFavoritesLoading`, `curatedSongs` |
| Constants | UPPER_SNAKE_CASE | `CLIP_URL`, `DB_HOST`, `MODEL_PATH` |
| Database columns | snake_case | `user_id`, `song_id`, `is_deleted`, `created_at` |
| Database tables | snake_case | `favorites`, `ai_outputs`, `user_profiles` |

---

## Step-by-Step: Adding a New Feature

### Example: Add a "Most Played Songs" Feature

#### 1. Analysis Phase
- Are there existing users with playback history? (Not stored yet; need database table)
- Where should this live? (New module `most-played` or extend `song`?)
- Decision: New module `most-played` to keep features separate

#### 2. Database Setup (Manual)
Create table (not automated migrations in this project):
```sql
CREATE TABLE IF NOT EXISTS song_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  song_id VARCHAR NOT NULL,
  played_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, song_id)
);
CREATE INDEX idx_song_plays_user_id_deleted 
  ON song_plays(user_id, is_deleted);
```

#### 3. Module Structure
```bash
backend/src/modules/most-played/
├── most-played.controller.ts
├── most-played.module.ts
├── most-played.route.ts
├── services/
│   ├── index.ts
│   └── most-played.service.ts
├── repositories/
│   └── song-plays.knex.ts
├── interfaces/
│   ├── most-played.interface.ts
│   └── song-plays.interface.ts
└── dto/
    └── most-played.dto.ts
```

#### 4. Implementation

**most-played.dto.ts:**
```typescript
export interface GetMostPlayedDTO {
  limit?: number;
  period?: 'week' | 'month' | 'all-time';
}

export interface SongPlayResponseDTO {
  song_id: string;
  title: string;
  artist: string;
  play_count: number;
  last_played: string;
}
```

**most-played.interface.ts:**
```typescript
export interface ISongPlaysRepository {
  recordPlay(userId: string, songId: string): Promise<void>;
  getMostPlayed(userId: string, limit: number, period: string): Promise<any[]>;
}

export interface IMostPlayedService {
  getMostPlayed(userId: string, limit?: number): Promise<SongPlayResponseDTO[]>;
}
```

**services/most-played.service.ts:**
```typescript
export default class MostPlayedService implements IMostPlayedService {
  constructor(private readonly repo: ISongPlaysRepository) {}

  async getMostPlayed(userId: string, limit = 10): Promise<SongPlayResponseDTO[]> {
    return this.repo.getMostPlayed(userId, limit, 'all-time');
  }
}
```

**repositories/song-plays.knex.ts:**
```typescript
export default class SongPlaysRepository implements ISongPlaysRepository {
  constructor(private readonly db: Knex) {}

  async recordPlay(userId: string, songId: string): Promise<void> {
    await this.db('song_plays')
      .insert({ user_id: userId, song_id: songId })
      .onConflict('user_id', 'song_id')
      .merge(); // Upsert
  }

  async getMostPlayed(userId: string, limit: number, period: string): Promise<any[]> {
    const query = this.db('song_plays')
      .where({ user_id: userId, is_deleted: false })
      .count({ plays: '*' })
      .groupBy('song_id')
      .orderBy('plays', 'desc')
      .limit(limit);
    return query;
  }
}
```

**most-played.controller.ts:**
```typescript
export class MostPlayedController {
  constructor(private readonly service: IMostPlayedService) {}

  async getMostPlayed(req: ClerkRequest, res: Response): Promise<void> {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ success: false });

    try {
      const { limit = 10 } = req.query;
      const results = await this.service.getMostPlayed(userId, parseInt(limit));
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      // ... error handling
    }
  }
}
```

**most-played.module.ts:**
```typescript
import { MostPlayedController } from "./most-played.controller.js";
import MostPlayedService from "./services/most-played.service.js";
import SongPlaysRepository from "./repositories/song-plays.knex.js";
import db from "../../shared/db/knexClient.js";

const repo = new SongPlaysRepository(db);
const service = new MostPlayedService(repo);
const controller = new MostPlayedController(service);

export default controller;
```

**most-played.route.ts:**
```typescript
import { Router, Request, Response } from "express";
import mostPlayedController from "./most-played.module.js";

const router = Router();

router.get('/', (req: Request, res: Response) =>
  mostPlayedController.getMostPlayed(req as any, res)
);

export default router;
```

#### 5. Register in app.ts
```typescript
import mostPlayedRouter from './modules/most-played/most-played.route.js';

app.use('/api/most-played', mostPlayedRouter);
```

#### 6. Frontend Usage (saas-platform)
```typescript
const [mostPlayed, setMostPlayed] = useState<Song[]>([]);

useEffect(() => {
  axios.get<{ success: true; data: Song[] }>('/api/most-played?limit=5')
    .then(res => setMostPlayed(res.data.data))
    .catch(err => console.error(err));
}, []);
```

---

## Step-by-Step: Adding a New API Endpoint

### Example: Check if Song is Favorited

This endpoint should be **fast** and **idempotent** (safe to call multiple times).

#### Backend

**profile.controller.ts** (add method):
```typescript
async isFavorited(req: ClerkRequest, res: Response): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false });

  try {
    const { songId } = req.params;
    if (!songId) return res.status(400).json({ error: "songId is required" });

    const isFin = await this.favoritesService.isFavorited(userId, songId);
    res.status(200).json({ success: true, data: { isFavorited: isFin } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error checking favorite status" });
  }
}
```

**profile.route.ts** (add route):
```typescript
// Check if a track is favorited
profileRouter.get(
  '/favorites/:songId/status',
  (req: Request, res: Response) => profileController.isFavorited(req as any, res)
);
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "isFavorited": true
  }
}
```

#### Frontend

**page.tsx** (in dashboard):
```typescript
const checkIsFavorited = async (songId: string) => {
  try {
    const res = await axios.get(`/api/profile/favorites/${songId}/status`);
    return res.data.data.isFavorited;
  } catch (error) {
    console.error('Failed to check favorite:', error);
    return false;
  }
};

// Usage in component
const heartColor = favoritedSongIds.has(song.id) ? 'filled' : 'outline';
<Heart 
  onClick={() => handleAddFavorite(song.id)}
  fill={heartColor === 'filled' ? 'red' : 'none'}
/>
```

---

## Code Organization Checklist for Adding Features

### Backend Feature Checklist ✅

- [ ] **1. Data Layer**
  - [ ] Create database table (if needed)
  - [ ] Add migration file (currently manual; consider automating)
  
- [ ] **2. Types & Interfaces**
  - [ ] Create `.dto.ts` file with request/response types
  - [ ] Create `.interface.ts` file with service/repository contracts
  
- [ ] **3. Business Logic**
  - [ ] Implement `.service.ts` class (depends on repository)
  - [ ] Implement `.knex.ts` repository (handles database)
  
- [ ] **4. HTTP Layer**
  - [ ] Create `.controller.ts` with request handlers
  - [ ] Create `.route.ts` with Express router
  
- [ ] **5. Wiring**
  - [ ] Create `.module.ts` with dependency injection
  - [ ] Add route to `app.ts`
  
- [ ] **6. Error Handling**
  - [ ] Handle 400 Bad Request (validation)
  - [ ] Handle 401 Unauthorized (no userId)
  - [ ] Handle 500 Internal Server Error
  - [ ] Log errors with `console.error()`
  
- [ ] **7. Testing** (Once test framework is added)
  - [ ] Unit tests for service logic
  - [ ] Integration tests for controller

### Frontend Feature Checklist ✅

- [ ] **1. State Management**
  - [ ] Define state with `useState()`
  - [ ] Load on mount with `useEffect()`
  
- [ ] **2. API Integration**
  - [ ] Create axios call to `/api/*` endpoint
  - [ ] Handle success response
  - [ ] Handle error response
  
- [ ] **3. UI Components**
  - [ ] Use existing UI components (Radir UI / Material UI)
  - [ ] Add event handlers (onClick, onChange, etc.)
  
- [ ] **4. Styling**
  - [ ] Use TailwindCSS classes or CSS modules
  - [ ] Ensure mobile-responsive layout
  
- [ ] **5. Error States**
  - [ ] Show error message if API fails
  - [ ] Show loading spinner while fetching
  
- [ ] **6. Accessibility**
  - [ ] Add aria labels where needed
  - [ ] Ensure keyboard navigation works

---

## File Locations Quick Reference

| Feature | Backend File | Frontend File |
|---------|--------------|---------------|
| User Favorites | `modules/profile/` | `app/page.tsx` (favorites section) |
| Song Search | `modules/song/` | `app/page.tsx` (search input) |
| Vibe Scan | `modules/vibe-scan/` | `app/page.tsx` (upload area) |
| Weather & Mood | `modules/weather-time/` | `app/page.tsx` (today's vibe section) |
| Authentication | `@clerk/express` middleware in `app.ts` | `layout.tsx` (ClerkProvider) |
| Database Config | `shared/db/knexClient.ts` | (N/A; backend only) |
| Type Definitions | `shared/types/`, module `interfaces/`, module `dto/` | `app/page.tsx` (inline interfaces) |

