/**
 * 文件上传控制器
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { getBannerImageUrl } from '../middleware/upload.middleware';
import { logger } from '../utils/logger';

/**
 * 上传Banner图片
 */
export async function uploadBannerImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return sendError(res, 1001, '请选择要上传的图片', 400);
    }

    const imageUrl = getBannerImageUrl(req.file.filename);
    
    logger.info('Banner图片上传成功:', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: imageUrl,
    });

    sendSuccess(res, {
      url: imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error: any) {
    logger.error('上传Banner图片失败:', error);
    next(error);
  }
}
