import express, { Express } from 'express';
import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';

import vibeScannerRouter from './modules/vibe-scan/vibe.route.js';
import songRouter from './modules/song/song.route.js';
import weatherTimeRouter from './modules/weather-time/weather-time.route.js';
import profileRouter from './modules/profile/profile.route.js';
import healthRouter from './modules/health/health.route.js';
import adminRouter from './modules/admin/admin.route.js';

import { createAuthenticatedLimiter, createPublicLimiter } from './shared/middleware/rateLimiting.js';

const app = express();

app.use(express.json());

// ─── CORS Configuration ──────────────────────────────────
// Restrict CORS to allowed origins (configurable via env)
// const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
// app.use(cors({
//   origin: allowedOrigins,
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));
app.use(cors()); // Allow all origins for now (adjust in production)

// ─── Authentication ──────────────────────────────────────
app.use(clerkMiddleware());

// ─── Health & Admin Routes (Unmetered) ──────────────────
// These bypass standard rate limiting for monitoring
// app.use('/health', healthRouter);
// app.use('/admin', adminRouter);

// ─── Protected API Routes (rate limiters attached post-Redis init) ────
app.use('/api/vibe-scan', vibeScannerRouter);
app.use('/api/song', songRouter);
app.use('/api/weather-time', weatherTimeRouter);
app.use('/api/profile', profileRouter);

/**
 * Attach rate limiters to API routes after Redis initialization
 * Must be called from server.ts after redisClient.initialize()
 */
export function attachRateLimiters(app: Express): void {
  // Apply public rate limiter to all routes (inserted before other middleware)
  app.use(createPublicLimiter());

  // Apply stricter rate limiting to authenticated endpoints
  app.use('/api/vibe-scan', createAuthenticatedLimiter());
  app.use('/api/song', createAuthenticatedLimiter());
  app.use('/api/weather-time', createAuthenticatedLimiter());
  app.use('/api/profile', createAuthenticatedLimiter());
}

export default app;