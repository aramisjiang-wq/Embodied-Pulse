/**
 * 统计数据控制器（公开API）
 */

import { Request, Response, NextFunction } from 'express';
import userPrisma from '../config/database.user';
import { sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';

const prisma = userPrisma;

/**
 * 获取内容统计数据（公开）
 */
export async function getContentStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [papers, videos, repos, huggingface, jobs] = await Promise.all([
      prisma.paper.count(),
      prisma.video.count(),
      prisma.githubRepo.count(),
      prisma.huggingFaceModel.count(),
      prisma.job.count({ where: { status: 'open' } }),
    ]);

    sendSuccess(res, {
      papers,
      videos,
      repos,
      huggingface,
      jobs,
    });
  } catch (error) {
    logger.error('Get content stats error:', error);
    next(error);
  }
}
