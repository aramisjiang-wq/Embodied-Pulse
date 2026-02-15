/**
 * Bilibili同步队列服务
 * 实现队列管理和风控规避
 */

import { getAllActiveUploaders, syncUploaderVideos } from './bilibili-uploader.service';
import { logger } from '../utils/logger';

interface SyncTask {
  mid: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  synced: number;
  errors: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

interface SyncQueue {
  tasks: SyncTask[];
  isRunning: boolean;
  currentIndex: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalSynced: number;
  totalErrors: number;
}

const syncQueue: SyncQueue = {
  tasks: [],
  isRunning: false,
  currentIndex: 0,
  totalTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
  totalSynced: 0,
  totalErrors: 0,
};

const SYNC_CONFIG = {
  maxRetries: 3,
  baseDelay: 5000,
  maxDelay: 60000,
  batchSize: 1,
  batchDelay: 10000,
  rateLimitDelay: 15000,
};

export async function syncAllUploaders(maxResults: number = 100): Promise<{
  success: boolean;
  totalSynced: number;
  totalErrors: number;
  tasks: SyncTask[];
}> {
  try {
    logger.info('开始一键同步所有UP主');
    
    if (syncQueue.isRunning) {
      throw new Error('同步任务正在运行中');
    }

    const uploaders = await getAllActiveUploaders();
    
    if (uploaders.length === 0) {
      logger.info('没有激活的UP主需要同步');
      syncQueue.isRunning = false;
      return {
        success: true,
        totalSynced: 0,
        totalErrors: 0,
        tasks: [],
      };
    }

    syncQueue.tasks = uploaders.map(uploader => ({
      mid: uploader.mid,
      name: uploader.name || '未知UP主',
      status: 'pending',
      synced: 0,
      errors: 0,
    }));
    
    syncQueue.isRunning = true;
    syncQueue.totalTasks = uploaders.length;
    syncQueue.currentIndex = 0;
    syncQueue.completedTasks = 0;
    syncQueue.failedTasks = 0;
    syncQueue.totalSynced = 0;
    syncQueue.totalErrors = 0;

    logger.info(`开始同步 ${uploaders.length} 个UP主`);

    for (let i = 0; i < uploaders.length; i++) {
      // 检查是否被取消
      if (!syncQueue.isRunning) {
        logger.info('同步任务已被取消');
        break;
      }
      
      syncQueue.currentIndex = i;
      const task = syncQueue.tasks[i];
      
      task.status = 'running';
      task.startTime = new Date();
      
      try {
        logger.info(`[${i + 1}/${uploaders.length}] 开始同步UP主: ${task.name} (${task.mid})`);
        
        const result = await syncUploaderVideosWithRetry(task.mid, maxResults);
        
        task.status = 'completed';
        task.synced = result.synced;
        task.errors = result.errors;
        task.endTime = new Date();
        
        syncQueue.completedTasks++;
        syncQueue.totalSynced += result.synced;
        syncQueue.totalErrors += result.errors;
        
        logger.info(`[${i + 1}/${uploaders.length}] UP主 ${task.name} 同步完成: ${result.synced}个成功, ${result.errors}个失败`);
      } catch (error: any) {
        task.status = 'failed';
        task.errors = 1;
        task.error = error.message;
        task.endTime = new Date();
        
        syncQueue.failedTasks++;
        syncQueue.totalErrors++;
        
        logger.error(`[${i + 1}/${uploaders.length}] UP主 ${task.name} 同步失败: ${error.message}`);
      }

      // 在UP主之间添加延迟，避免限流
      if (i < uploaders.length - 1 && syncQueue.isRunning) {
        const delay = calculateDelay(i, uploaders.length);
        logger.info(`等待 ${delay}ms 后继续下一个UP主...`);
        await sleep(delay);
      }
    }

    syncQueue.isRunning = false;
    
    logger.info(`一键同步完成: 总共 ${syncQueue.totalSynced} 个视频成功, ${syncQueue.totalErrors} 个失败`);
    
    return {
      success: true,
      totalSynced: syncQueue.totalSynced,
      totalErrors: syncQueue.totalErrors,
      tasks: syncQueue.tasks,
    };
  } catch (error: any) {
    syncQueue.isRunning = false;
    logger.error('一键同步失败:', error);
    throw error;
  }
}

async function syncUploaderVideosWithRetry(mid: string, maxResults: number, attempt: number = 1): Promise<{
  synced: number;
  errors: number;
}> {
  try {
    return await syncUploaderVideos(mid, maxResults);
  } catch (error: any) {
    if (attempt < SYNC_CONFIG.maxRetries) {
      const delay = SYNC_CONFIG.baseDelay * attempt;
      logger.warn(`UP主 ${mid} 同步失败，第 ${attempt} 次重试，等待 ${delay}ms...`);
      await sleep(delay);
      return syncUploaderVideosWithRetry(mid, maxResults, attempt + 1);
    }
    throw error;
  }
}

function calculateDelay(currentIndex: number, totalTasks: number): number {
  const progress = currentIndex / totalTasks;
  
  if (progress < 0.3) {
    return SYNC_CONFIG.rateLimitDelay;
  } else if (progress < 0.6) {
    return SYNC_CONFIG.rateLimitDelay * 1.5;
  } else if (progress < 0.8) {
    return SYNC_CONFIG.rateLimitDelay * 2;
  } else {
    return SYNC_CONFIG.rateLimitDelay * 3;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getSyncQueueStatus(): SyncQueue {
  return {
    ...syncQueue,
    tasks: syncQueue.tasks.map(task => ({ ...task })),
  };
}

export function isSyncRunning(): boolean {
  return syncQueue.isRunning;
}

export function cancelSync(): void {
  if (syncQueue.isRunning) {
    logger.info('取消同步任务');
    syncQueue.isRunning = false;
    
    const currentTask = syncQueue.tasks[syncQueue.currentIndex];
    if (currentTask && currentTask.status === 'running') {
      currentTask.status = 'failed';
      currentTask.error = '用户取消';
      currentTask.endTime = new Date();
    }
  }
}