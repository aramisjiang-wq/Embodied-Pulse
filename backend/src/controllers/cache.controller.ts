/**
 * 缓存管理控制器
 * 提供缓存管理和监控的API端点
 */

import { Request, Response, NextFunction } from 'express';
import {
  getCacheStats,
  flushAll,
  isRedisConnected,
} from '../services/redis.service';
import {
  invalidateNewsCache,
  invalidatePaperCache,
  invalidateVideoCache,
  invalidateRepoCache,
  invalidateUserCache,
  getCacheMetrics,
} from '../services/query-cache.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

export async function getCacheStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getCacheStats();

    sendSuccess(res, {
      connected: stats.connected,
      keyCount: stats.keyCount,
      memoryUsage: stats.memoryUsage,
      hitRate: `${stats.hitRate.toFixed(2)}%`,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCacheMetricsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = await getCacheMetrics();

    sendSuccess(res, metrics);
  } catch (error) {
    next(error);
  }
}

export async function clearCache(req: Request, res: Response, next: NextFunction) {
  try {
    const { type } = req.params;
    let count = 0;

    switch (type) {
      case 'news':
        count = await invalidateNewsCache();
        break;
      case 'paper':
        count = await invalidatePaperCache();
        break;
      case 'video':
        count = await invalidateVideoCache();
        break;
      case 'repo':
        count = await invalidateRepoCache();
        break;
      case 'all':
        const success = await flushAll();
        if (success) {
          sendSuccess(res, { message: '所有缓存已清空' });
        } else {
          return sendError(res, 1001, '清空缓存失败', 500);
        }
        return;
      default:
        return sendError(res, 1001, '无效的缓存类型', 400);
    }

    sendSuccess(res, {
      message: `已清理 ${count} 个缓存键`,
      count,
    });
  } catch (error) {
    next(error);
  }
}

export async function clearUserCache(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;

    const count = await invalidateUserCache(userId);

    sendSuccess(res, {
      message: `已清理用户 ${userId} 的 ${count} 个缓存键`,
      count,
    });
  } catch (error) {
    next(error);
  }
}

export async function healthCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const connected = isRedisConnected();

    if (connected) {
      sendSuccess(res, {
        status: 'healthy',
        message: 'Redis连接正常',
      });
    } else {
      sendSuccess(res, {
        status: 'unhealthy',
        message: 'Redis连接失败',
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function warmUpCache(req: Request, res: Response, next: NextFunction) {
  try {
    const { keys } = req.body;

    if (!Array.isArray(keys)) {
      return sendError(res, 1001, 'keys必须是数组', 400);
    }

    logger.info(`开始预热缓存 (${keys.length} 个键)`);

    sendSuccess(res, {
      message: `开始预热 ${keys.length} 个缓存键`,
      count: keys.length,
    });
  } catch (error) {
    next(error);
  }
}
