/**
 * 管理端 - 订阅管理控制器
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

/**
 * 获取所有订阅（管理端）
 */
export async function getAllSubscriptions(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { contentType, isPublic, isActive, syncEnabled } = req.query;

    const where: any = {};
    if (contentType) where.contentType = contentType;
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (syncEnabled !== undefined) where.syncEnabled = syncEnabled === 'true';

    const [subscriptions, total] = await Promise.all([
      userPrisma.subscription.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              history: true,
            },
          },
        },
      }),
      userPrisma.subscription.count({ where }),
    ]);

    sendSuccess(res, {
      items: subscriptions,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 批量切换订阅开关
 */
export async function toggleSubscriptionsBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids, syncEnabled } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 1001, '订阅ID列表不能为空', 400);
    }

    const result = await userPrisma.subscription.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        syncEnabled: syncEnabled === true,
      },
    });

    logger.info(`批量切换订阅开关: ${ids.length}个订阅, syncEnabled=${syncEnabled}`);

    sendSuccess(res, {
      updated: result.count,
    }, `成功更新${result.count}个订阅`);
  } catch (error) {
    next(error);
  }
}

/**
 * 获取订阅同步历史
 */
export async function getSubscriptionHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { skip, take, page, size } = parsePaginationParams(req.query);

    const [history, total] = await Promise.all([
      userPrisma.subscriptionHistory.findMany({
        where: {
          subscriptionId: id,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      userPrisma.subscriptionHistory.count({
        where: { subscriptionId: id },
      }),
    ]);

    sendSuccess(res, {
      items: history,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取订阅趋势统计
 */
export async function getSubscriptionTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { days = 7 } = req.query;

    // 获取最近N天的同步历史
    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const history = await userPrisma.subscriptionHistory.findMany({
      where: {
        subscriptionId: id,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 按天聚合数据
    const trendsByDay: Record<string, { matchedCount: number; newCount: number; syncCount: number }> = {};
    
    history.forEach(record => {
      const date = record.createdAt.toISOString().split('T')[0];
      if (!trendsByDay[date]) {
        trendsByDay[date] = { matchedCount: 0, newCount: 0, syncCount: 0 };
      }
      trendsByDay[date].matchedCount += record.matchedCount;
      trendsByDay[date].newCount += record.newCount;
      trendsByDay[date].syncCount += 1;
    });

    // 转换为数组格式
    const trends = Object.entries(trendsByDay).map(([date, data]) => ({
      date,
      ...data,
    }));

    // 计算总计
    const summary = {
      totalSyncs: history.length,
      totalMatched: history.reduce((sum, h) => sum + h.matchedCount, 0),
      totalNew: history.reduce((sum, h) => sum + h.newCount, 0),
      successRate: history.length > 0 
        ? (history.filter(h => h.status === 'success').length / history.length * 100).toFixed(2)
        : 0,
      avgDuration: history.length > 0
        ? Math.round(history.reduce((sum, h) => sum + (h.duration || 0), 0) / history.length)
        : 0,
    };

    sendSuccess(res, {
      trends,
      summary,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取订阅统计总览
 */
export async function getSubscriptionStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      total,
      active,
      inactive,
      syncEnabled,
      publicSubs,
      byContentType,
      recentSyncs,
    ] = await Promise.all([
      userPrisma.subscription.count(),
      userPrisma.subscription.count({ where: { isActive: true } }),
      userPrisma.subscription.count({ where: { isActive: false } }),
      userPrisma.subscription.count({ where: { syncEnabled: true } }),
      userPrisma.subscription.count({ where: { isPublic: true } }),
      userPrisma.subscription.groupBy({
        by: ['contentType'],
        _count: true,
      }),
      userPrisma.subscriptionHistory.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            select: {
              contentType: true,
            },
          },
        },
      }),
    ]);

    // 计算最近24小时的同步统计
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);
    
    const last24hSyncs = recentSyncs.filter(s => s.createdAt >= last24h);
    const last24hStats = {
      syncCount: last24hSyncs.length,
      matchedCount: last24hSyncs.reduce((sum, s) => sum + s.matchedCount, 0),
      newCount: last24hSyncs.reduce((sum, s) => sum + s.newCount, 0),
      successRate: last24hSyncs.length > 0
        ? (last24hSyncs.filter(s => s.status === 'success').length / last24hSyncs.length * 100).toFixed(2)
        : 0,
    };

    sendSuccess(res, {
      total,
      active,
      inactive,
      syncEnabled,
      publicSubs,
      byContentType: byContentType.map(item => ({
        type: item.contentType,
        count: item._count,
      })),
      last24h: last24hStats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 手动触发订阅同步
 */
export async function triggerSubscriptionSync(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const subscription = await userPrisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return sendError(res, 1005, '订阅不存在', 404);
    }

    // 记录同步开始
    const startTime = Date.now();
    
    try {
      // 实际的同步逻辑：根据订阅条件筛选匹配的内容
      const { getSubscribedContent } = await import('../services/subscription.service');
      
      // 获取订阅匹配的内容（最多100条用于统计）
      const contentResult = await getSubscribedContent({
        userId: subscription.userId,
        contentType: subscription.contentType,
        skip: 0,
        take: 100,
      });

      // 计算匹配数量和新增数量
      // 新增数量：最近24小时内发布的内容
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      let newCount = 0;
      if (contentResult.items && Array.isArray(contentResult.items)) {
        newCount = contentResult.items.filter((item: any) => {
          const publishDate = item.publishedDate || item.createdAt || item.updatedDate;
          if (!publishDate) return false;
          const itemDate = new Date(publishDate);
          return itemDate >= oneDayAgo;
        }).length;
      }

      const syncResult = {
        matchedCount: contentResult.total || 0,
        newCount: Math.min(newCount, 20), // 最多20条新内容
      };

      const duration = Date.now() - startTime;

      // 记录同步历史
      await userPrisma.subscriptionHistory.create({
        data: {
          subscriptionId: id,
          syncType: 'manual',
          matchedCount: syncResult.matchedCount,
          newCount: syncResult.newCount,
          status: 'success',
          duration,
          createdAt: new Date(), // 明确设置日期
        },
      });

      // 更新订阅信息
      await userPrisma.subscription.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
          lastChecked: new Date(),
          totalMatched: {
            increment: syncResult.matchedCount,
          },
          newCount: {
            increment: syncResult.newCount,
          },
        } as any, // Prisma类型定义可能不完整，使用类型断言
      });

      logger.info(`手动同步订阅成功: ${id}, 匹配${syncResult.matchedCount}条, 新增${syncResult.newCount}条`);

      sendSuccess(res, {
        matchedCount: syncResult.matchedCount,
        newCount: syncResult.newCount,
        duration,
      }, '同步成功');
    } catch (syncError: any) {
      // 记录同步失败
      await userPrisma.subscriptionHistory.create({
        data: {
          subscriptionId: id,
          syncType: 'manual',
          status: 'failed',
          errorMessage: syncError.message,
          duration: Date.now() - startTime,
          createdAt: new Date(), // 明确设置日期
        },
      });

      throw syncError;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * 获取数据流动监控
 */
export async function getDataFlowMonitor(req: Request, res: Response, next: NextFunction) {
  try {
    // 获取最近1小时的同步记录
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentSyncs = await userPrisma.subscriptionHistory.findMany({
      where: {
        createdAt: {
          gte: oneHourAgo,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          select: {
            id: true,
            contentType: true,
            isPublic: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    // 按内容类型统计
    const flowByType: Record<string, { syncs: number; matched: number; new: number }> = {};
    
    recentSyncs.forEach(sync => {
      const type = sync.subscription.contentType;
      if (!flowByType[type]) {
        flowByType[type] = { syncs: 0, matched: 0, new: 0 };
      }
      flowByType[type].syncs += 1;
      flowByType[type].matched += sync.matchedCount;
      flowByType[type].new += sync.newCount;
    });

    // 按时间分组（每10分钟一个点）
    const timeSeriesData: Record<string, { matched: number; new: number }> = {};
    
    recentSyncs.forEach(sync => {
      const time = new Date(sync.createdAt);
      time.setMinutes(Math.floor(time.getMinutes() / 10) * 10, 0, 0);
      const timeKey = time.toISOString();
      
      if (!timeSeriesData[timeKey]) {
        timeSeriesData[timeKey] = { matched: 0, new: 0 };
      }
      timeSeriesData[timeKey].matched += sync.matchedCount;
      timeSeriesData[timeKey].new += sync.newCount;
    });

    const timeSeries = Object.entries(timeSeriesData)
      .map(([time, data]) => ({ time, ...data }))
      .sort((a, b) => a.time.localeCompare(b.time));

    sendSuccess(res, {
      recentSyncs: recentSyncs.slice(0, 20), // 最近20条
      flowByType,
      timeSeries,
      summary: {
        totalSyncs: recentSyncs.length,
        totalMatched: recentSyncs.reduce((sum, s) => sum + s.matchedCount, 0),
        totalNew: recentSyncs.reduce((sum, s) => sum + s.newCount, 0),
      },
    });
  } catch (error) {
    next(error);
  }
}
