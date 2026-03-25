import { Router, Request, Response } from 'express';
import HealthController from './health.controller.js';

const router = Router();
const healthController = new HealthController();

/**
 * GET /health
 * Main health check endpoint
 * Returns uptime, environment, Redis status, rate limiter status, cache metrics
 */
router.get('/', (req: Request, res: Response) => healthController.check(req, res));

/**
 * GET /health/cache
 * Detailed cache health metrics
 * Returns hit rate, total hits/misses, Redis ping status
 */
router.get('/cache', (req: Request, res: Response) => healthController.cacheHealth(req, res));

export default router;
