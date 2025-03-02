import { Redis } from '@upstash/redis';
import { logInfo, logError } from '../../../instrumentation';

/**
 * Initialize Redis client with environment variables
 * We use a singleton pattern to avoid creating multiple connections
 */
let redisClient: Redis | null = null;

/**
 * Get the Redis client instance
 * @returns Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    try {
      // First try to use the REST API (preferred for Next.js edge functions and API routes)
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        redisClient = new Redis({
          url: process.env.KV_REST_API_URL,
          token: process.env.KV_REST_API_TOKEN,
        });
        logInfo('Redis client initialized using REST API', { provider: 'upstash', type: 'rest' });
      } 
      // Fall back to Redis URL if REST API details aren't available
      else if (process.env.KV_URL) {
        redisClient = new Redis({
          url: process.env.KV_URL,
        });
        logInfo('Redis client initialized using Redis URL', { provider: 'upstash', type: 'redis' });
      } 
      else {
        throw new Error('Redis credentials not found in environment variables');
      }
    } catch (error) {
      logError('Failed to initialize Redis client', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
  
  return redisClient;
}

/**
 * Gracefully close the Redis connection if needed
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    // The @upstash/redis client doesn't require explicit closing
    redisClient = null;
    logInfo('Redis connection released', { provider: 'upstash' });
  }
}

/**
 * Key-Value store operations wrapper
 */
export const kv = {
  /**
   * Get a value by key
   * @param key The key to retrieve
   * @returns The value or null if not found
   */
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const client = getRedisClient();
      return await client.get<T>(key);
    } catch (error) {
      logError('Error getting value from Redis', { key, error });
      return null;
    }
  },
  
  /**
   * Set a value with a key
   * @param key The key to set
   * @param value The value to store
   * @param ttl Optional time-to-live in seconds
   * @returns true if successful
   */
  set: async <T>(key: string, value: T, ttl?: number): Promise<boolean> => {
    try {
      const client = getRedisClient();
      if (ttl) {
        await client.set(key, value, { ex: ttl });
      } else {
        await client.set(key, value);
      }
      return true;
    } catch (error) {
      logError('Error setting value in Redis', { key, error });
      return false;
    }
  },
  
  /**
   * Delete a key
   * @param key The key to delete
   * @returns true if successful
   */
  del: async (key: string): Promise<boolean> => {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      logError('Error deleting key from Redis', { key, error });
      return false;
    }
  },
  
  /**
   * Check if a key exists
   * @param key The key to check
   * @returns true if the key exists
   */
  exists: async (key: string): Promise<boolean> => {
    try {
      const client = getRedisClient();
      return (await client.exists(key)) === 1;
    } catch (error) {
      logError('Error checking if key exists in Redis', { key, error });
      return false;
    }
  },
  
  /**
   * Increment a counter
   * @param key The counter key
   * @param increment Amount to increment by (default: 1)
   * @returns The new value
   */
  incr: async (key: string, increment: number = 1): Promise<number> => {
    try {
      const client = getRedisClient();
      if (increment === 1) {
        return await client.incr(key);
      } else {
        return await client.incrby(key, increment);
      }
    } catch (error) {
      logError('Error incrementing counter in Redis', { key, increment, error });
      return 0;
    }
  },
  
  /**
   * Add an item to a list
   * @param key The list key
   * @param value The value to add
   * @returns List length after the operation
   */
  push: async <T>(key: string, value: T): Promise<number> => {
    try {
      const client = getRedisClient();
      return await client.rpush(key, value);
    } catch (error) {
      logError('Error pushing to list in Redis', { key, error });
      return 0;
    }
  },
  
  /**
   * Get items from a list
   * @param key The list key
   * @param start Start index (default: 0)
   * @param end End index (default: -1, meaning all elements)
   * @returns Array of items
   */
  getList: async <T>(key: string, start: number = 0, end: number = -1): Promise<T[]> => {
    try {
      const client = getRedisClient();
      return await client.lrange(key, start, end);
    } catch (error) {
      logError('Error getting list from Redis', { key, start, end, error });
      return [];
    }
  },
  
  /**
   * Set a hash field
   * @param key The hash key
   * @param field The field name
   * @param value The value to set
   * @returns true if successful
   */
  hset: async <T>(key: string, field: string, value: T): Promise<boolean> => {
    try {
      const client = getRedisClient();
      await client.hset(key, { [field]: value });
      return true;
    } catch (error) {
      logError('Error setting hash field in Redis', { key, field, error });
      return false;
    }
  },
  
  /**
   * Get a hash field
   * @param key The hash key
   * @param field The field name
   * @returns The field value or null if not found
   */
  hget: async <T>(key: string, field: string): Promise<T | null> => {
    try {
      const client = getRedisClient();
      return await client.hget(key, field);
    } catch (error) {
      logError('Error getting hash field from Redis', { key, field, error });
      return null;
    }
  },
  
  /**
   * Get all fields and values from a hash
   * @param key The hash key
   * @returns Object with all fields and values
   */
  hgetall: async <T extends Record<string, any>>(key: string): Promise<T | null> => {
    try {
      const client = getRedisClient();
      return await client.hgetall(key);
    } catch (error) {
      logError('Error getting all hash fields from Redis', { key, error });
      return null;
    }
  }
};