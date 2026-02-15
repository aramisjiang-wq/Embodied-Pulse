/**
 * Cookie管理控制器
 */

import { Request, Response } from 'express';
import { BilibiliCookieManager } from '../services/bilibili-cookie-manager.service';
import { logger } from '../utils/logger';
import { sendSuccess, sendError } from '../utils/response';

export async function addCookie(req: Request, res: Response) {
  try {
    const { name, cookie } = req.body;

    if (!name || !cookie) {
      return sendError(res, 400, '缺少必要参数');
    }

    BilibiliCookieManager.addCookie({
      id: `cookie-${Date.now()}`,
      name,
      cookie,
      isActive: true,
      lastUsed: new Date(),
      errorCount: 0,
      createdAt: new Date(),
    });

    logger.info(`添加Cookie: ${name}`);

    sendSuccess(res, null, 'Cookie添加成功');
  } catch (error: any) {
    logger.error('添加Cookie失败:', error);
    sendError(res, 500, error.message || '添加失败');
  }
}

export async function removeCookie(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, 400, '缺少Cookie ID');
    }

    BilibiliCookieManager.removeCookie(id);

    logger.info(`移除Cookie: ${id}`);

    sendSuccess(res, null, 'Cookie移除成功');
  } catch (error: any) {
    logger.error('移除Cookie失败:', error);
    sendError(res, 500, error.message || '移除失败');
  }
}

export async function getCookieStatus(req: Request, res: Response) {
  try {
    const status = BilibiliCookieManager.getCookieStatus();

    sendSuccess(res, {
      cookies: status,
      activeCount: BilibiliCookieManager.getActiveCount(),
      totalCount: BilibiliCookieManager.getTotalCount(),
    });
  } catch (error: any) {
    logger.error('获取Cookie状态失败:', error);
    sendError(res, 500, error.message || '获取状态失败');
  }
}

export async function rotateCookie(req: Request, res: Response) {
  try {
    const nextCookie = BilibiliCookieManager.rotateCookie();

    if (!nextCookie) {
      return sendError(res, 500, '没有可用的Cookie');
    }

    sendSuccess(res, null, 'Cookie切换成功');
  } catch (error: any) {
    logger.error('切换Cookie失败:', error);
    sendError(res, 500, error.message || '切换失败');
  }
}