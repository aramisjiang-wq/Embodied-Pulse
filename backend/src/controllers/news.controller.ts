/**
 * 新闻控制器
 */

import { Request, Response, NextFunction } from 'express';
import { getNews, getNewsById, searchNews, getHotNews, getRelatedNews } from '../services/news.service';
import { syncFrom36Kr, cleanOldNews, getSyncStats } from '../services/news-sync.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess, sendError } from '../utils/response';

export async function getNewsList(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { sort, category, keyword } = req.query;

    const { news, total } = await getNews({
      skip,
      take,
      sort: sort as any,
      category: category as string,
      keyword: keyword as string,
    });

    sendSuccess(res, {
      items: news,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

export async function getNewsDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const news = await getNewsById(id);

    if (!news) {
      return sendError(res, 1005, '新闻不存在', 404);
    }

    sendSuccess(res, news);
  } catch (error) {
    next(error);
  }
}

export async function searchNewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { keyword } = req.query;
    const { page, size } = parsePaginationParams(req.query);

    if (!keyword || typeof keyword !== 'string') {
      return sendError(res, 1001, '关键词不能为空', 400);
    }

    const { news, total } = await searchNews(keyword, page, size);

    sendSuccess(res, {
      items: news,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

export async function getHotNewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { days, limit } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    const limitNum = limit ? parseInt(limit as string) : 10;

    const news = await getHotNews(daysNum, limitNum);

    sendSuccess(res, news);
  } catch (error) {
    next(error);
  }
}

export async function getRelatedNewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 5;

    const news = await getRelatedNews(id, limitNum);

    sendSuccess(res, news);
  } catch (error) {
    next(error);
  }
}

export async function syncNews(req: Request, res: Response, next: NextFunction) {
  try {
    const { source } = req.query;

    let result;
    switch (source) {
      case '36kr':
        result = await syncFrom36Kr();
        break;
      default:
        return sendError(res, 1001, '不支持的数据源', 400);
    }

    sendSuccess(res, {
      message: '同步完成',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function cleanNews(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await cleanOldNews();

    sendSuccess(res, {
      message: '清理完成',
      count,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSyncStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getSyncStats();

    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}
