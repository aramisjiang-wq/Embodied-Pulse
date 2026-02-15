/**
 * 信息流控制器
 */

import { Request, Response, NextFunction } from 'express';
import { getFeed } from '../services/feed.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess } from '../utils/response';
import { get as cacheGet, set as cacheSet, generateCacheKey } from '../services/cache.service';

/**
 * 获取信息流
 */
export async function getFeedHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { tab } = req.query;
    const userId = req.user?.id;

    const cacheKey = generateCacheKey('feed', { skip, take, tab, userId });
    
    let cachedData = await cacheGet<{ items: any[]; total: number }>(cacheKey);
    
    let items: any[];
    let total: number;
    
    if (cachedData) {
      items = cachedData.items;
      total = cachedData.total;
    } else {
      const result = await getFeed({
        skip,
        take,
        tab: tab as any,
        userId,
      });
      
      items = result.items;
      total = result.total;
      
      await cacheSet(cacheKey, { items, total }, 180);
    }

    sendSuccess(res, {
      items,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}
