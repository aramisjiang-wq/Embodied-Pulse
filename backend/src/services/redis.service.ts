/**
 * Redis缓存服务
 * 提供统一的缓存接口和缓存策略
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;
let isConnected = false;

const CACHE_TTL = {
  SHORT: 60,        // 1分钟
  MEDIUM: 300,       // 5分钟
  LONG: 3600,        // 1小时
  VERY_LONG: 86400,  // 24小时
};

async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis重连失败，停止重连');
            return new Error('Redis重连失败');
          }
          const delay = Math.min(retries * 100, 3000);
          logger.warn(`Redis重连中... (${retries}/${10})`);
          return delay;
        },
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis错误:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis已连接');
      isConnected = true;
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis已断开');
      isConnected = false;
    });

    await redisClient.connect();
  }

  return redisClient;
}

export async function initRedis(): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.ping();
    logger.info('Redis初始化成功');
  } catch (error) {
    logger.error('Redis初始化失败:', error);
    isConnected = false;
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    logger.info('Redis连接已关闭');
  }
}

export function isRedisConnected(): boolean {
  return isConnected;
}

export async function get<T>(key: string): Promise<T | null> {
  try {
    if (!isRedisConnected()) {
      return null;
    }

    const client = await getRedisClient();
    const value = await client.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    logger.error(`Redis GET失败 [${key}]:`, error);
    return null;
  }
}

export async function set<T>(key: string, value: T, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const client = await getRedisClient();
    const serialized = JSON.stringify(value);
    await client.setEx(key, ttl, serialized);

    return true;
  } catch (error) {
    logger.error(`Redis SET失败 [${key}]:`, error);
    return false;
  }
}

export async function del(key: string): Promise<boolean> {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const client = await getRedisClient();
    await client.del(key);

    return true;
  } catch (error) {
    logger.error(`Redis DEL失败 [${key}]:`, error);
    return false;
  }
}

export async function delPattern(pattern: string): Promise<number> {
  try {
    if (!isRedisConnected()) {
      return 0;
    }

    const client = await getRedisClient();
    const keys = await client.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    await client.del(keys);
    return keys.length;
  } catch (error) {
    logger.error(`Redis DEL PATTERN失败 [${pattern}]:`, error);
    return 0;
  }
}

export async function exists(key: string): Promise<boolean> {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const client = await getRedisClient();
    const result = await client.exists(key);

    return result === 1;
  } catch (error) {
    logger.error(`Redis EXISTS失败 [${key}]:`, error);
    return false;
  }
}

export async function expire(key: string, ttl: number): Promise<boolean> {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const client = await getRedisClient();
    await client.expire(key, ttl);

    return true;
  } catch (error) {
    logger.error(`Redis EXPIRE失败 [${key}]:`, error);
    return false;
  }
}

export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  try {
    const cached = await get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await set(key, value, ttl);

    return value;
  } catch (error) {
    logger.error(`Redis GET_OR_SET失败 [${key}]:`, error);
    return fetcher();
  }
}

export async function incr(key: string): Promise<number> {
  try {
    if (!isRedisConnected()) {
      return 0;
    }

    const client = await getRedisClient();
    return await client.incr(key);
  } catch (error) {
    logger.error(`Redis INCR失败 [${key}]:`, error);
    return 0;
  }
}

export async function decr(key: string): Promise<number> {
  try {
    if (!isRedisConnected()) {
      return 0;
    }

    const client = await getRedisClient();
    return await client.decr(key);
  } catch (error) {
    logger.error(`Redis DECR失败 [${key}]:`, error);
    return 0;
  }
}

export async function incrBy(key: string, increment: number): Promise<number> {
  try {
    if (!isRedisConnected()) {
      return 0;
    }

    const client = await getRedisClient();
    return await client.incrBy(key, increment);
  } catch (error) {
    logger.error(`Redis INCRBY失败 [${key}]:`, error);
    return 0;
  }
}

export async function getCacheStats(): Promise<{
  connected: boolean;
  keyCount: number;
  memoryUsage: string;
  hitRate: number;
}> {
  try {
    if (!isRedisConnected()) {
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: '0B',
        hitRate: 0,
      };
    }

    const client = await getRedisClient();
    const info = await client.info('stats');

    const keyCount = await client.dbSize();
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1].trim() : '0B';

    const keyspaceMatch = info.match(/keyspace_hits:(\d+)/);
    const hits = keyspaceMatch ? parseInt(keyspaceMatch[1]) : 0;

    const missesMatch = info.match(/keyspace_misses:(\d+)/);
    const misses = missesMatch ? parseInt(missesMatch[1]) : 0;

    const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;

    return {
      connected: true,
      keyCount,
      memoryUsage,
      hitRate,
    };
  } catch (error) {
    logger.error('获取Redis统计信息失败:', error);
    return {
      connected: false,
      keyCount: 0,
      memoryUsage: '0B',
      hitRate: 0,
    };
  }
}

export async function flushAll(): Promise<boolean> {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const client = await getRedisClient();
    await client.flushDb();

    logger.warn('Redis数据库已清空');
    return true;
  } catch (error) {
    logger.error('Redis FLUSHALL失败:', error);
    return false;
  }
}

export { CACHE_TTL };
export type { RedisClientType };

export const RedisService = {
  ping: async (): Promise<boolean> => {
    try {
      if (!isRedisConnected()) {
        return false;
      }
      const client = await getRedisClient();
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping失败:', error);
      return false;
    }
  },
  get,
  set,
  del,
  delPattern,
  exists,
  expire,
  getOrSet,
  incr,
  decr,
  incrBy,
  getCacheStats,
  flushAll,
  isRedisConnected,
};
