import { Request, Response } from 'express';
import { cacheService } from '../../shared/cache/cacheService.js';

/**
 * Admin controller for cache management operations
 * Protected by ADMIN_SECRET environment variable
 */
export default class AdminController {
  /**
   * Invalidate cache entries by pattern
   * Accepts key_pattern in the request body
   * Pattern supports wildcards: search:*, context:*, fallback:*
   */
  async invalidateCache(req: Request, res: Response): Promise<void> {
    try {
      const { key_pattern } = req.body;

      if (!key_pattern) {
        res.status(400).json({
          success: false,
          error: 'Missing key_pattern in request body',
        });
        return;
      }

      // Validate pattern format (prevent empty or invalid patterns)
      if (typeof key_pattern !== 'string' || key_pattern.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'key_pattern must be a non-empty string',
        });
        return;
      }

      const deletedCount = await cacheService.deleteCachePattern(key_pattern);

      res.status(200).json({
        success: true,
        data: {
          message: `Invalidated ${deletedCount} cache entries`,
          pattern: key_pattern,
          deletedCount,
        },
      });
    } catch (error) {
      console.error('Cache invalidation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to invalidate cache',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  }

  /**
   * Clear all cache (nuclear option)
   * Only use when database is corrupted or you need full reset
   */
  async clearAll(req: Request, res: Response): Promise<void> {
    try {
      await cacheService.clearAllCache();

      res.status(200).json({
        success: true,
        data: {
          message: 'All cache entries cleared',
        },
      });
    } catch (error) {
      console.error('Cache clear all error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  }
}
