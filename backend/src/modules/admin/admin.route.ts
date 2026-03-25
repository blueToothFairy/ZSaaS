import { Router, Request, Response, NextFunction } from 'express';
import AdminController from './admin.controller.js';

const router = Router();
const adminController = new AdminController();

/**
 * Middleware to verify admin secret
 * Checks Authorization header for Bearer token matching ADMIN_SECRET
 */
const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    console.warn('ADMIN_SECRET not configured. Admin endpoints disabled.');
    res.status(503).json({
      success: false,
      error: 'Admin endpoints not available',
    });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || token !== adminSecret) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing admin token',
    });
    return;
  }

  next();
};

/**
 * POST /admin/cache/invalidate
 * Invalidate cache entries by pattern
 * 
 * Request body:
 * {
 *   "key_pattern": "search:*" | "context:*" | "fallback:default"
 * }
 */
router.post(
  '/cache/invalidate',
  adminAuthMiddleware,
  (req: Request, res: Response) => adminController.invalidateCache(req, res)
);

/**
 * POST /admin/cache/clear-all
 * Clear all cache entries (use with caution)
 */
router.post(
  '/cache/clear-all',
  adminAuthMiddleware,
  (req: Request, res: Response) => adminController.clearAll(req, res)
);

export default router;
