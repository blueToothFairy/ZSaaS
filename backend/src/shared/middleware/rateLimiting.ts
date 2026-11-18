import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { isIPv4, isIPv6 } from 'node:net';
import { redisClient } from '../redis/redisClient.js';
import { NextFunction, Request, Response, RequestHandler } from 'express';
import AuthenticatedRequest from '../types/AuthenticatedRequest.js';

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
  let limiter: RequestHandler | undefined;
  return (req: Request, res: Response, next: NextFunction) => {
    if (!limiter) {
      if (redisClient.client?.status !== 'ready') {
        console.warn('Redis not available, using in-memory rate limiter (not suitable for production)');
        limiter = createMemoryLimiter(options);
      } else {
        limiter = rateLimit({
          ...options,
          store: new RedisStore({ sendCommand: sendRedisCommand, prefix: options.prefix }),
        });
      }
    }
    limiter(req, res, next);
  };
};

const normalizedIpKey = (rawIp: string | undefined): string => {
  const ip = rawIp?.split('%')[0] || 'unknown';
  const mappedV4 = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mappedV4?.[1]) return `ipv4:${mappedV4[1]}`;
  if (isIPv4(ip)) return `ipv4:${ip}`;
  if (!isIPv6(ip)) return `unknown:${ip}`;

  let address = ip;
  const embeddedV4 = address.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (embeddedV4?.[1]) {
    const octets = embeddedV4[1].split('.').map(Number);
    if (octets.length === 4 && octets.every((octet) => octet >= 0 && octet <= 255)) {
      const high = ((octets[0] ?? 0) << 8) | (octets[1] ?? 0);
      const low = ((octets[2] ?? 0) << 8) | (octets[3] ?? 0);
      address = address.replace(embeddedV4[1], `${high.toString(16)}:${low.toString(16)}`);
    }
  }
  const halves = address.split('::');
  const left = (halves[0] || '').split(':').filter(Boolean);
  const right = (halves[1] || '').split(':').filter(Boolean);
  const missing = 8 - left.length - right.length;
  const groups = halves.length === 1 ? left : [...left, ...Array(Math.max(0, missing)).fill('0'), ...right];
  if (groups.length !== 8 || groups.some((group) => !/^[\da-f]{1,4}$/i.test(group))) return `ipv6:${ip}`;
  return `ipv6-64:${groups.slice(0, 4).map((group) => Number.parseInt(group, 16).toString(16)).join(':')}`;
};

export const createAuthEndpointLimiter = (prefix: string, max: number, windowMs = 15 * 60 * 1000) => createRateLimiter({
  prefix,
  keyGenerator: (req: Request) => normalizedIpKey(req.ip),
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => res.status(429).json({ success: false, message: 'Too many authentication attempts.' }),
});

/**
 * Rate limiter for authenticated users
 * Limit: 20 requests per 15 minutes per userId
 */
export const createAuthenticatedLimiter = () => {
  return createRateLimiter({
    prefix: 'rl:auth:',
    
    // Key generation based on user ID
    keyGenerator: (req: Request) => {
      const authenticatedReq = req as AuthenticatedRequest;
      return authenticatedReq.userId || 'missing-user-id';
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
    
    keyGenerator: (req: Request) => normalizedIpKey(req.ip),
    
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
    
    keyGenerator: (req: Request) => normalizedIpKey(req.ip),
    
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
