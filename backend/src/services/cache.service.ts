import redisClient from '../config/redis';
import { logger } from '../utils/logger';

export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
}

const DEFAULT_TTL = 300;
const DEFAULT_KEY_PREFIX = 'api';
const CACHE_TIMEOUT = 2000; // 2秒超时，避免阻塞

async function safeRedisCall<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Redis operation timeout')), CACHE_TIMEOUT);
    });
    return await Promise.race([operation(), timeoutPromise]);
  } catch (error) {
    logger.error('Redis operation failed:', error);
    return fallback;
  }
}

export async function get<T>(key: string): Promise<T | null> {
  return safeRedisCall(async () => {
    if (!redisClient || !redisClient.isOpen) {
      return null;
    }
    const data = await redisClient.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  }, null);
}

export async function set<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
  await safeRedisCall(async () => {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  }, undefined);
}

export async function del(key: string): Promise<void> {
  await safeRedisCall(async () => {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    await redisClient.del(key);
  }, undefined);
}

export async function delPattern(pattern: string): Promise<void> {
  await safeRedisCall(async () => {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }, undefined);
}

export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  return `${DEFAULT_KEY_PREFIX}:${prefix}:${sortedParams}`;
}

export async function invalidateCache(pattern: string): Promise<void> {
  await safeRedisCall(async () => {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    const keys = await redisClient.keys(`${DEFAULT_KEY_PREFIX}:${pattern}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
    }
  }, undefined);
}

export async function clearAllCache(): Promise<void> {
  await safeRedisCall(async () => {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    const keys = await redisClient.keys(`${DEFAULT_KEY_PREFIX}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cleared ${keys.length} cache entries`);
    }
  }, undefined);
}
