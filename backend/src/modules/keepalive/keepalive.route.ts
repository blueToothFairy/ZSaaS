import { Router, Request, Response } from 'express';
import KeepAliveController from './keepalive.controller.js';

const router = Router();
const keepAliveController = new KeepAliveController();

// Mount at /wake -> GET /wake
router.get('/wake', (req: Request, res: Response) => keepAliveController.wake(req, res));

export default router;
