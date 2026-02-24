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
    const cookies = await BilibiliCookieManager.getCookieStatus();
    const activeCount = cookies.filter(c => c.isActive).length;
    
    sendSuccess(res, {
      totalCount: cookies.length,
      activeCount,
      inactiveCount: cookies.length - activeCount,
      cookies,
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
    const cookies = await BilibiliCookieManager.getCookieStatus();
    const results = [];

    for (const cookie of cookies) {
      if (!cookie.id.startsWith('env-') && cookie.id !== 'env') {
        const result = await BilibiliHealthService.checkCookie(cookie.cookie || '');
        
        await BilibiliCookieManager.updateCookieStatus(cookie.id, {
          lastCheckAt: new Date(),
          checkResult: result.valid ? 'valid' : result.error,
          userMid: result.mid,
          userName: result.name,
        });

        results.push({
          id: cookie.id,
          name: cookie.name,
          valid: result.valid,
          mid: result.mid,
          userName: result.name,
          error: result.error,
          errorCode: result.errorCode,
        });
      } else {
        results.push({
          id: cookie.id,
          name: cookie.name,
          valid: true,
          error: '环境变量Cookie，跳过检查',
        });
      }
    }

    const summary = {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
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
    const cookies = await BilibiliCookieManager.getCookieStatus();
    
    const summary = {
      total: cookies.length,
      active: cookies.filter(c => c.isActive).length,
      healthy: cookies.filter(c => c.errorCount === 0 && c.isActive).length,
      warning: cookies.filter(c => c.errorCount > 0 && c.errorCount < 3 && c.isActive).length,
      invalid: cookies.filter(c => c.errorCount >= 3 || !c.isActive).length,
      cookies: cookies.map(c => ({
        id: c.id,
        name: c.name,
        isActive: c.isActive,
        errorCount: c.errorCount,
        lastUsed: c.lastUsed,
        lastError: c.lastError,
        lastCheckAt: c.lastCheckAt,
        checkResult: c.checkResult,
        userMid: c.userMid,
        userName: c.userName,
      })),
    };

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
    
    const result = await BilibiliCookieManager.addCookie({
      id: `manual-${Date.now()}`,
      name,
      cookie,
      isActive: true,
      lastUsed: new Date(),
      errorCount: 0,
      createdAt: new Date(),
      priority: priority || 0,
      source: 'manual',
    });
    
    logger.info(`添加Cookie成功: ${name} (ID: ${result.id})`);
    
    sendSuccess(res, {
      id: result.id,
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

    if (id === 'env') {
      return sendError(res, 1003, '环境变量Cookie不能删除，请在.env文件中修改', 400);
    }
    
    await BilibiliCookieManager.removeCookie(id);
    
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

    const cookies = await BilibiliCookieManager.getCookieStatus();
    const cookie = cookies.find(c => c.id === id);
    
    if (!cookie) {
      return sendError(res, 1005, 'Cookie不存在', 404);
    }
    
    if (id === 'env') {
      return sendError(res, 1003, '环境变量Cookie不能切换状态', 400);
    }
    
    const newStatus = !cookie.isActive;
    await BilibiliCookieManager.updateCookieStatus(id, { isActive: newStatus });
    
    logger.info(`切换Cookie状态成功: ${id} -> ${newStatus ? '激活' : '停用'}`);
    
    sendSuccess(res, {
      id,
      isActive: newStatus,
      message: newStatus ? '已激活' : '已停用',
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

    const cookies = await BilibiliCookieManager.getCookieStatus();
    const cookie = cookies.find(c => c.id === id);
    
    if (!cookie) {
      return sendError(res, 1005, 'Cookie不存在', 404);
    }
    
    await BilibiliCookieManager.updateCookieStatus(id, {
      errorCount: 0,
      lastError: undefined,
      isActive: true,
    });
    
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
    const cookies = await BilibiliCookieManager.getCookieStatus();
    
    const stats = {
      total: cookies.length,
      active: cookies.filter(c => c.isActive).length,
      inactive: cookies.filter(c => !c.isActive).length,
      totalErrors: cookies.reduce((sum, c) => sum + c.errorCount, 0),
      avgErrors: cookies.length > 0 
        ? cookies.reduce((sum, c) => sum + c.errorCount, 0) / cookies.length 
        : 0,
      mostUsed: cookies.length > 0 
        ? cookies.reduce((max, c) => 
            new Date(c.lastUsed) > new Date(max.lastUsed) ? c : max
          )
        : null,
      mostErrors: cookies.length > 0 
        ? cookies.reduce((max, c) => c.errorCount > max.errorCount ? c : max)
        : null,
      cookies: cookies.map(c => ({
        id: c.id,
        name: c.name,
        isActive: c.isActive,
        errorCount: c.errorCount,
        lastUsed: c.lastUsed,
        lastError: c.lastError,
        lastCheckAt: c.lastCheckAt,
        checkResult: c.checkResult,
      })),
    };
    
    sendSuccess(res, stats);
  } catch (error: any) {
    logger.error('获取Cookie统计失败:', error);
    sendError(res, 500, error.message || '获取Cookie统计失败');
  }
}

/**
 * 获取设置
 */
export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await BilibiliCookieManager.getSettings();
    sendSuccess(res, settings);
  } catch (error: any) {
    logger.error('获取Cookie设置失败:', error);
    sendError(res, 500, error.message || '获取Cookie设置失败');
  }
}

/**
 * 更新设置
 */
export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { autoRotateEnabled, healthCheckInterval, maxErrorCount, alertEnabled } = req.body;
    
    const settings = await BilibiliCookieManager.updateSettings({
      autoRotateEnabled,
      healthCheckInterval,
      maxErrorCount,
      alertEnabled,
    });
    
    logger.info('更新Cookie设置成功');
    sendSuccess(res, settings);
  } catch (error: any) {
    logger.error('更新Cookie设置失败:', error);
    sendError(res, 500, error.message || '更新Cookie设置失败');
  }
}

/**
 * 手动轮换Cookie
 */
export async function rotateCookie(req: Request, res: Response, next: NextFunction) {
  try {
    const newCookie = await BilibiliCookieManager.rotateCookie();
    
    if (!newCookie) {
      return sendError(res, 500, '没有可用的Cookie');
    }
    
    const cookies = await BilibiliCookieManager.getCookieStatus();
    const activeCookies = cookies.filter(c => c.isActive);
    
    sendSuccess(res, {
      message: '切换成功',
      activeCount: activeCookies.length,
    });
  } catch (error: any) {
    logger.error('轮换Cookie失败:', error);
    sendError(res, 500, error.message || '轮换Cookie失败');
  }
}

/**
 * 检查单个Cookie健康状态
 */
export async function checkSingleCookie(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const cookies = await BilibiliCookieManager.getCookieStatus();
    const cookie = cookies.find(c => c.id === id);
    
    if (!cookie) {
      return sendError(res, 1005, 'Cookie不存在', 404);
    }

    const result = await BilibiliHealthService.checkCookie(cookie.cookie || '');
    
    await BilibiliCookieManager.updateCookieStatus(id, {
      lastCheckAt: new Date(),
      checkResult: result.valid ? 'valid' : result.error,
      userMid: result.mid,
      userName: result.name,
    });
    
    sendSuccess(res, {
      id,
      name: cookie.name,
      valid: result.valid,
      mid: result.mid,
      userName: result.name,
      error: result.error,
      errorCode: result.errorCode,
    });
  } catch (error: any) {
    logger.error('检查单个Cookie失败:', error);
    sendError(res, 500, error.message || '检查Cookie失败');
  }
}
