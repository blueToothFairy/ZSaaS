import { Request, Response, Router } from 'express';
import vibeController from './vibe.module.js';
import multer, { MulterError } from 'multer';
import AuthenticatedRequest from '../../shared/types/AuthenticatedRequest.js';
import { requireAccessToken } from '../../shared/middleware/requireAccessToken.js';
import { createAuthenticatedLimiter } from '../../shared/middleware/rateLimiting.js';

const vibeScannerRouter = Router();
vibeScannerRouter.use(requireAccessToken, createAuthenticatedLimiter());

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

vibeScannerRouter.post('/', (req: Request, res: Response, next) => {
  upload.single('file')(req, res, (error: unknown) => {
    if (error instanceof MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 10 MB)' : 'Invalid file upload' });
      return;
    }
    if (error) { next(error); return; }
    void vibeController.submit(req as AuthenticatedRequest, res);
  });
});

vibeScannerRouter.get('/jobs/:jobId', (req: Request, res: Response) => vibeController.getJob(req as AuthenticatedRequest, res));

export default vibeScannerRouter;
