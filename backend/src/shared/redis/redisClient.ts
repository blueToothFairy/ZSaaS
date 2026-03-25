import * as Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/** 
 * Singleton Redis client for Upstash
 * Key prefix strategy prevents collisions on single free-tier database
 */
class RedisClient {
  private static instance: RedisClient;
  client: Redis.Redis | null = null;
  private isConnected = false;
  private cacheMetrics = {
    hits: 0,
    misses: 0,
  };

  private constructor() {}

  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * Initialize Redis connection from environment variable
   */
  async initialize(): Promise<void> {
    if (this.isConnected) return;

    try {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        console.warn('Redis credentials not found. Caching disabled.');
        this.isConnected = false;
        return;
      }
      // Parse URL and force database to 0 (Upstash limitation)
      const urlObj = new URL(redisUrl);
      urlObj.pathname = '/0'; // Force database 0 for Upstash compatibility

      this.client = new Redis.Redis(
        urlObj.toString()
      );

      // Suppress unhandled error events
      this.client.on('error', (err) => {
        // Silently handle errors - Redis is optional during development
      });

      // Test connection
      await this.client.ping();
      this.isConnected = true;
      console.log('Redis connection established');
    } catch (error) {
      console.error('Redis initialization failed:', error instanceof Error ? error.message : error);
      this.isConnected = false;
    }
  }

  /**
   * Get environment-prefixed key
   * Prevents collisions on shared free-tier database
   */
  private getPrefixedKey(key: string): string {
    const env = process.env.NODE_ENV || 'development';
    return `${env === 'production' ? 'prod' : 'dev'}:vibetune:${key}`;
  }

  /**
   * Get value from cache
   * Tracks hit/miss metrics
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      const value = await this.client.get(prefixedKey);

      if (value) {
        this.cacheMetrics.hits++;
        console.log(`CACHE_HIT: ${key}`);
        return value as any;
      } else {
        this.cacheMetrics.misses++;
        console.log(`CACHE_MISS: ${key}`);
        return null;
      }
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error instanceof Error ? error.message : error);
      return null; // Graceful degradation
    }
  }

  /**
   * Set value in cache with TTL in seconds
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      await this.client.set(prefixedKey, JSON.stringify(value), "EX", ttlSeconds);
      console.log(`CACHE_SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error instanceof Error ? error.message : error);
      // Graceful degradation - don't crash
    }
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      await this.client.del(prefixedKey);
      console.log(`CACHE_DELETE: ${key}`);
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error instanceof Error ? error.message : error);
    }
  }

  /**
   * Delete keys matching pattern via SCAN + DEL
   * WARNING: This can be slow on large databases
   */
  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const prefixedPattern = this.getPrefixedKey(pattern);
      const keys = await this.client.keys(prefixedPattern);
      
      if (keys.length === 0) {
        console.log(`No keys matched pattern: ${pattern}`);
        return 0;
      }

      // Delete in batches to avoid overwhelming Redis
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await Promise.all(batch.map(key => this.client!.del(key)));
      }

      console.log(`CACHE_DELETE_PATTERN: Deleted ${keys.length} keys matching ${pattern}`);
      return keys.length;
    } catch (error) {
      console.error(`Redis pattern delete error:`, error instanceof Error ? error.message : error);
      return 0;
    }
  }

  /**
   * Check Redis connection status with ping
   */
  async ping(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const startTime = Date.now();
      await this.client.ping();
      const latency = Date.now() - startTime;
      console.log(`Redis PING: ${latency}ms`);
      return true;
    } catch (error) {
      console.error('Redis PING failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * Get cache hit rate percentage
   * Based on last 100 operations
   */
  getHitRate(): string {
    const total = this.cacheMetrics.hits + this.cacheMetrics.misses;
    if (total === 0) return 'N/A';
    const percentage = Math.round((this.cacheMetrics.hits / total) * 100);
    return `${percentage}%`;
  }

  /**
   * Get current connection status
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Get cache metrics
   */
  getMetrics() {
    return {
      hits: this.cacheMetrics.hits,
      misses: this.cacheMetrics.misses,
      hitRate: this.getHitRate(),
    };
  }
}

export const redisClient = RedisClient.getInstance();
