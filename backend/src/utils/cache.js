import { query } from '../db/index.js';

/**
 * In-memory cache implementation
 * For production, consider using Redis
 */
class Cache {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  set(key, value, ttl = 300) {
    this.store.set(key, value);
    
    if (ttl > 0) {
      const expiresAt = Date.now() + (ttl * 1000);
      this.ttls.set(key, expiresAt);
      
      // Auto cleanup
      setTimeout(() => {
        this.delete(key);
      }, ttl * 1000);
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    // Check if expired
    if (this.ttls.has(key)) {
      const expiresAt = this.ttls.get(key);
      if (Date.now() > expiresAt) {
        this.delete(key);
        return null;
      }
    }
    
    return this.store.has(key) ? this.store.get(key) : null;
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.store.delete(key);
    this.ttls.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.store.clear();
    this.ttls.clear();
  }

  /**
   * Get or set pattern - fetch from cache or execute callback
   * @param {string} key - Cache key
   * @param {Function} callback - Function to execute if cache miss
   * @param {number} ttl - Time to live in seconds
   */
  async getOrSet(key, callback, ttl = 300) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    
    const value = await callback();
    this.set(key, value, ttl);
    return value;
  }
}

// Create singleton instance
export const cache = new Cache();

/**
 * Cache middleware for routes
 * @param {number} ttl - Time to live in seconds
 */
export function cacheMiddleware(ttl = 300) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query params
    const key = `route:${req.originalUrl || req.url}`;
    const cached = cache.get(key);

    if (cached) {
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (body) => {
      cache.set(key, body, ttl);
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Pattern to match cache keys
 */
export function invalidateCache(pattern) {
  const regex = new RegExp(pattern);
  const keys = Array.from(cache.store.keys());
  
  keys.forEach(key => {
    if (regex.test(key)) {
      cache.delete(key);
    }
  });
}

/**
 * Database query cache helper
 */
export async function cachedQuery(key, queryText, params, ttl = 300) {
  return cache.getOrSet(
    `query:${key}`,
    async () => {
      const result = await query(queryText, params);
      return result.rows;
    },
    ttl
  );
}
