import express, { RequestHandler } from 'express';
import cors from 'cors';

import vibeScannerRouter from './modules/vibe-scan/vibe.route.js';
import songRouter from './modules/song/song.route.js';
import weatherTimeRouter from './modules/weather-time/weather-time.route.js';
import profileRouter from './modules/profile/profile.route.js';
import healthRouter from './modules/health/health.route.js';
import adminRouter from './modules/admin/admin.route.js';
import keepaliveRouter from './modules/keepalive/keepalive.route.js';
import authRouter from './modules/auth/auth.route.js';

import { createPublicLimiter } from './shared/middleware/rateLimiting.js';

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
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
let publicLimiter: RequestHandler | undefined;
app.use((req, res, next) => {
  publicLimiter ??= createPublicLimiter();
  publicLimiter(req, res, next);
});

// ─── Authentication ──────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Health & Admin Routes (Unmetered) ──────────────────
// These bypass standard rate limiting for monitoring
// app.use('/health', healthRouter);
// app.use('/admin', adminRouter);

// ─── Protected API Routes (rate limiters attached post-Redis init) ────
app.use('/api/vibe-scan', vibeScannerRouter);
app.use('/api/song', songRouter);
app.use('/api/weather-time', weatherTimeRouter);
app.use('/api/profile', profileRouter);
// Public keep-alive endpoint (root-level)
app.use('/', keepaliveRouter);

export default app;
