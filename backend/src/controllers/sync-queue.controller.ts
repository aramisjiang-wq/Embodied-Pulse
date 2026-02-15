/**
 * Bilibili同步队列控制器
 */

import { Request, Response } from 'express';
import { syncAllUploaders, getSyncQueueStatus, isSyncRunning, cancelSync } from '../services/sync-queue.service';
import { smartSyncAllUploaders, getSmartSyncStatus, isSmartSyncRunning, cancelSmartSync } from '../services/smart-sync.service';
import { logger } from '../utils/logger';
import { sendSuccess, sendError } from '../utils/response';

export async function syncAll(req: Request, res: Response) {
  try {
    const { maxResults = 100, smart = true } = req.body;
    
    // 检查是否已有同步任务在运行
    if (smart) {
      if (isSmartSyncRunning()) {
        return sendError(res, 400, '智能同步任务正在运行中，请等待完成或先取消');
      }
    } else {
      if (isSyncRunning()) {
        return sendError(res, 400, '同步任务正在运行中，请等待完成或先取消');
      }
    }
    
    // 异步启动同步任务
    if (smart) {
      logger.info('使用智能全量同步模式');
      // 在后台启动智能同步
      smartSyncAllUploaders(maxResults, {
        forceFullSync: true,
      }).catch((error: any) => {
        logger.error('智能全量同步失败:', error);
      });
      // 立即返回初始状态
      const initialStatus = getSmartSyncStatus();
      sendSuccess(res, initialStatus, '智能同步任务已启动');
    } else {
      logger.info('使用传统同步模式');
      // 在后台启动传统同步
      syncAllUploaders(maxResults).catch((error: any) => {
        logger.error('传统同步失败:', error);
      });
      // 立即返回初始状态
      const initialStatus = getSyncQueueStatus();
      sendSuccess(res, initialStatus, '同步任务已启动');
    }
  } catch (error: any) {
    logger.error('启动同步任务失败:', error);
    sendError(res, 500, error.message || '启动同步失败');
  }
}

export async function getStatus(req: Request, res: Response) {
  try {
    // 优先返回智能同步状态，如果智能同步未运行则返回传统同步状态
    if (isSmartSyncRunning()) {
      const status = getSmartSyncStatus();
      sendSuccess(res, status);
    } else {
      const status = getSyncQueueStatus();
      sendSuccess(res, status);
    }
  } catch (error: any) {
    logger.error('获取同步状态失败:', error);
    sendError(res, 500, error.message || '获取状态失败');
  }
}

export async function cancel(req: Request, res: Response) {
  try {
    // 取消智能同步或传统同步
    if (isSmartSyncRunning()) {
      cancelSmartSync();
      sendSuccess(res, { message: '智能同步任务已取消' });
    } else {
      cancelSync();
      sendSuccess(res, { message: '同步任务已取消' });
    }
  } catch (error: any) {
    logger.error('取消同步失败:', error);
    sendError(res, 500, error.message || '取消失败');
  }
}