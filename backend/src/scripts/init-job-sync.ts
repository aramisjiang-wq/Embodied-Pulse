/**
 * 初始化招聘信息同步定时任务
 * 在服务器启动时自动启动定时任务
 */

import { logger } from '../utils/logger';
import JobSyncScheduler from '../services/job-sync-scheduler.service';

let schedulerInstance: JobSyncScheduler | null = null;

export function initJobSyncScheduler(): JobSyncScheduler {
  if (!schedulerInstance) {
    logger.info('初始化招聘信息同步定时任务');
    schedulerInstance = new JobSyncScheduler();
    
    schedulerInstance.startDailySchedule('0 2 * * *');
    
    logger.info('招聘信息同步定时任务已启动，将在每天凌晨2点执行');
  }
  
  return schedulerInstance;
}

export function getJobSyncScheduler(): JobSyncScheduler | null {
  return schedulerInstance;
}
