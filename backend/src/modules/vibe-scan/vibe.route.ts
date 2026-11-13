import { Request, Response, Router } from 'express';
import vibeController from './vibe.module.js';
import multer from 'multer';
import AuthenticatedRequest from '../../shared/types/AuthenticatedRequest.js';
import { requireAccessToken } from '../../shared/middleware/requireAccessToken.js';
import { createAuthenticatedLimiter } from '../../shared/middleware/rateLimiting.js';

const vibeScannerRouter = Router();
vibeScannerRouter.use(requireAccessToken, createAuthenticatedLimiter());

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

vibeScannerRouter.post(
  "/",
  upload.single('file'),
  (req: Request, res: Response) => vibeController.getSongs(req as AuthenticatedRequest, res)
);

export default vibeScannerRouter;
