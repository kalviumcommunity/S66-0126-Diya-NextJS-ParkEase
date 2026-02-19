import Redis from 'ioredis';

/**
 * Redis Client Singleton
 * Prevents multiple connections in development due to hot reloading
 */

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

let redis: Redis;

if (!globalForRedis.redis) {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  // Handle connection events
  redis.on('connect', () => {
    console.log('✓ Redis connected successfully');
  });

  redis.on('error', (error) => {
    console.error('Redis connection error:', error.message);
  });

  redis.on('close', () => {
    console.log('Redis connection closed');
  });

  // Connect to Redis
  redis.connect().catch((error) => {
    console.error('Failed to connect to Redis:', error.message);
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
  }
} else {
  redis = globalForRedis.redis;
}

export { redis };

/**
 * Cache utility function - Get from cache or set with fetch function
 *
 * @param key - Cache key
 * @param fetchFunction - Async function to fetch data if not in cache
 * @param ttl - Time to live in seconds (default: 60)
 * @returns Cached or fetched data
 */
export async function getOrSetCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number = 60
): Promise<T> {
  try {
    // Try to get from cache
    const cached = await redis.get(key);

    if (cached) {
      console.log(`Cache HIT: ${key}`);
      return JSON.parse(cached) as T;
    }

    console.log(`Cache MISS: ${key}`);

    // Fetch fresh data
    const data = await fetchFunction();

    // Store in cache with TTL
    await redis.setex(key, ttl, JSON.stringify(data));

    return data;
  } catch (error) {
    console.error('Cache error:', error);
    // If Redis fails, fall back to fetching directly
    return await fetchFunction();
  }
}

/**
 * Invalidate (delete) cache by key
 *
 * @param key - Cache key to delete
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
    console.log(`Cache invalidated: ${key}`);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Invalidate multiple cache keys matching a pattern
 *
 * @param pattern - Redis key pattern (e.g., 'slots:*')
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cache invalidated (${keys.length} keys): ${pattern}`);
    }
  } catch (error) {
    console.error('Cache pattern invalidation error:', error);
  }
}

/**
 * Check if Redis is connected
 */
export async function isRedisConnected(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
