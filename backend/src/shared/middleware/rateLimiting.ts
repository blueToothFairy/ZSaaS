import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../redis/redisClient.js';
import { Request, Response, Express } from 'express';
import ClerkRequest from '../types/ClerkRequest.js';

const sendRedisCommand = (command: string, ...args: string[]): Promise<number> => {
  const client = redisClient.client;
  if (!client) {
    throw new Error('Redis not initialized!');
  }
  return client.call(command, ...args) as Promise<number>;
};

/**
 * Distributed rate limiting middleware using Redis backend
 * Protects system from DDoS, spam, and accidental infinite loops
 */

/**
 * Fallback rate limiter (in-memory) for when Redis is unavailable
 */
const createMemoryLimiter = (options: any) => {
  return rateLimit({
    ...options,
    // Use default in-memory store
  });
};

/**
 * Create rate limiter with Redis if available, otherwise fallback to memory store
 */
const createRateLimiter = (options: any) => {
  const client = redisClient.client;
  
  if (!client) {
    console.warn('Redis not available, using in-memory rate limiter (not suitable for production)');
    return createMemoryLimiter(options);
  }

  return rateLimit({
    ...options,
    store: new RedisStore({
      sendCommand: sendRedisCommand,
      prefix: options.prefix,
    }),
  });
};

/**
 * Rate limiter for authenticated users
 * Limit: 20 requests per 15 minutes per userId
 */
export const createAuthenticatedLimiter = () => {
  return createRateLimiter({
    prefix: 'rl:auth:',
    
    // Key generation based on user ID
    keyGenerator: (req: Request) => {
      const clerkReq = req as ClerkRequest;
      return clerkReq.auth?.userId || req.ip || 'unknown';
    },
    
    // 20 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
    max: 20,
    
    // Standard headers
    standardHeaders: true,
    legacyHeaders: false,
    
    // Custom error response
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((req as any).rateLimit?.resetTime ? ((req as any).rateLimit.resetTime - Date.now()) / 1000 : 900),
      });
    },
    
    // Skip health check endpoints
    skip: (req: Request) => req.path === '/health' || req.path === '/health/cache',
  });
};

/**
 * Rate limiter for admin endpoints (stricter)
 * Limit: 10 requests per 1 minute per IP
 */
export const createAdminLimiter = () => {
  return createRateLimiter({
    prefix: 'rl:admin:',
    
    keyGenerator: (req: Request) => req.ip || 'unknown',
    
    // 10 requests per 1 minute
    windowMs: 1 * 60 * 1000,
    max: 10,
    
    standardHeaders: true,
    legacyHeaders: false,
    
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Admin rate limit exceeded',
        retryAfter: 60,
      });
    },
  });
};

/**
 * Rate limiter for public endpoints (high threshold)
 * Limit: 100 requests per 15 minutes per IP
 */
export const createPublicLimiter = () => {
  return createRateLimiter({
    prefix: 'rl:public:',
    
    keyGenerator: (req: Request) => req.ip || 'unknown',
    
    // 100 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
    max: 100,
    
    standardHeaders: true,
    legacyHeaders: false,
    
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: 900,
      });
    },
    
    skip: (req: Request) => req.path === '/health' || req.path === '/health/cache',
  });
};
