import { Request, Response } from 'express';
import { redisClient } from '../../shared/redis/redisClient.js';

/**
 * Health check controller for system observability
 * Provides unified status of all critical subsystems
 */
export default class HealthController {
  /**
   * Main health check endpoint
   * Returns overall system status and subsystem details
   */
  async check(req: Request, res: Response): Promise<void> {
    try {
      const uptime = process.uptime();
      const environment = process.env.NODE_ENV || 'development';

      // Check Redis status
      const redisHealthy = redisClient.isHealthy();
      const redisPing = redisHealthy ? await redisClient.ping() : false;
      
      // Get cache metrics
      const cacheMetrics = redisClient.getMetrics();

      res.status(200).json({
        success: true,
        uptime: Math.floor(uptime),
        environment,
        timestamp: new Date().toISOString(),
        redis: {
          status: redisHealthy ? 'ok' : 'disconnected',
          ping_ms: redisPing ? 'ok' : 'failed',
          cache_hit_rate: cacheMetrics.hitRate,
        },
        rate_limiter: {
          store: 'redis',
          status: redisHealthy ? 'ok' : 'degraded',
        },
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        success: false,
        error: 'Health check failed',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  }

  /**
   * Detailed cache health endpoint
   * Returns comprehensive cache metrics
   */
  async cacheHealth(req: Request, res: Response): Promise<void> {
    try {
      const redisHealthy = redisClient.isHealthy();
      const cacheMetrics = redisClient.getMetrics();
      const redisPing = redisHealthy ? await redisClient.ping() : false;

      res.status(200).json({
        success: true,
        status: redisHealthy ? 'ok' : 'disconnected',
        redis_ping: redisPing ? 'ok' : 'failed',
        hit_rate_tracked: cacheMetrics.hitRate,
        total_hits: cacheMetrics.hits,
        total_misses: cacheMetrics.misses,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Cache health check error:', error);
      res.status(503).json({
        success: false,
        error: 'Cache health check failed',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  }
}
