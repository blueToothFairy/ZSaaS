import { Request, Response, Router } from 'express';
import { requireAuth } from '@clerk/express';
import vibeController from './vibe.module.js';
import multer from 'multer';
import ClerkRequest from '../../shared/types/ClerkRequest.js';

const vibeScannerRouter = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

vibeScannerRouter.post(
  "/",
  requireAuth(),
  upload.single('file'),
  (req: Request, res: Response) => vibeController.getSongs(req as ClerkRequest, res)
);

vibeScannerRouter.get(
  "/today-vibe",
  (req: Request, res: Response) => vibeController.getTodayVibe(req, res)
);

export default vibeScannerRouter;