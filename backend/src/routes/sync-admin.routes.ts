/**
 * 数据同步API路由
 * 提供管理端到用户端的数据同步接口
 */

import { Router } from 'express';
import {
  syncUploadersFromAdminToUser,
  createDefaultUserSubscription,
  syncAllUserDefaultSubscriptions,
  fullDataSync
} from '../services/admin-to-user-sync.service';
import {
  syncVideosForUploader,
  syncAllUploadersVideos,
  quickSyncRecentUploaders
} from '../services/video-sync.service';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   POST /api/admin/sync/uploaders
 * @desc    同步管理端UP主数据到用户端
 * @access  Admin
 */
router.post('/uploaders', async (req: any, res: any) => {
  try {
    logger.info('收到UP主数据同步请求');
    
    const result = await syncUploadersFromAdminToUser();
    
    sendSuccess(res, {
      message: 'UP主数据同步完成',
      ...result
    });
  } catch (error: any) {
    logger.error('同步UP主数据失败:', error);
    sendError(res, 500, '同步UP主数据失败');
  }
});

/**
 * @route   POST /api/admin/sync/subscriptions
 * @desc    为所有用户创建默认UP主订阅
 * @access  Admin
 */
router.post('/subscriptions', async (req: any, res: any) => {
  try {
    logger.info('收到用户订阅同步请求');
    
    const result = await syncAllUserDefaultSubscriptions();
    
    sendSuccess(res, {
      message: '用户订阅同步完成',
      ...result
    });
  } catch (error: any) {
    logger.error('同步用户订阅失败:', error);
    sendError(res, 500, '同步用户订阅失败');
  }
});

/**
 * @route   POST /api/admin/sync/full
 * @desc    完整数据同步（UP主 + 订阅）
 * @access  Admin
 */
router.post('/full', async (req: any, res: any) => {
  try {
    logger.info('收到完整数据同步请求');
    
    const result = await fullDataSync();
    
    sendSuccess(res, {
      message: '完整数据同步完成',
      ...result
    });
  } catch (error: any) {
    logger.error('完整数据同步失败:', error);
    sendError(res, 500, '完整数据同步失败');
  }
});

/**
 * @route   POST /api/admin/sync/videos/:uploaderId
 * @desc    同步指定UP主的视频数据
 * @access  Admin
 */
router.post('/videos/:uploaderId', async (req: any, res: any) => {
  try {
    const { uploaderId } = req.params;
    const { maxResults = 100 } = req.body;
    
    logger.info(`收到UP主视频同步请求: ${uploaderId}`);
    
    const result = await syncVideosForUploader(uploaderId, maxResults);
    
    sendSuccess(res, {
      message: 'UP主视频同步完成',
      ...result
    });
  } catch (error: any) {
    logger.error('同步UP主视频失败:', error);
    sendError(res, 500, '同步UP主视频失败');
  }
});

/**
 * @route   POST /api/admin/sync/videos/all
 * @desc    同步所有UP主的视频数据
 * @access  Admin
 */
router.post('/videos/all', async (req: any, res: any) => {
  try {
    const { maxResultsPerUploader = 100 } = req.body;
    
    logger.info('收到所有UP主视频同步请求');
    
    const result = await syncAllUploadersVideos(maxResultsPerUploader);
    
    sendSuccess(res, {
      message: '所有UP主视频同步完成',
      ...result
    });
  } catch (error: any) {
    logger.error('同步所有UP主视频失败:', error);
    sendError(res, 500, '同步所有UP主视频失败');
  }
});

/**
 * @route   POST /api/admin/sync/videos/quick
 * @desc    快速同步最近更新的UP主视频
 * @access  Admin
 */
router.post('/videos/quick', async (req: any, res: any) => {
  try {
    const { days = 7, maxResultsPerUploader = 20 } = req.body;
    
    logger.info(`收到快速同步请求: 最近${days}天`);
    
    const result = await quickSyncRecentUploaders(days, maxResultsPerUploader);
    
    sendSuccess(res, {
      message: '快速同步完成',
      ...result
    });
  } catch (error: any) {
    logger.error('快速同步失败:', error);
    sendError(res, 500, '快速同步失败');
  }
});

/**
 * @route   POST /api/admin/sync/user/:userId/subscription
 * @desc    为指定用户创建默认UP主订阅
 * @access  Admin
 */
router.post('/user/:userId/subscription', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    
    logger.info(`收到用户订阅创建请求: ${userId}`);
    
    const result = await createDefaultUserSubscription(userId);
    
    if (!result.success) {
      return sendError(res, 400, result.error || '创建订阅失败');
    }
    
    sendSuccess(res, {
      message: '用户订阅创建成功',
      ...result
    });
  } catch (error: any) {
    logger.error('创建用户订阅失败:', error);
    sendError(res, 500, '创建用户订阅失败');
  }
});

export default router;
