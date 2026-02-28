# VibeTune

<div align="center">

🎵 **AI-Powered Music Discovery Matching Your Mood, Weather & Vibe**

[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/Node.js-≥18.0.0-green?logo=node.js)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/Python-≥3.9-blue?logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178c6?logo=typescript)](https://www.typescriptlang.org/)
![Status](https://img.shields.io/badge/Status-Active%20Development-blue)
![Last Updated](https://img.shields.io/badge/Last%20Updated-February%202026-orange)

[Live Demo](#) | [Report Bug](#contributing) | [Request Feature](#contributing)

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

**VibeTune** is a modern SaaS music discovery platform that leverages artificial intelligence to generate personalized playlists based on your environment, mood, and visual aesthetics. 

### The Problem

Music discovery is fragmented. Existing platforms rely on popularity metrics, historical listening patterns, or generic genre classifications. They miss the context of *now*—your current mood, the weather outside, the aesthetic of a photo you just took.

### The Solution

VibeTune combines three intelligence layers:

1. **AI Vision Intelligence** – Upload an image and our CLIP-powered AI extracts color palettes, mood, and energy to suggest perfectly matched tracks
2. **Environmental Awareness** – Real-time weather integration shapes your playlist from rainy lo-fi to sunny indie vibes
3. **Taste Learning** – The more you interact, the sharper the recommendations become

### Target Users

- **Music enthusiasts** who want discovery beyond algorithmic feeds
- **Creatives** (photographers, designers, content creators) seeking aesthetic-driven soundtracks
- **Mood-driven listeners** who want music that matches their current environment
- **SaaS developers** exploring AI/ML integration patterns

### Demo Screenshot / GIF

> *[Placeholder: Insert screenshot showing the home page with hero image, feature cards, and call-to-action button. Consider including a gif showing the image upload flow and playlist generation.]*

---

## Features

### 🎨 Core Features

- **AI-Powered Image Analysis**
  - Upload any image (JPG, PNG, WebP)
  - CLIP vision models extract mood, color palette, and energy
  - Automatic matching to iTunes database for instant playlists
  - Support for images up to 10MB

- **Weather-Based Recommendations**
  - Real-time weather data integration
  - Dynamic playlist curation: rainy day → lo-fi, sunny → upbeat
  - Location-aware features
  - Time-of-day context awareness

- **Music Search & Integration**
  - Direct iTunes API integration
  - High-precision track metadata fetching
  - Multi-artist and multi-track results
  - Album artwork and preview links

- **User Authentication & Personalization**
  - Secure authentication via Clerk
  - User history tracking and playback analytics
  - Personalized recommendation feeds
  - Saved playlists and favorites

- **Smart Curation**
  - Machine learning-based taste refinement
  - Blends user history with contextual data
  - Adaptive weighting: mood > history > popularity
  - Genre + mood hybrid recommendations

- **Responsive UI**
  - Mobile-first design with Tailwind CSS
  - React-based interactive components
  - Micro-animations and motion design
  - Accessibility-focused (WCAG 2.1)

### 🛠 Technical Features

- **Scalable Microservices Architecture**
  - Separated frontend, backend, and AI services
  - Independent deployment pipelines
  - Container-ready with Docker support

- **Enterprise-Grade Security**
  - Clerk authentication with OAuth support
  - CORS protection
  - File type and size validation
  - SQL injection prevention (Knex.js parameterized queries)

- **High-Performance AI Inference**
  - ONNX-optimized CLIP models
  - CPU-efficient inference
  - Sub-second response times
  - Memory-optimized preprocessing

- **Database & Caching**
  - PostgreSQL for persistent storage
  - Knex.js query builder for type-safe SQL
  - Support for future caching layers (Redis)

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
| **Authentication** | Clerk | 6.36+ |
| **HTTP Client** | Axios | 1.13+ |
| **Image Processing** | Browser-Image-Compression | 2.0+ |
| **Database Client** | Supabase JS | 2.90+ |

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | 18+ |
| **Framework** | Express.js | 5.2+ |
| **Language** | TypeScript | 5.9+ |
| **Auth Middleware** | Clerk Express | 1.7+ |
| **Database** | PostgreSQL | 12+ |
| **Query Builder** | Knex.js | 3.1+ |
| **File Upload** | Multer | 2.0+ |
| **HTTP Client** | Axios | 1.13+ |
| **CORS** | cors package | 2.8+ |
| **Build Tool** | tsx | 4.21+ |

### AI/ML Service

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | FastAPI | Latest |
| **Server** | Uvicorn | Latest |
| **Vision Model** | OpenAI CLIP (ONNX) | vit-base-patch32 |
| **ML Runtime** | ONNX Runtime | Latest |
| **Image Processing** | Pillow | Latest |
| **Numerical** | NumPy | Latest |
| **Preprocessing** | Transformers (HuggingFace) | Latest |

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
| **Python** | ≥3.9 | AI/ML service |
| **PostgreSQL** | ≥12 | Database |
| **Docker** | ≥20.10 | (Optional) Container support |
| **Git** | Latest | Version control |

### Account Prerequisites

- **Clerk Account** – Register at [clerk.com](https://clerk.com) for authentication
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
git clone https://github.com/yourusername/vibetune.git
cd vibetune
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

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

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
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home

# Supabase (Optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Google AI (Gemini)
NEXT_PUBLIC_GOOGLE_AI_KEY=your_google_ai_key
```

**AI Service** – `AI_CLIP/.env` (if needed)

```env
MODEL_PATH=clip_vision_512.onnx
TEXT_EMB_PATH=vibe_embeddings.npy
KEYWORDS_PATH=vibe_keywords.npy
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
python -m uvicorn main:app --reload --port 8000
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
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
      AI_SERVICE_URL: http://ai-service:8000
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
      - "8000:8000"
    environment:
      LOG_LEVEL: INFO
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/docs"]
      interval: 10s
      timeout: 5s
      retries: 5

  frontend:
    build:
      context: ./saas-platform
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${CLERK_PUBLISHABLE_KEY}
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
  -e CLERK_SECRET_KEY=your_key \
  vibetune-backend
```

**AI Service:**
```bash
cd AI_CLIP
docker build -t vibetune-ai .
docker run -p 8000:8000 vibetune-ai
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
| `CLERK_SECRET_KEY` | string | **Yes** | N/A | sk_test_xxxxx | Clerk authentication secret |
| `CLERK_PUBLISHABLE_KEY` | string | **Yes** | N/A | pk_test_xxxxx | Clerk public key |
| `AI_SERVICE_URL` | string | **Yes** | N/A | http://localhost:8000 | AI service endpoint |
| `AI_SERVICE_TIMEOUT` | number | No | 30000 | 30000 | AI API timeout (ms) |
| `ITUNES_API_URL` | string | No | https://itunes.apple.com/search | (as shown) | iTunes search endpoint |
| `WEATHER_API_KEY` | string | No | N/A | your_key | OpenWeatherMap API key |
| `WEATHER_API_URL` | string | No | https://api.openweathermap.org/data/2.5 | (as shown) | Weather API endpoint |
| `FRONTEND_URL` | string | No | http://localhost:3000 | (as shown) | Frontend origin for CORS |

#### Frontend Environment Variables

| Variable | Type | Required | Default | Example | Description |
|----------|------|----------|---------|---------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | string | **Yes** | N/A | pk_test_xxxxx | Public Clerk key (exposed to client) |
| `CLERK_SECRET_KEY` | string | **Yes** | N/A | sk_test_xxxxx | Clerk secret (server-side only) |
| `NEXT_PUBLIC_API_URL` | string | **Yes** | N/A | http://localhost:5000 | Backend API base URL |
| `NEXT_PUBLIC_APP_URL` | string | No | http://localhost:3000 | (as shown) | Frontend app URL |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | string | No | /sign-in | (as shown) | Sign-in page route |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | string | No | /sign-up | (as shown) | Sign-up page route |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | string | No | /home | (as shown) | Redirect after sign-in |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | string | No | /home | (as shown) | Redirect after sign-up |
| `NEXT_PUBLIC_SUPABASE_URL` | string | No | N/A | https://your.supabase.co | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string | No | N/A | eyJxxx... | Supabase anon key |
| `NEXT_PUBLIC_GOOGLE_AI_KEY` | string | No | N/A | AIzaSyD... | Google AI (Gemini) API key |

#### AI Service Environment Variables

| Variable | Type | Required | Default | Example | Description |
|----------|------|----------|---------|---------|-------------|
| `MODEL_PATH` | string | No | clip_vision_512.onnx | (as shown) | Path to CLIP ONNX model |
| `TEXT_EMB_PATH` | string | No | vibe_embeddings.npy | (as shown) | Path to text embeddings cache |
| `KEYWORDS_PATH` | string | No | vibe_keywords.npy | (as shown) | Path to mood keyword mappings |
| `LOG_LEVEL` | string | No | INFO | DEBUG, INFO, WARNING | Logging verbosity |

---

## Usage & Examples

### User Workflows

#### Workflow 1: AI Vibe-Based Playlist Generation

1. **Sign in** to VibeTune using Clerk authentication
2. **Navigate** to "AI Vibe" or "Scan" section
3. **Upload an image** (JPG, PNG, or WebP, max 10MB)
4. **Wait** for AI analysis (typically 1-3 seconds)
5. **Receive playlist** with 20-30 matched songs from iTunes
6. **Play directly** or share on social media

**Screenshots / Steps:**
```
Sign In Page 
    ↓
Home Page (feat. hero, features, CTA)
    ↓
AI Upload Page (drag & drop or click)
    ↓
Loading State (spinner + progress text)
    ↓
Playlist Results (song cards with artwork, artist, album)
```

#### Workflow 2: Weather-Driven Recommendations

1. **Access Dashboard**
2. **Enable location** permissions
3. **View "Today's Vibe"** widget showing current weather
4. **Auto-generated playlist** based on weather conditions:
   - ☔ **Rainy** → Lo-fi, chillhop, indie folk
   - ☀️ **Sunny** → Upbeat, indie pop, electronic
   - 🌙 **Night** → Ambient, R&B, downtempo
5. **Refresh** periodically as weather changes

#### Workflow 3: Discover Based on Music Search

1. **Search for artist/song** via iTunes integration
2. **Get results** with album artwork and preview
3. **Click "Find Similar Vibes"** to expand playlist
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

**File: `AI_CLIP/main.py` (pseudo-code)**

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
  -H "Authorization: Bearer <CLERK_TOKEN>" \
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

All endpoints marked with 🔒 require Clerk authentication:

```bash
Authorization: Bearer <CLERK_TOKEN>
```

Obtain the token from Clerk's `useUser()` hook in React or via Clerk's `getToken()` method.

### Endpoints

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
| **Auth Required** | ✅ Yes (Clerk) |
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
    'Authorization': `Bearer ${clerkToken}`
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
  "details": "Missing or invalid Clerk token"
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
│       │   ├── layout.tsx          # Root layout (Clerk provider, metadata)
│       │   ├── page.tsx            # Home page (landing/hero)
│       │   ├── globals.css         # Global styles
│       │   │
│       │   ├── home/
│       │   │   └── page.tsx        # Main dashboard page
│       │   │
│       │   ├── sign-in/
│       │   │   └── [[...sign-in]]/
│       │   │       └── page.tsx    # Clerk sign-in page
│       │   │
│       │   ├── sign-up/
│       │   │   └── [[...sign-up]]/
│       │   │       └── page.tsx    # Clerk sign-up page
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
│               └── ClerkRequest.ts  # Extended Express Request w/ Clerk
│
├── AI_CLIP/                         # 🤖 AI/ML Service (Python + FastAPI)
│   ├── package.json                 # (Python equivalent: requirements.txt)
│   ├── requirements.txt              # Python dependencies
│   ├── Dockerfile                   # Container build for Python
│   │
│   ├── main.py                      # FastAPI app (extract-vibes endpoint)
│   ├── pipeline.ipynb               # Jupyter notebook (dev/experimentation)
│   ├── flow.txt                     # Pipeline flow documentation
│   │
│   ├── clip_vision_512.onnx         # CLIP vision model (ONNX format)
│   ├── clip_vision_quant.onnx       # Quantized CLIP model (lightweight)
│   ├── clip_vision.onnx             # Full CLIP vision model
│   │
│   ├── vibe_embeddings.npy          # Pre-computed mood embeddings (N×512)
│   ├── vibe_keywords.npy            # Mood keyword labels (N,)
│   │
│   ├── README.md                    # AI service documentation
│   └── __pycache__/                 # Python bytecode (ignored by git)
```

### Directory Purpose Guide

| Directory | Purpose | Responsibility |
|-----------|---------|-----------------|
| **saas-platform** | React-based user interface | UI/UX, client-side logic, Clerk integration |
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

## Contributing

### How to Contribute

We welcome contributions from developers of all skill levels! Here's how to get involved:

#### 1. Fork the Repository

```bash
# Navigate to the project on GitHub and click "Fork"
# Then clone your fork locally
git clone https://github.com/your-username/vibetune.git
cd vibetune
```

#### 2. Create a Feature Branch

Use conventional branch naming:

```bash
# Feature branches
git checkout -b feature/add-playlist-sharing

# Bug fix branches
git checkout -b fix/image-upload-timeout

# Documentation branches
git checkout -b docs/api-endpoints

# Branch naming convention: type/short-description
# Types: feature, fix, docs, refactor, test, ci
```

#### 3. Make Your Changes

Follow the code style and guidelines (see below).

#### 4. Commit with Conventional Commits

Use the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
git add .

# Format: type(scope): description
# Examples:
git commit -m "feat(backend): add user playlist endpoint"
git commit -m "fix(frontend): resolve image upload validation"
git commit -m "docs(readme): update installation steps"
git commit -m "refactor(ai): optimize CLIP model loading"
git commit -m "test(api): add endpoint integration tests"

# Commit types:
# feat: new feature
# fix: bug fix
# docs: documentation only
# refactor: code restructuring
# perf: performance improvement
# test: adding/updating tests
# ci: CI/CD configuration
# chore: dependency updates, formatting
```

#### 5. Push to Your Fork

```bash
git push origin feature/add-playlist-sharing
```

#### 6. Create a Pull Request

- Navigate to the original repo on GitHub
- Click "New Pull Request"
- Compare your fork's branch to `main`
- Fill out the PR template:

**Pull Request Template:**
```markdown
## Description
[Brief description of what this PR does]

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Related Issues
Closes #123

## Testing
[How to test these changes]

## Screenshots (if applicable)
[Include before/after screenshots]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex sections
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

---

### Code Style Guidelines

#### TypeScript/JavaScript

```typescript
// ✅ Good: clear naming, proper typing
async function extractVibesFromImage(
  imageBuffer: Buffer,
  userId: string
): Promise<SongRecommendation[]> {
  const vibes = await analyzeImage(imageBuffer);
  return matchVibeToSongs(vibes);
}

// ❌ Bad: unclear names, implicit types
async function process(buf, id) {
  const result = await analyze(buf);
  return match(result);
}
```

**Key Rules:**
- Use `const` by default, `let` if reassignment needed, avoid `var`
- Use explicit return types on functions
- Add JSDoc comments for public functions
- Use camelCase for variables/functions, PascalCase for classes
- Import ordering: external → internal → relative
- Add HTML closing comments for clarity
- Use template literals for string interpolation

#### Python

```python
# ✅ Good: type hints, docstrings
def extract_image_features(
    image_path: str,
    model_session: ort.InferenceSession
) -> np.ndarray:
    """
    Extract CLIP embeddings from an image.
    
    Args:
        image_path: Path to input image
        model_session: ONNX InferenceSession
        
    Returns:
        Normalized feature vector (512,)
    """
    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image, return_tensors="np")
    features = model_session.run(None, inputs)
    return features / np.linalg.norm(features)

# ❌ Bad: no types, unclear naming
def process_img(path, session):
    img = Image.open(path)
    result = session.run(None, img)
    return result
```

**Key Rules:**
- Use type hints for all function parameters and returns
- Write docstrings for all functions (Google/NumPy style)
- Use snake_case for variables/functions
- Use UPPER_CASE for constants
- Follow PEP 8 (use `black` for formatting)
- List dependencies in `requirements.txt`

#### CSS/Tailwind

```tsx
// ✅ Good: semantic, organized, responsive
<button className="
  px-4 py-2 
  bg-blue-600 hover:bg-blue-700 
  text-white font-semibold rounded-lg
  transition-colors duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
  focus:outline-none focus:ring-2 focus:ring-blue-500
">
  Click me
</button>

// ❌ Bad: unsorted, unreadable
<button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold">
```

**Key Rules:**
- Organize Tailwind classes: layout → space → sizing → color → effects → state
- Use responsive prefixes: `md:`, `lg:`, `dark:`
- Avoid arbitrary values when possible
- Extract repeated component styles to templates
- Use `@apply` for reusable utility groups

---

### Linting & Formatting

#### Frontend

```bash
cd saas-platform

# Run ESLint
npm run lint

# Fix issues automatically
npx eslint src --fix

# Format with Prettier
npx prettier --write src/**/*.{ts,tsx,css}
```

#### Backend

```bash
cd backend

# Run ESLint
npm run lint

# Fix issues
npx eslint src --fix
```

#### Python

```bash
cd AI_CLIP
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Format with Black
black .

# Lint with Flake8
flake8 .

# Type check with mypy
mypy main.py
```

---

### Reporting Bugs

Use GitHub Issues with this template:

```markdown
## Bug Description
[Clear, concise description of the bug]

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- OS: [Windows/macOS/Linux]
- Node Version: 18.x
- Python Version: 3.11
- Browser: Chrome/Firefox

## Screenshots/Logs
[Attach relevant screenshots or logs]

## Possible Solution
[Optional: your suggested fix]
```

---

### Requesting Features

Create a GitHub Issue with:

```markdown
## Feature Request
[Concise title and description]

## Problem Statement
[What problem does this solve?]

## Proposed Solution
[How should this work?]

## Alternatives Considered
[Other approaches?]

## Additional Context
[Screenshots, examples, user stories]
```

---

## License

This project is licensed under the **ISC License**.

### What This Means

The ISC License is a simple and permissive open-source license that allows you to:

✅ **Use** the software for any purpose (commercial or personal)  
✅ **Modify** the source code  
✅ **Distribute** the software (original or modified)  
✅ **Sublicense** the software  

⚠️ **Required:**
- Include a copy of the original license and copyright notice
- Provide a copy of the license with any distribution

❌ **Not Allowed:**
- Hold the authors liable for damages
- Remove or modify license notices

### Full License Text

```
ISC License

Copyright (c) 2026 VibeTune Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## Appendix: Troubleshooting

### Common Issues

#### Issue: Database Connection Refused

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# 1. Check if PostgreSQL is running
pg_isready  # Should return "accepting connections"

# 2. Verify connection string
echo $DATABASE_URL

# 3. Create database if missing
createdb vibetune_db

# 4. Restart PostgreSQL
# Windows (in PowerShell as Admin):
Restart-Service postgresql

# macOS:
brew services restart postgresql

# Linux:
sudo systemctl restart postgresql
```

---

#### Issue: AI Service Timeout

**Error:**
```
502 Bad Gateway: AI service unavailable
```

**Solution:**
```bash
# 1. Check if AI service is running on port 8000
curl http://localhost:8000/docs

# 2. Restart AI service
cd AI_CLIP
python -m uvicorn main:app --reload

# 3. Check memory usage (ONNX models are large)
# Windows:
Get-Process | Where-Object {$_.Name -eq "python"} | Select-Object WorkingSet64

# 4. Increase timeout in .env.local
AI_SERVICE_TIMEOUT=60000
```

---

#### Issue: Clerk Authentication Failing

**Error:**
```
401 Unauthorized: Invalid Clerk token
```

**Solution:**
```typescript
// 1. Verify Clerk keys in .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

// 2. Clear browser cookies and sign in again
// 3. Verify token is being sent in Authorization header
const token = await clerkClient.sessions.getToken();
console.log('Token:', token); // Should be a string, not null

// 4. Check Clerk dashboard for rate limits / blocks
```

---

### Support Resources

- **Documentation**: [VibeTune Docs](#) (to be created)
- **Issues**: [GitHub Issues](https://github.com/yourusername/vibetune/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/vibetune/discussions)
- **Email**: [contact@vibetune.com](#) (placeholder)

---

**Made by the VibeTune Community** 🎵

Last Updated: February 28, 2026  
Status: Active Development
