/**
 * 发现控制器
 */

import { Request, Response, NextFunction } from 'express';
import { getDiscoveryContent } from '../services/discovery.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess } from '../utils/response';

/**
 * 获取发现内容
 */
export async function getDiscovery(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { contentType = 'all', sortType = 'hot' } = req.query;

    const result = await getDiscoveryContent({
      contentType: contentType as any,
      sortType: sortType as 'hot' | 'latest',
      skip,
      take,
    });

    sendSuccess(res, {
      items: result.items,
      pinnedItems: result.pinnedItems,
      pagination: buildPaginationResponse(page, size, result.total),
    });
  } catch (error) {
    next(error);
  }
}
