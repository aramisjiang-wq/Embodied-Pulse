/**
 * 论文控制器
 */

import { Request, Response, NextFunction } from 'express';
import { getPapers, getPaperById } from '../services/paper.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess, sendError } from '../utils/response';
import { createUserAction } from '../services/user-action.service';
import { get as cacheGet, set as cacheSet, generateCacheKey } from '../services/cache.service';

function formatPaper(paper: any) {
  return {
    ...paper,
    authors: parseJsonField(paper.authors, []),
    categories: parseJsonField(paper.categories, []),
    publishedDate: formatDate(paper.publishedDate),
  };
}

function parseJsonField(field: any, defaultValue: any) {
  if (field === null || field === undefined) return defaultValue;
  if (typeof field === 'object') return field;
  try {
    return JSON.parse(field || '[]');
  } catch {
    return defaultValue;
  }
}

function formatDate(date: any) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString();
}

/**
 * 获取论文列表
 */
export async function getPaperList(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { sort, category, keyword, startDate, endDate } = req.query;

    const cacheKey = generateCacheKey('papers', { skip, take, sort, category, keyword: keyword ? 'query' : undefined, startDate, endDate });
    
    const cachedData = await cacheGet<{ papers: any[]; total: number }>(cacheKey);
    
    if (cachedData) {
      return sendSuccess(res, {
        items: cachedData.papers.map(formatPaper),
        pagination: buildPaginationResponse(page, size, cachedData.total),
      });
    }

    const result = await getPapers({
      skip,
      take,
      sort: sort as any,
      category: category as string,
      keyword: keyword as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    
    await cacheSet(cacheKey, { papers: result.papers, total: result.total }, 300);

    sendSuccess(res, {
      items: result.papers.map(formatPaper),
      pagination: buildPaginationResponse(page, size, result.total),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取论文详情
 */
export async function getPaper(req: Request, res: Response, next: NextFunction) {
  try {
    const { paperId } = req.params;
    const cacheKey = generateCacheKey('paper', { paperId });
    
    const cachedPaper = await cacheGet<any>(cacheKey);
    
    let paper = cachedPaper;
    
    if (!paper) {
      paper = await getPaperById(paperId);
      
      if (paper) {
        await cacheSet(cacheKey, paper, 600);
      }
    }

    if (!paper) {
      return sendError(res, 1005, '论文不存在', 404);
    }

    if (req.user?.id) {
      createUserAction({
        userId: req.user.id,
        actionType: 'view',
        contentType: 'paper',
        contentId: paperId,
        metadata: {
          title: paper.title,
        },
      }).catch(() => {});
    }

    sendSuccess(res, formatPaper(paper));
  } catch (error) {
    next(error);
  }
}
