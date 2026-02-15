/**
 * Bilibili Cookie管理控制器
 * 提供Cookie状态查询、健康检查、添加/删除Cookie等功能
 */

import { Request, Response, NextFunction } from 'express';
import { BilibiliCookieManager } from '../services/bilibili-cookie-manager.service';
import { BilibiliHealthService } from '../services/bilibili-health.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * 获取Cookie状态
 */
export async function getCookieStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = BilibiliCookieManager.getCookieStatus();
    
    sendSuccess(res, {
      total: status.length,
      active: status.filter(s => s.isActive).length,
      inactive: status.filter(s => !s.isActive).length,
      cookies: status,
    });
  } catch (error: any) {
    logger.error('获取Cookie状态失败:', error);
    sendError(res, 500, error.message || '获取Cookie状态失败');
  }
}

/**
 * 检查所有Cookie的健康状态
 */
export async function checkCookies(req: Request, res: Response, next: NextFunction) {
  try {
    const cookiePool = BilibiliHealthService.getCookiePoolConfig();
    const results = await BilibiliHealthService.checkAllCookies(cookiePool);
    
    const summary = {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid && r.cookie).length,
      unconfigured: results.filter(r => !r.cookie).length,
      cookies: results,
    };
    
    sendSuccess(res, summary);
  } catch (error: any) {
    logger.error('检查Cookie失败:', error);
    sendError(res, 500, error.message || '检查Cookie失败');
  }
}

/**
 * 获取Cookie健康摘要
 */
export async function getHealthSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await BilibiliHealthService.getHealthSummary();
    sendSuccess(res, summary);
  } catch (error: any) {
    logger.error('获取Cookie健康摘要失败:', error);
    sendError(res, 500, error.message || '获取Cookie健康摘要失败');
  }
}

/**
 * 添加Cookie
 */
export async function addCookie(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, cookie, priority } = req.body;
    
    if (!name || !cookie) {
      return sendError(res, 1001, '参数不完整：name和cookie必填', 400);
    }
    
    const cookieId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    BilibiliCookieManager.addCookie({
      id: cookieId,
      name,
      cookie,
      isActive: true,
      lastUsed: new Date(),
      errorCount: 0,
      createdAt: new Date(),
    });
    
    logger.info(`添加Cookie成功: ${name} (ID: ${cookieId})`);
    
    sendSuccess(res, {
      id: cookieId,
      name,
      message: '添加成功',
    });
  } catch (error: any) {
    logger.error('添加Cookie失败:', error);
    sendError(res, 500, error.message || '添加Cookie失败');
  }
}

/**
 * 删除Cookie
 */
export async function removeCookie(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(res, 1001, 'Cookie ID不能为空', 400);
    }
    
    BilibiliCookieManager.removeCookie(id);
    
    logger.info(`删除Cookie成功: ${id}`);
    
    sendSuccess(res, { message: '删除成功' });
  } catch (error: any) {
    logger.error('删除Cookie失败:', error);
    sendError(res, 500, error.message || '删除Cookie失败');
  }
}

/**
 * 切换Cookie状态
 */
export async function toggleCookieStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(res, 1001, 'Cookie ID不能为空', 400);
    }
    
    const status = BilibiliCookieManager.getCookieStatus();
    const cookie = status.find(c => c.id === id);
    
    if (!cookie) {
      return sendError(res, 1005, 'Cookie不存在', 404);
    }
    
    if (cookie.id === 'env') {
      return sendError(res, 1003, '环境变量Cookie不能切换状态', 400);
    }
    
    BilibiliCookieManager.removeCookie(id);
    BilibiliCookieManager.addCookie({
      ...cookie,
      isActive: !cookie.isActive,
      lastUsed: new Date(),
    } as any);
    
    logger.info(`切换Cookie状态成功: ${id} -> ${!cookie.isActive ? '激活' : '停用'}`);
    
    sendSuccess(res, {
      id,
      isActive: !cookie.isActive,
      message: cookie.isActive ? '已停用' : '已激活',
    });
  } catch (error: any) {
    logger.error('切换Cookie状态失败:', error);
    sendError(res, 500, error.message || '切换Cookie状态失败');
  }
}

/**
 * 重置Cookie错误计数
 */
export async function resetCookieErrorCount(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(res, 1001, 'Cookie ID不能为空', 400);
    }
    
    const status = BilibiliCookieManager.getCookieStatus();
    const cookie = status.find(c => c.id === id);
    
    if (!cookie) {
      return sendError(res, 1005, 'Cookie不存在', 404);
    }
    
    BilibiliCookieManager.removeCookie(id);
    BilibiliCookieManager.addCookie({
      ...cookie,
      errorCount: 0,
      lastError: undefined,
      lastUsed: new Date(),
    } as any);
    
    logger.info(`重置Cookie错误计数成功: ${id}`);
    
    sendSuccess(res, { message: '重置成功' });
  } catch (error: any) {
    logger.error('重置Cookie错误计数失败:', error);
    sendError(res, 500, error.message || '重置Cookie错误计数失败');
  }
}

/**
 * 获取Cookie使用统计
 */
export async function getCookieStats(req: Request, res: Response, next: NextFunction) {
  try {
    const status = BilibiliCookieManager.getCookieStatus();
    
    const stats = {
      total: status.length,
      active: status.filter(s => s.isActive).length,
      inactive: status.filter(s => !s.isActive).length,
      totalErrors: status.reduce((sum, s) => sum + s.errorCount, 0),
      avgErrors: status.length > 0 
        ? status.reduce((sum, s) => sum + s.errorCount, 0) / status.length 
        : 0,
      mostUsed: status.length > 0 
        ? status.reduce((max, s) => 
            new Date(s.lastUsed) > new Date(max.lastUsed) ? s : max
          )
        : null,
      mostErrors: status.length > 0 
        ? status.reduce((max, s) => s.errorCount > max.errorCount ? s : max)
        : null,
      cookies: status.map(s => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive,
        errorCount: s.errorCount,
        lastUsed: s.lastUsed,
        lastError: s.lastError,
      })),
    };
    
    sendSuccess(res, stats);
  } catch (error: any) {
    logger.error('获取Cookie统计失败:', error);
    sendError(res, 500, error.message || '获取Cookie统计失败');
  }
}
