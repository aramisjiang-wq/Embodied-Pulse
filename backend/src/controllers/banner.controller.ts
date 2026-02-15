/**
 * Banner控制器
 */

import { Request, Response, NextFunction } from 'express';
import { getActiveBanners, getBanners } from '../services/banner.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess } from '../utils/response';

export async function getBannerList(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { status } = req.query;
    const { banners, total } = await getBanners({
      skip,
      take,
      status: status as any,
    });

    sendSuccess(res, {
      items: banners,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error: any) {
    // 如果是表不存在错误，返回空列表
    if (error.message === 'BANNERS_FETCH_FAILED' || error.code === 'P2021' || error.message?.includes('does not exist')) {
      const { page: pageNum, size: pageSize } = parsePaginationParams(req.query);
      return sendSuccess(res, {
        items: [],
        pagination: buildPaginationResponse(pageNum, pageSize, 0),
      });
    }
    next(error);
  }
}

export async function getActiveBannerList(req: Request, res: Response, next: NextFunction) {
  try {
    const banners = await getActiveBanners();
    sendSuccess(res, { items: banners });
  } catch (error) {
    next(error);
  }
}
