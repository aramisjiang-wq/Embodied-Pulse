/**
 * 智能全量同步服务
 * 支持全量更新、智能风控、Cookie轮换
 */

import { getAllActiveUploaders, syncUploaderVideos } from './bilibili-uploader.service';
import { BilibiliCookieManager } from './bilibili-cookie-manager.service';
import { globalRateLimiter } from './smart-rate-limiter.service';
import { logger } from '../utils/logger';

interface SyncTask {
  mid: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  synced: number;
  errors: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

interface SyncResult {
  success: boolean;
  totalSynced: number;
  totalErrors: number;
  totalSkipped: number;
  tasks: SyncTask[];
  duration: number;
}

// 全局状态管理
let smartSyncQueue: {
  isRunning: boolean;
  tasks: SyncTask[];
  totalSynced: number;
  totalErrors: number;
  totalSkipped: number;
} = {
  isRunning: false,
  tasks: [],
  totalSynced: 0,
  totalErrors: 0,
  totalSkipped: 0,
};

export function getSmartSyncStatus() {
  return {
    isRunning: smartSyncQueue.isRunning,
    currentIndex: smartSyncQueue.tasks.findIndex(t => t.status === 'running'),
    totalTasks: smartSyncQueue.tasks.length,
    completedTasks: smartSyncQueue.tasks.filter(t => t.status === 'completed').length,
    failedTasks: smartSyncQueue.tasks.filter(t => t.status === 'failed').length,
    totalSynced: smartSyncQueue.totalSynced,
    totalErrors: smartSyncQueue.totalErrors,
    tasks: smartSyncQueue.tasks.map(t => ({ ...t })),
  };
}

export function isSmartSyncRunning(): boolean {
  return smartSyncQueue.isRunning;
}

export function cancelSmartSync(): void {
  if (smartSyncQueue.isRunning) {
    logger.info('取消智能同步任务');
    smartSyncQueue.isRunning = false;
    
    const currentTask = smartSyncQueue.tasks.find(t => t.status === 'running');
    if (currentTask) {
      currentTask.status = 'failed';
      currentTask.error = '用户取消';
      currentTask.endTime = new Date();
    }
  }
}

export async function smartSyncAllUploaders(
  maxResultsPerUploader: number = 999999,
  options: {
    skipExisting?: boolean;
    forceFullSync?: boolean;
    batchSize?: number;
  } = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  
  try {
    if (smartSyncQueue.isRunning) {
      throw new Error('智能同步任务正在运行中');
    }
    
    logger.info('========================================');
    logger.info('开始智能全量同步');
    logger.info('========================================');
    logger.info(`配置: 每个UP主最多 ${maxResultsPerUploader} 个视频`);
    logger.info(`选项: ${JSON.stringify(options)}`);
    
    const uploaders = await getAllActiveUploaders();
    
    if (uploaders.length === 0) {
      logger.info('没有激活的UP主需要同步');
      smartSyncQueue.isRunning = false;
      return {
        success: true,
        totalSynced: 0,
        totalErrors: 0,
        totalSkipped: 0,
        tasks: [],
        duration: 0,
      };
    }

    const activeCookieCount = await BilibiliCookieManager.getActiveCount();
    const totalCount = await BilibiliCookieManager.getTotalCount();
    globalRateLimiter.setTotalCookies(activeCookieCount);
    logger.info(`找到 ${uploaders.length} 个活跃UP主`);
    logger.info(`可用Cookie: ${activeCookieCount}/${totalCount}`);

    smartSyncQueue.tasks = uploaders.map(uploader => ({
      mid: uploader.mid,
      name: uploader.name || '未知UP主',
      status: 'pending' as const,
      synced: 0,
      errors: 0,
    }));

    smartSyncQueue.isRunning = true;
    smartSyncQueue.totalSynced = 0;
    smartSyncQueue.totalErrors = 0;
    smartSyncQueue.totalSkipped = 0;

    for (let i = 0; i < smartSyncQueue.tasks.length; i++) {
      // 检查是否被取消
      if (!smartSyncQueue.isRunning) {
        logger.info('智能同步任务已被取消');
        break;
      }
      
      const task = smartSyncQueue.tasks[i];
      
      task.status = 'running';
      task.startTime = new Date();
      
      try {
        logger.info(`[${i + 1}/${smartSyncQueue.tasks.length}] 开始同步: ${task.name} (${task.mid})`);
        
        const result = await syncUploaderVideosWithSmartRetry(
          task.mid,
          maxResultsPerUploader,
          options
        );
        
        task.status = 'completed';
        task.synced = result.synced;
        task.errors = result.errors;
        task.endTime = new Date();
        
        smartSyncQueue.totalSynced += result.synced;
        smartSyncQueue.totalErrors += result.errors;
        
        logger.info(`✓ [${i + 1}/${smartSyncQueue.tasks.length}] ${task.name}: 成功 ${result.synced} 个, 失败 ${result.errors} 个`);
        
        if (result.skipped) {
          smartSyncQueue.totalSkipped += result.skipped;
          logger.info(`  跳过 ${result.skipped} 个已存在的视频`);
        }
        
        await globalRateLimiter.wait();
        
        if (globalRateLimiter.shouldBackoff()) {
          logger.warn('检测到严重限流，建议稍后重试');
          break;
        }
        
      } catch (error: any) {
        task.status = 'failed';
        task.errors = 1;
        task.error = error.message;
        task.endTime = new Date();
        
        smartSyncQueue.totalErrors++;
        
        logger.error(`✗ [${i + 1}/${smartSyncQueue.tasks.length}] ${task.name}: ${error.message}`);
        
        await globalRateLimiter.wait();
        
        if (globalRateLimiter.shouldBackoff()) {
          logger.warn('检测到严重限流，建议稍后重试');
          break;
        }
      }
    }

    smartSyncQueue.isRunning = false;
    const duration = Date.now() - startTime;
    
    logger.info('========================================');
    logger.info('同步完成');
    logger.info('========================================');
    logger.info(`总计: ${smartSyncQueue.tasks.length} 个UP主`);
    logger.info(`成功: ${smartSyncQueue.totalSynced} 个视频`);
    logger.info(`失败: ${smartSyncQueue.totalErrors} 个错误`);
    logger.info(`跳过: ${smartSyncQueue.totalSkipped} 个已存在视频`);
    logger.info(`耗时: ${(duration / 1000 / 60).toFixed(2)} 分钟`);
    
    return {
      success: true,
      totalSynced: smartSyncQueue.totalSynced,
      totalErrors: smartSyncQueue.totalErrors,
      totalSkipped: smartSyncQueue.totalSkipped,
      tasks: smartSyncQueue.tasks,
      duration,
    };
  } catch (error: any) {
    smartSyncQueue.isRunning = false;
    logger.error('智能全量同步失败:', error);
    throw error;
  }
}

async function syncUploaderVideosWithSmartRetry(
  mid: string,
  maxResults: number,
  options: any
): Promise<{
  synced: number;
  errors: number;
  skipped?: number;
}> {
  const maxRetries = 5;
  let attempt = 1;
  let synced = 0;
  let errors = 0;
  let skipped = 0;

  while (attempt <= maxRetries) {
    try {
      logger.info(`  尝试 ${attempt}/${maxRetries}...`);
      
      const result = await syncUploaderVideos(mid, maxResults);
      
      synced = result.synced;
      errors = result.errors;
      
      globalRateLimiter.recordRequest(true);
      
      if (synced > 0 || synced === 0 && errors === 0) {
        logger.info(`  ✓ 同步完成: ${synced} 个视频`);
        return { synced, errors, skipped };
      }
      
      attempt++;
      await globalRateLimiter.wait();
      
    } catch (error: any) {
      globalRateLimiter.recordRequest(false);
      errors++;
      
      const errorMsg = error.message || '';
      
      if (errorMsg.includes('请求过于频繁') || errorMsg.includes('rate limit')) {
        logger.warn(`  ✗ 限流错误 (${attempt}/${maxRetries})`);
        
        const backoffTime = Math.min(30000 * attempt, 120000);
        logger.info(`  等待 ${backoffTime / 1000} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        attempt++;
        
      } else if (errorMsg.includes('UP主不存在') || errorMsg.includes('未激活')) {
        logger.error(`  ✗ UP主不存在或未激活，跳过`);
        return { synced: 0, errors: 1 };
        
      } else if (attempt >= maxRetries) {
        logger.error(`  ✗ 达到最大重试次数，放弃`);
        return { synced, errors };
        
      } else {
        logger.warn(`  ✗ 错误: ${errorMsg}`);
        attempt++;
        await globalRateLimiter.wait();
      }
    }
  }

  return { synced, errors, skipped };
}