import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';

import vibeScannerRouter from './modules/vibe-scan/vibe.route.js';
import songRouter from './modules/song/song.route.js';
import weatherTimeRouter from './modules/weather-time/weather-time.route.js';
import profileRouter from './modules/profile/profile.route.js';

const app = express();

app.use(express.json());
app.use(cors({ origin: '*' })); 
app.use(clerkMiddleware());

app.use('/api/vibe-scan', vibeScannerRouter);
app.use('/api/song', songRouter);
app.use('/api/weather-time', weatherTimeRouter);
app.use('/api/profile', profileRouter);

export default app;