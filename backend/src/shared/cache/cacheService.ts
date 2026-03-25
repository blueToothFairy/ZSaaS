import { redisClient } from '../redis/redisClient.js';

/**
 * Caching service for common VibeTune cache patterns
 * Implements structured caching with predefined TTLs
 */
export class CacheService {
  /**
   * Cache song search results from iTunes
   * Key: search:{query}
   * TTL: 6 hours (song data doesn't change frequently)
   */
  async cacheSongSearch(query: string, results: any): Promise<void> {
    await redisClient.set(`search:${query.toLowerCase()}`, results, 6 * 60 * 60);
  }

  /**
   * Retrieve cached song search results
   */
  async getCachedSongSearch(query: string): Promise<any | null> {
    return redisClient.get(`search:${query.toLowerCase()}`);
  }

  /**
   * Cache contextual vibe playlist based on weather + time of day
   * Key: context:{weather}:{timesession}
   * TTL: 30 minutes (weather and time change frequently)
   */
  async cacheContextualVibe(weather: string, timeSession: string, results: any): Promise<void> {
    const key = `context:${weather.toLowerCase()}:${timeSession.toLowerCase()}`;
    await redisClient.set(key, results, 30 * 60);
  }

  /**
   * Retrieve cached contextual vibe playlist
   */
  async getCachedContextualVibe(weather: string, timeSession: string): Promise<any | null> {
    const key = `context:${weather.toLowerCase()}:${timeSession.toLowerCase()}`;
    return redisClient.get(key);
  }

  /**
   * Cache fallback/default playlist for circuit breaker use
   * Key: fallback:default
   * TTL: 24 hours (stable, pre-curated playlist)
   */
  async cacheFallbackPlaylist(results: any): Promise<void> {
    await redisClient.set('fallback:default', results, 24 * 60 * 60);
  }

  /**
   * Retrieve cached fallback playlist (for when services are unavailable)
   */
  async getCachedFallbackPlaylist(): Promise<any | null> {
    return redisClient.get('fallback:default');
  }

  /**
   * Cache custom key with custom TTL
   * Useful for ephemeral caching of user-specific data
   */
  async setCacheCustom(key: string, value: any, ttlSeconds: number): Promise<void> {
    await redisClient.set(key, value, ttlSeconds);
  }

  /**
   * Retrieve custom cache entry
   */
  async getCacheCustom(key: string): Promise<any | null> {
    return redisClient.get(key);
  }

  /**
   * Delete cache entry
   */
  async deleteCacheEntry(key: string): Promise<void> {
    await redisClient.delete(key);
  }

  /**
   * Delete cache entries matching pattern
   * Used by admin cache invalidation endpoint
   */
  async deleteCachePattern(pattern: string): Promise<number> {
    return redisClient.deleteByPattern(pattern);
  }

  /**
   * Clear all cache entries for current environment
   */
  async clearAllCache(): Promise<void> {
    const env = process.env.NODE_ENV || 'development';
    const prefix = env === 'production' ? 'prod' : 'dev';
    await redisClient.deleteByPattern(`*`);
  }
}

export const cacheService = new CacheService();
