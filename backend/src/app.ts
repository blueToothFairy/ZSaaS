import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';

import vibeScannerRouter from './modules/vibe-scan/vibe.route.js';

const app = express();

app.use(express.json());
app.use(cors()); 
app.use(clerkMiddleware());

app.use('/api/vibe-scan', vibeScannerRouter);

export default app;