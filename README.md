# VibeTune

<div align="center">

🎵 **AI Soundtrack Finder for Content Creators**

[![Node.js Version](https://img.shields.io/badge/Node.js-≥18.0.0-green?logo=node.js)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/Python-3.10-blue?logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178c6?logo=typescript)](https://www.typescriptlang.org/)
![Status](https://img.shields.io/badge/Status-Active%20Development-blue)
![Last Updated](https://img.shields.io/badge/Last%20Updated-February%202026-orange)

[Live Demo](https://vibetune-app-flame.vercel.app/)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
  - [Quick Start (Local Development)](#quick-start-local-development)
  - [Docker Setup](#docker-setup)
  - [Environment Variables](#environment-variables)
- [Usage & Examples](#usage--examples)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**VibeTune** is an AI Soundtrack Finder that helps content creators choose the right music for a specific piece of content — a photo, video, or creative project — so the soundtrack fits both the content itself and the feeling the creator wants to communicate.

### The Problem

Finding a soundtrack that truly fits a piece of content is hard. Existing music platforms are built for personal listening, not for content creation. They surface popular songs or tracks based on listening history, but they don't answer the question creators actually face: *which soundtrack will make this content feel the way I want?* Mood and weather alone aren't enough — the same image can call for completely different music depending on the creator's goal.

### The Solution

VibeTune leads with the creator's intent and combines it with visual understanding to recommend a focused list of suitable tracks, each with a clear reason why it fits.

1. **Content understanding** – Upload an image or other content reference and our CLIP-powered AI analyzes the visual content to extract mood, color palette, and energy.
2. **Musical intent** – You choose the intended mood, music style, energy, and vocal preference. Your choices are never overridden by AI assumptions.
3. **Music search** – VibeTune searches the iTunes catalog and returns a short list of suitable tracks with explanations, not an automatically generated playlist.
4. **Optional context** – Mood and weather can be added as supporting context, but they are not the product's main purpose.

### Target Users

- **Independent content creators**, especially people creating travel and lifestyle content for short-form platforms
- **Photographers and designers** looking for aesthetic-driven soundtracks
- **Anyone** who needs music that fits a specific photo, video, or creative project

### Demo Screenshot / GIF

<p align="center">
  <img src="./imgs/screenshot1.png" alt="screen1" width="660" />
  <img src="./imgs/screenshot2.png" alt="screen2" width="660" />
  <img src="./imgs/screenshot3.png" alt="screen3" width="660" />
  <img src="./imgs/screenshot4.png" alt="screen4" width="660" />
</p>

---

## Features

### 🎯 Core Workflow

VibeTune follows a focused flow to help creators find a soundtrack for their content:

1. **Add content** – Create a project and add an image or other content reference.
2. **Set musical intent** – Choose the intended mood, music style, energy, and vocal preference.
3. **Analyze** – VibeTune analyzes the visual content and combines it with your intent.
4. **Recommend** – Receive a short list of suitable tracks, each with a clear reason why it fits.
5. **Refine and save** – Adjust mood, energy, genre, or vocals without starting over, then save your chosen track to the project.

### Core Capabilities

- **AI image analysis** – CLIP vision models extract mood, color palette, and energy from an uploaded image to understand your content.
- **Music search** – Direct iTunes API integration for precise track metadata, album artwork, and preview links.
- **Intent-driven recommendations** – A focused list of suitable tracks with clear explanations, tailored to both the content and your musical intent. Mood and weather are optional context, not the product's main purpose.
- **Refinement** – Adjust mood, energy, genre, or vocal preference and re-run recommendations without starting over.
- **Save to project** – Select a track and save it to your project for later use.
- **User authentication** – First-party email/password and Google sign-in with JWT access tokens and rotating refresh sessions.

### Planned (not yet implemented)

The following capabilities are part of the product roadmap and are not yet part of the current implementation:

- **Video analysis** – Analyzing video content (beyond single images) for soundtrack matching.
- **Beat matching** – Synchronizing music beats with video cuts or transitions.
- **Advanced personalization** – Machine learning-based taste refinement that adapts to your history over time.
- **Licensed music catalog** – A fully licensed catalog of tracks for commercial use in content.
---

## Tech Stack

### Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Next.js | 15+ |
| **Rendering** | React Server Components + Client Components | 19+ |
| **Language** | TypeScript | 5.9+ |
| **Styling** | Tailwind CSS | Latest |
| **UI Components** | Shadcn/UI + Radix UI | Latest |
| **Motion** | Framer Motion (motion/react) | Latest |
| **Authentication** | First-party JWT and Google OAuth | Built-in |
| **HTTP Client** | Axios | 1.13+ |
| **Image Processing** | Browser-Image-Compression | 2.0+ |
| **Database Client** | Supabase JS | 2.90+ |

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | 18+ |
| **Framework** | Express.js | 5.2+ |
| **Language** | TypeScript | 5.9+ |
| **Auth Middleware** | First-party bearer-token middleware | Built-in |
| **Database** | PostgreSQL | 12+ |
| **Query Builder** | Knex.js | 3.1+ |
| **File Upload** | Multer | 2.0+ |
| **HTTP Client** | Axios | 1.13+ |
| **CORS** | cors package | 2.8+ |
| **Build Tool** | tsx | 4.21+ |

### AI/ML Service

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | FastAPI | 0.115.12 |
| **Server** | Uvicorn | 0.34.0 |
| **Vision Model** | OpenAI CLIP (ONNX) | vit-base-patch32 |
| **ML Runtime** | ONNX Runtime | 1.21.0 |
| **Image Processing** | Pillow | 11.1.0 |
| **Numerical** | NumPy | 1.26.4 |
| **Preprocessing** | Transformers (HuggingFace) | 4.49.0 |

### Infrastructure & Deployment

| Component | Technology |
|-----------|-----------|
| **Container** | Docker |
| **Frontend Hosting** | Vercel / AWS S3 + CloudFront |
| **Backend Hosting** | Render / Railway / AWS EC2 |
| **AI Service Hosting** | Hugging Face Spaces / Railway / AWS Lambda |
| **Database** | PostgreSQL (RDS, Railway, or self-hosted) |
| **Environment Management** | dotenv |

---

## Prerequisites

### System Requirements

- **OS**: Windows, macOS, or Linux
- **Disk Space**: Minimum 5GB (due to ML models)
- **RAM**: 8GB recommended (4GB minimum)

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | ≥18.0.0 | Backend & Frontend runtime |
| **npm** or **yarn** | ≥8.0.0 | Package management |
| **Python** | 3.10 | AI/ML service |
| **PostgreSQL** | ≥12 | Database |
| **Docker** | ≥20.10 | (Optional) Container support |
| **Git** | Latest | Version control |

### Account Prerequisites

- **Google OAuth Client** – Configure a Google OAuth client and callback URL for Google sign-in
- **iTunes Account** – (Optional, for advanced features)
- **Supabase Account** – (Optional) For managed PostgreSQL hosting

### Development Tools (Recommended)

- **VS Code** with TypeScript Extension Pack
- **Postman** or **Insomnia** for API testing
- **DBeaver** or **pgAdmin** for database management
- **Docker Desktop** for containerized development

---

## Installation & Setup

### Quick Start (Local Development)

#### Step 1: Clone the Repository

```bash
git clone https://github.com/blueToothFairy/ZSaaS.git
cd ZSaaS
```

#### Step 2: Install Dependencies

Install dependencies for all three services:

**Frontend:**
```bash
cd saas-platform
npm install
```

**Backend:**
```bash
cd ../backend
npm install
```

**AI Service:**
```bash
cd ../AI_CLIP
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
pip install -r requirements.txt
```

#### Step 3: Set Up Environment Variables

Create the following `.env.local` files in their respective directories:

**Backend** – `backend/.env.local`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/vibetune_db
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=vibetune_db
DB_PORT=5432

# First-party Authentication
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
JWT_ISSUER=vibetune-api
JWT_AUDIENCE=vibetune-app
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_DAYS=30
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# AI Service
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT=30000

# External APIs
ITUNES_API_URL=https://itunes.apple.com/search
WEATHER_API_KEY=your_weather_api_key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

# CORS
FRONTEND_URL=http://localhost:3000
```

**Frontend** – `saas-platform/.env.local`

```env
# Server
# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:5000
API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Google AI (Gemini)
NEXT_PUBLIC_GOOGLE_AI_KEY=your_google_ai_key
```

**AI Service** – `AI_CLIP/.env` (if needed)

```env
MODEL_PATH=assets/models/clip_vision_512.onnx
TEXT_EMB_PATH=assets/catalog/vibe_embeddings.npy
KEYWORDS_PATH=assets/catalog/vibe_keywords.npy
CLIP_PROCESSOR_PATH=assets/clip_processor
MAX_UPLOAD_BYTES=10485760
MAX_IMAGE_PIXELS=25000000
LOG_LEVEL=INFO
```

#### Step 4: Set Up Database

Create PostgreSQL database and run migrations:

```bash
# Create database
createdb vibetune_db

# Map environment variables (Windows)
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/vibetune_db"

# Run migrations if available
cd backend
npx knex migrate:latest
```

#### Step 5: Start Development Servers

Open three terminal windows and run each service:

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
# Starts on http://localhost:5000
```

**Terminal 2 – Frontend:**
```bash
cd saas-platform
npm run dev
# Starts on http://localhost:3000
```

**Terminal 3 – AI Service:**
```bash
cd AI_CLIP
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m uvicorn app.main:app --reload --port 8000
# Starts on http://localhost:8000
```

#### Step 6: Verify Installation

- Frontend: http://localhost:3000 (should load homepage)
- Backend: http://localhost:5000/api/vibe-scan/today-vibe (should return JSON)
- AI Service: http://localhost:8000/docs (FastAPI Swagger UI)

---

### Docker Setup

#### Using Docker Compose

Create a `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: vibetune_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/vibetune_db
      NODE_ENV: development
      JWT_SECRET: ${JWT_SECRET}
      JWT_ISSUER: vibetune-api
      JWT_AUDIENCE: vibetune-app
      ACCESS_TOKEN_TTL_SECONDS: 900
      REFRESH_TOKEN_TTL_DAYS: 30
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOOGLE_REDIRECT_URI: http://localhost:3000/api/auth/google/callback
      FRONTEND_URL: http://localhost:3000
      AI_SERVICE_URL: http://ai-service:7860
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src

  ai-service:
    build:
      context: ./AI_CLIP
      dockerfile: Dockerfile
    ports:
      - "8000:7860"
    environment:
      LOG_LEVEL: INFO
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:7860/ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 180s

  frontend:
    build:
      context: ./saas-platform
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000
      API_URL: http://backend:5000
    depends_on:
      - backend
      - ai-service

volumes:
  postgres_data:
```

#### Build and Run

```bash
# Build all services
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v
```

#### Individual Docker Builds

**Backend:**
```bash
cd backend
docker build -t vibetune-backend .
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/vibetune_db \
  -e JWT_SECRET=your_key \
  vibetune-backend
```

**AI Service:**
```bash
cd AI_CLIP
docker build -t vibetune-ai .
docker run -p 8000:7860 vibetune-ai
```

---

## Environment Variables

### Detailed Environment Variables Reference

#### Backend Environment Variables

| Variable | Type | Required | Default | Example | Description |
|----------|------|----------|---------|---------|-------------|
| `PORT` | number | No | 5000 | 5000 | Express server port |
| `NODE_ENV` | string | No | development | production | Environment mode (affects logging, CORS) |
| `DATABASE_URL` | string | **Yes** | N/A | postgresql://user:pass@localhost:5432/db | Full PostgreSQL connection string |
| `DB_HOST` | string | **Yes** | N/A | localhost | Database hostname |
| `DB_USER` | string | **Yes** | N/A | postgres | Database username |
| `DB_PASSWORD` | string | **Yes** | N/A | secure_pass | Database password |
| `DB_NAME` | string | **Yes** | N/A | vibetune_db | Database name |
| `DB_PORT` | number | No | 5432 | 5432 | Database port |
| `JWT_SECRET` | string | **Yes** | N/A | random 32+ char secret | JWT HMAC signing secret |
| `GOOGLE_CLIENT_ID` | string | For Google sign-in | N/A | OAuth client ID | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | string | For Google sign-in | N/A | OAuth secret | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | string | For Google sign-in | N/A | http://localhost:3000/api/auth/google/callback | OAuth callback via frontend proxy |
| `ACCESS_TOKEN_TTL_SECONDS` | number | No | 900 | 900 | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | number | No | 30 | 30 | Refresh session lifetime |
| `AI_SERVICE_URL` | string | **Yes** | N/A | http://localhost:8000 | AI service endpoint |
| `AI_SERVICE_TIMEOUT` | number | No | 30000 | 30000 | AI API timeout (ms) |
| `ITUNES_API_URL` | string | No | https://itunes.apple.com/search | (as shown) | iTunes search endpoint |
| `WEATHER_API_KEY` | string | No | N/A | your_key | OpenWeatherMap API key |
| `WEATHER_API_URL` | string | No | https://api.openweathermap.org/data/2.5 | (as shown) | Weather API endpoint |
| `FRONTEND_URL` | string | No | http://localhost:3000 | (as shown) | Frontend origin for CORS |

#### Frontend Environment Variables

| Variable | Type | Required | Default | Example | Description |
|----------|------|----------|---------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | string | **Yes** | N/A | http://localhost:5000 | Backend API base URL |
| `API_URL` | string | **Yes** | N/A | http://localhost:5000 | Next.js API rewrite destination |
| `NEXT_PUBLIC_APP_URL` | string | No | http://localhost:3000 | (as shown) | Frontend app URL |
| `NEXT_PUBLIC_SUPABASE_URL` | string | No | N/A | https://your.supabase.co | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string | No | N/A | eyJxxx... | Supabase anon key |
| `NEXT_PUBLIC_GOOGLE_AI_KEY` | string | No | N/A | AIzaSyD... | Google AI (Gemini) API key |

#### AI Service Environment Variables

| Variable | Type | Required | Default | Example | Description |
|----------|------|----------|---------|---------|-------------|
| `MODEL_PATH` | string | No | assets/models/clip_vision_512.onnx | (as shown) | Path to CLIP ONNX model |
| `TEXT_EMB_PATH` | string | No | assets/catalog/vibe_embeddings.npy | (as shown) | Path to text embeddings |
| `KEYWORDS_PATH` | string | No | assets/catalog/vibe_keywords.npy | (as shown) | Path to vibe keyword labels |
| `CLIP_PROCESSOR_PATH` | string | No | assets/clip_processor | (as shown) | Local CLIP preprocessing/tokenizer files |
| `MAX_UPLOAD_BYTES` | integer | No | 10485760 | (as shown) | Maximum image upload size in bytes |
| `MAX_IMAGE_PIXELS` | integer | No | 25000000 | (as shown) | Maximum image width multiplied by height |
| `LOG_LEVEL` | string | No | INFO | DEBUG, INFO, WARNING | Logging verbosity |

---

## Usage & Examples

### User Workflows

#### Workflow 1: Find a Soundtrack for Your Content

1. **Create a project** and add an image or other content reference (JPG, PNG, or WebP, max 10MB).
2. **Set musical intent** – choose the intended mood, music style, energy, and vocal preference.
3. **Analyze** – VibeTune analyzes the visual content and combines it with your intent.
4. **Get recommendations** – receive a short list of suitable tracks, each with a clear reason why it fits.
5. **Refine and save** – adjust mood, energy, genre, or vocals without starting over, then save your chosen track to the project.

**Screenshots / Steps:**
```
Create Project (add image)
    ↓
Set Musical Intent (mood, style, energy, vocals)
    ↓
Analysis (visual understanding + your intent)
    ↓
Recommendations (short track list with reasons)
    ↓
Refine & Save (adjust and pick a track)
```

#### Workflow 2: Add Weather or Mood as Optional Context

1. **Open your project** and start a soundtrack search.
2. **Add optional context** such as current weather or time of day if it helps shape the feeling you want.
3. **Get recommendations** that combine your content, intent, and optional context.
4. **Refine and save** the track that best fits your content.

Weather and mood are supporting context — they refine results but are not the product's main purpose.

#### Workflow 3: Discover Based on Music Search

1. **Search for artist/song** via iTunes integration
2. **Get results** with album artwork and preview
3. **Click "Find Similar Vibes"** to expand recommendations
4. **Save to favorites** and add to collections

### Code Examples

#### Example 1: Uploading an Image for Vibe Analysis (Frontend)

**File: `saas-platform/src/components/VibeUploader.tsx` (pseudo-code)**

```typescript
import { useState } from 'react';
import axios from 'axios';

export function VibeUploader() {
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState(null);

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vibe-scan`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000,
        }
      );

      setPlaylist(response.data.songs);
    } catch (error) {
      console.error('Vibe analysis failed:', error);
      // Show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
      />
      {loading && <p>Analyzing vibes...</p>}
      {playlist && <PlaylistDisplay songs={playlist} />}
    </div>
  );
}
```

#### Example 2: Backend Vibe Analysis Endpoint

**File: `backend/src/modules/vibe-scan/vibe.service.ts` (pseudo-code)**

```typescript
import axios from 'axios';

export default class VibeScannerService {
  async getVibeMatchingSongs(
    imageBuffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<Song[]> {
    // 1. Send image to Python AI service
    const aiResponse = await axios.post(
      `${process.env.AI_SERVICE_URL}/extract-vibes`,
      { imageBuffer },
      { timeout: 30000 }
    );

    const { vibes, keywords } = aiResponse.data;

    // 2. Search iTunes for matching tracks
    const songs = await this.searchItunes(keywords);

    // 3. Rank by similarity to extracted vibes
    const rankedSongs = this.rankByVibes(songs, vibes);

    return rankedSongs;
  }

  private async searchItunes(keywords: string[]): Promise<Song[]> {
    const allSongs = [];
    for (const keyword of keywords) {
      const response = await axios.get(
        'https://itunes.apple.com/search',
        {
          params: {
            term: keyword,
            entity: 'song',
            limit: 10,
          },
        }
      );
      allSongs.push(...response.data.results);
    }
    return allSongs;
  }

  private rankByVibes(songs: Song[], vibes: Record<string, number>): Song[] {
    // Implement ranking logic based on vibe scores
    return songs.sort((a, b) => b.vibeScore - a.vibeScore);
  }
}
```

#### Example 3: AI Image Analysis (Python)

**File: `AI_CLIP/app/api/routes.py` (simplified example)**

```python
from fastapi import FastAPI, UploadFile, File
import numpy as np
import onnxruntime as ort
from PIL import Image
import io

app = FastAPI()

@app.post("/extract-vibes")
async def extract_vibes(file: UploadFile = File(...)):
    """
    Extract mood/vibe embedding from an uploaded image.
    """
    # 1. Load image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    # 2. Process with CLIP vision encoder (ONNX)
    inputs = processor(images=image, return_tensors="np")
    image_features = session.run(None, {"pixel_values": inputs['pixel_values']})

    # 3. Normalize embeddings
    image_features = image_features / np.linalg.norm(image_features)

    # 4. Find top matching text embeddings (moods/vibes)
    similarities = np.dot(text_matrix, image_features.T).flatten()
    top_indices = np.argsort(similarities)[-10:][::-1]

    # 5. Return matching keywords
    matched_vibes = keywords[top_indices].tolist()

    return {
        "vibes": matched_vibes,
        "scores": similarities[top_indices].tolist()
    }
```

#### Example 4: Calling the API with cURL

**Get Today's Vibe (No Auth Required):**
```bash
curl -X GET http://localhost:5000/api/vibe-scan/today-vibe \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentVibe": "rainy_cozy",
    "weather": {
      "condition": "rainy",
      "temperature": 18,
      "humidity": 85
    },
    "recommendedGenres": ["lo-fi", "indie-folk", "jazz"],
    "topSongs": [
      {
        "name": "Float Along",
        "artist": "Mac Miller",
        "album": "Faces",
        "previewUrl": "https://audio.itunes.apple.com/..."
      }
    ]
  }
}
```

**Upload Image for Vibe Analysis (Auth Required):**
```bash
curl -X POST http://localhost:5000/api/vibe-scan \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "file=@/path/to/image.jpg"
```

**Response:**
```json
{
  "success": true,
  "songs": [
    {
      "trackId": 123456789,
      "trackName": "Sunset Dreams",
      "artistName": "The Wave",
      "collectionName": "Golden Hour",
      "artworkUrl100": "https://...",
      "previewUrl": "https://audio.itunes.apple.com/...",
      "trackPrice": 1.29,
      "trackViewUrl": "https://itunes.apple.com/..."
    }
  ]
}
```

---

## API Reference

### Base URL

```
http://localhost:5000/api
```

### Authentication

All endpoints marked with 🔒 require first-party authentication:

```bash
Authorization: Bearer <ACCESS_TOKEN>
```

The frontend restores access through `POST /api/auth/refresh` on startup. Refresh tokens are sent only as HttpOnly cookies.

Apply `backend/src/modules/auth/schema.sql` to PostgreSQL before starting the backend. The auth tables start empty; existing test accounts are not imported.

### Endpoints

#### Authentication Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create an email/password account |
| POST | `/auth/login` | Sign in with email/password |
| POST | `/auth/refresh` | Rotate the refresh cookie and restore an access token |
| POST | `/auth/logout` | Revoke the current refresh session |
| GET | `/auth/google` | Start Google sign-in |
| GET | `/auth/google/callback` | Complete Google sign-in or explicit linking |
| POST | `/auth/google/link/start` | Start explicit Google account linking (access token required) |
| POST | `/auth/password/link` | Add a password to the signed-in account |
| GET | `/auth/me` | Read the current user profile |

#### Vibe Scanning Endpoints

##### 1️⃣ Get Today's Vibe

**Endpoint:** `GET /vibe-scan/today-vibe`

| Field | Value |
|-------|-------|
| **Auth Required** | ❌ No |
| **Rate Limit** | 60 req/min |
| **Response Time** | ~500ms |

**Description:** Fetches the current vibe recommendation based on real-time weather and time of day.

**Request:**
```bash
GET /vibe-scan/today-vibe HTTP/1.1
Host: localhost:5000
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "currentVibe": "rainy_cozy",
    "weather": {
      "condition": "rainy",
      "temperature": 18,
      "humidity": 85,
      "location": "London, UK"
    },
    "recommendedGenres": ["lo-fi", "indie-folk", "jazz"],
    "timeOfDay": "evening",
    "topSongs": [
      {
        "trackId": 123456789,
        "trackName": "Float Along",
        "artistName": "Mac Miller",
        "previewUrl": "https://audio.itunes.apple.com/...",
        "artworkUrl": "https://..."
      }
    ],
    "refreshedAt": "2026-02-28T18:45:32Z"
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to get today's vibe",
  "details": "Weather API unavailable"
}
```

---

##### 2️⃣ Analyze Image & Generate Playlist 🔒

**Endpoint:** `POST /vibe-scan`

| Field | Value |
|-------|-------|
| **Auth Required** | ✅ Yes (JWT access token) |
| **Content-Type** | multipart/form-data |
| **Max File Size** | 10MB |
| **Rate Limit** | 30 req/min |
| **Response Time** | 1-5 seconds |

**Description:** Uploads an image, analyzes it with CLIP vision model, and returns matching songs from iTunes.

**Request:**
```bash
POST /vibe-scan HTTP/1.1
Host: localhost:5000
Authorization: Bearer sk_test_xxxxx
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="sunset.jpg"
Content-Type: image/jpeg

[binary image data]
------WebKitFormBoundary--
```

**JavaScript Example:**
```javascript
const formData = new FormData();
formData.append('file', imageFile); // File object from input

const response = await fetch('http://localhost:5000/api/vibe-scan', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const data = await response.json();
console.log(data.songs);
```

**Response (200 OK):**
```json
{
  "success": true,
  "songs": [
    {
      "trackId": 987654321,
      "trackName": "Golden Hour",
      "artistName": "HAIM",
      "collectionName": "Something to Tell You",
      "artworkUrl100": "https://is1-ssl.mzstatic.com/image/...",
      "artworkUrl600": "https://is1-ssl.mzstatic.com/image/...",
      "previewUrl": "https://audio.itunes.apple.com/...",
      "trackPrice": 1.29,
      "trackViewUrl": "https://itunes.apple.com/...",
      "releaseDate": "2018-04-20T12:00:00Z"
    },
    {
      "trackId": 987654322,
      "trackName": "Sunroof",
      "artistName": "Nicky Youre",
      "collectionName": "Sunroof",
      "artworkUrl100": "https://is1-ssl.mzstatic.com/image/...",
      "previewUrl": "https://audio.itunes.apple.com/...",
      "trackPrice": 1.29,
      "trackViewUrl": "https://itunes.apple.com/..."
    }
  ],
  "analysisMetadata": {
    "dominantMoods": ["warm", "energetic", "summer"],
    "colorPalette": ["#FFD700", "#FF8C00", "#FFA500"],
    "confidence": 0.92,
    "processingTime": 2341
  }
}
```

**Error Response (400 - Invalid File):**
```json
{
  "error": "Invalid file type",
  "details": "Allowed types: image/jpeg, image/png, image/webp"
}
```

**Error Response (401 - Unauthorized):**
```json
{
  "error": "Unauthorized",
  "details": "Missing or invalid access token"
}
```

**Error Response (502 - AI Service Down):**
```json
{
  "error": "Failed to extract vibes",
  "details": "AI service unavailable"
}
```

---

### Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error type",
  "details": "Human-readable description"
}
```

**Common Status Codes:**

| Code | Meaning | Cause |
|------|---------|-------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid file, missing params |
| 401 | Unauthorized | Missing/invalid auth token |
| 413 | Payload Too Large | File size exceeds 10MB |
| 500 | Internal Error | Server-side failure |
| 502 | Bad Gateway | AI service unreachable |
| 503 | Service Unavailable | Temporary outage |

---

### Rate Limiting

- **Anonymous requests** (GET /today-vibe): 60 req/min per IP
- **Authenticated requests** (POST /vibe-scan): 30 req/min per user
- **Excess requests**: Return 429 Too Many Requests

---

## Project Structure

### Root Directory

```
vibetune/
├── README.md                      # Project documentation
├── docker-compose.yml             # Multi-service container orchestration
├── .gitignore                     # Git ignore rules
│
├── saas-platform/                 # 📱 Frontend (Next.js SaaS)
│   ├── package.json               # Frontend dependencies & scripts
│   ├── tsconfig.json              # TypeScript configuration
│   ├── next.config.ts             # Next.js configuration
│   ├── tailwind.config.ts          # Tailwind CSS config
│   ├── postcss.config.mjs          # PostCSS plugins (for Tailwind)
│   ├── eslint.config.mjs           # ESLint rules
│   ├── next-env.d.ts              # Auto-generated Next.js types
│   │
│   ├── public/                    # Static assets (images, icons, fonts)
│   │   └── favicon.ico
│   │
│   └── src/
│       ├── proxy.ts                # API proxy configuration
│       │
│       ├── app/
│       │   ├── layout.tsx          # Root layout (auth provider, metadata)
│       │   ├── page.tsx            # Home page (landing/hero)
│       │   ├── globals.css         # Global styles
│       │   │
│       │   ├── home/
│       │   │   └── page.tsx        # Main dashboard page
│       │   │
│       │   ├── sign-in/
│       │   │   └── [[...sign-in]]/
│       │   │       └── page.tsx    # First-party sign-in page
│       │   │
│       │   ├── sign-up/
│       │   │   └── [[...sign-up]]/
│       │   │       └── page.tsx    # First-party sign-up page
│       │   │
│       │   └── components/
│       │       ├── figma/
│       │       │   └── ImageWithFallback.tsx  # Image component w/ fallback
│       │       │
│       │       └── ui/              # shadcn/ui component library
│       │           ├── accordion.tsx
│       │           ├── avatar.tsx
│       │           ├── badge.tsx
│       │           ├── button.tsx
│       │           ├── card.tsx
│       │           ├── dialog.tsx
│       │           ├── form.tsx
│       │           ├── input.tsx
│       │           └── ... (40+ components)
│       │
│       ├── lib/
│       │   └── utils/
│       │       ├── file-to-base64.ts        # File → Base64 conversion
│       │       ├── image-compressor.ts      # Image compression utility
│       │       └── pdf-parser.ts            # PDF parsing utility
│       │
│       └── styles/
│           ├── globals.css          # Global CSS resets
│           ├── index.css             # Utility/component styles
│           ├── tailwind.css          # Tailwind directives
│           └── theme.css             # Design tokens & colors
│
├── backend/                         # ⚙️ Backend (Express.js + TypeScript)
│   ├── package.json                 # Backend dependencies
│   ├── tsconfig.json                # TypeScript configuration
│   ├── Dockerfile                   # Container build instructions
│   │
│   └── src/
│       ├── server.ts                # Express server entry point
│       ├── app.ts                   # Express app initialization & routing
│       │
│       ├── modules/                 # Feature modules (DDD pattern)
│       │   │
│       │   ├── vibe-scan/           # 🎵 Core feature: AI vibe analysis
│       │   │   ├── vibe.controller.ts     # HTTP request handlers
│       │   │   ├── vibe.module.ts        # Module initialization (DI)
│       │   │   ├── vibe.route.ts         # Express route definitions
│       │   │   │
│       │   │   ├── dto/
│       │   │   │   └── ai-repo.ts        # Data Transfer Objects
│       │   │   │
│       │   │   ├── guards/
│       │   │   │   └── auth.guard.ts     # Authentication middleware (future)
│       │   │   │
│       │   │   ├── interfaces/
│       │   │   │   ├── ai-output-repo.interface.ts
│       │   │   │   ├── ai-scanner.interface.ts
│       │   │   │   ├── song-search.interface.ts
│       │   │   │   ├── weather-genre.interface.ts
│       │   │   │   └── weather.interface.ts
│       │   │   │
│       │   │   ├── repositories/
│       │   │   │   └── ai-outputs.knex.ts  # Knex queries (DB operations)
│       │   │   │
│       │   │   └── services/
│       │   │       ├── index.ts            # Service exports
│       │   │       ├── CLIP.service.ts     # CLIP AI integration
│       │   │       ├── itunes.search.service.ts  # iTunes API client
│       │   │       ├── weather-genre.service.ts  # Weather-to-genre mapping
│       │   │       └── weather.service.ts        # Weather API integration
│       │   │
│       │   └── tmp/                 # Placeholder for future modules
│       │       ├── dto/
│       │       ├── guards/
│       │       ├── interfaces/
│       │       ├── repositories/
│       │       └── services/
│       │
│       └── shared/
│           ├── db/
│           │   └── knexClient.ts    # Knex.js database connection
│           │
│           └── types/
│               └── AuthenticatedRequest.ts  # Extended request with internal user ID
│
├── AI_CLIP/                         # 🤖 AI/ML Service (Python + FastAPI)
│   ├── app/
│   │   ├── main.py                  # FastAPI app factory and lifespan
│   │   ├── api/routes.py            # Health and image-analysis endpoints
│   │   ├── core/                    # Settings and logging
│   │   └── services/clip.py         # ONNX model and inference logic
│   ├── assets/
│   │   ├── models/                  # ONNX model variants
│   │   ├── catalog/                 # Embeddings and keyword labels
│   │   └── clip_processor/          # Local processor files
│   ├── scripts/                     # Offline pipeline notes and experiments
│   ├── tests/                       # Unit and API tests
│   ├── requirements.txt             # Pinned runtime dependencies
│   ├── requirements-dev.txt         # Test dependencies
│   ├── Dockerfile                   # Hugging Face Spaces image (port 7860)
│   └── README.md                    # AI setup and deployment documentation
```

### Directory Purpose Guide

| Directory | Purpose | Responsibility |
|-----------|---------|-----------------|
| **saas-platform** | React-based user interface | UI/UX, client-side logic, first-party authentication |
| **backend** | REST API server | Business logic, database, external APIs, auth |
| **AI_CLIP** | Machine learning inference | Image analysis, vibe extraction, embeddings |
| **shared** | Cross-service utilities | Types, database clients, common interfaces |
| **modules** | DDD-style features | Organized by business domain (vibe-scan) |

### File Type Reference

| Extension | Tool | Purpose |
|-----------|------|---------|
| `.tsx` | React + TypeScript | React components (frontend) |
| `.ts` | TypeScript | Pure business logic |
| `.py` | Python | Machine learning & inference |
| `.onnx` | Deep Learning Model | Serialized neural network weights |
| `.npy` | NumPy | Binary numerical arrays (embeddings) |
| `.ipynb` | Jupyter | Interactive notebooks (dev environment) |

---

**Made by the VibeTune Community** 🎵

Last Updated: May 21, 2026  
Status: Active Development
