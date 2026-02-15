/**
 * 查询缓存服务
 * 提供数据库查询结果的缓存功能
 */

import { get, set, del, delPattern, getOrSet, CACHE_TTL } from './redis.service';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
}

const DEFAULT_TTL = CACHE_TTL.MEDIUM;

export function buildKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join(':');

  return `${prefix}:${sortedParams}`;
}

export async function getCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL } = options;

  return getOrSet(key, fetcher, ttl);
}

export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const count = await delPattern(pattern);
    logger.info(`缓存失效: ${pattern} (${count} 个键)`);
    return count;
  } catch (error) {
    logger.error(`缓存失效失败 [${pattern}]:`, error);
    return 0;
  }
}

export async function invalidateNewsCache(): Promise<number> {
  const patterns = [
    'news:list:*',
    'news:detail:*',
    'news:hot:*',
    'news:search:*',
    'news:related:*',
  ];

  let totalInvalidated = 0;
  for (const pattern of patterns) {
    totalInvalidated += await invalidateCache(pattern);
  }

  return totalInvalidated;
}

export async function invalidatePaperCache(): Promise<number> {
  const patterns = [
    'paper:list:*',
    'paper:detail:*',
    'paper:search:*',
    'paper:related:*',
  ];

  let totalInvalidated = 0;
  for (const pattern of patterns) {
    totalInvalidated += await invalidateCache(pattern);
  }

  return totalInvalidated;
}

export async function invalidateVideoCache(): Promise<number> {
  const patterns = [
    'video:list:*',
    'video:detail:*',
    'video:search:*',
  ];

  let totalInvalidated = 0;
  for (const pattern of patterns) {
    totalInvalidated += await invalidateCache(pattern);
  }

  return totalInvalidated;
}

export async function invalidateRepoCache(): Promise<number> {
  const patterns = [
    'repo:list:*',
    'repo:detail:*',
    'repo:search:*',
  ];

  let totalInvalidated = 0;
  for (const pattern of patterns) {
    totalInvalidated += await invalidateCache(pattern);
  }

  return totalInvalidated;
}

export async function invalidateUserCache(userId: string): Promise<number> {
  const patterns = [
    `user:${userId}:*`,
    `user:${userId}:subscriptions:*`,
    `user:${userId}:favorites:*`,
    `user:${userId}:notifications:*`,
  ];

  let totalInvalidated = 0;
  for (const pattern of patterns) {
    totalInvalidated += await invalidateCache(pattern);
  }

  return totalInvalidated;
}

export async function warmUpCache(keys: string[]): Promise<void> {
  logger.info(`开始预热缓存 (${keys.length} 个键)`);

  let warmed = 0;
  for (const key of keys) {
    try {
      const value = await get(key);
      if (value !== null) {
        warmed++;
      }
    } catch (error) {
      logger.error(`预热缓存失败 [${key}]:`, error);
    }
  }

  logger.info(`缓存预热完成: ${warmed}/${keys.length}`);
}

export async function getCacheMetrics(): Promise<{
  totalKeys: number;
  keysByPrefix: Record<string, number>;
  estimatedSize: string;
}> {
  try {
    const { keyCount, memoryUsage } = await import('./redis.service').then(m => m.getCacheStats());

    const prefixes = [
      'news',
      'paper',
      'video',
      'repo',
      'user',
      'subscription',
      'notification',
    ];

    const keysByPrefix: Record<string, number> = {};
    for (const prefix of prefixes) {
      const count = await delPattern(`${prefix}:*`);
      keysByPrefix[prefix] = count;
    }

    return {
      totalKeys: keyCount,
      keysByPrefix,
      estimatedSize: memoryUsage,
    };
  } catch (error) {
    logger.error('获取缓存指标失败:', error);
    return {
      totalKeys: 0,
      keysByPrefix: {},
      estimatedSize: '0B',
    };
  }
}

export { buildKey as generateKey, CACHE_TTL };
export type { CacheOptions };

export const queryCache = {
  generateKey: buildKey,
  execute: async <T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> => {
    return getCachedQuery(key, fetcher, options);
  },
};
