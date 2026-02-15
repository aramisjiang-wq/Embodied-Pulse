/**
 * 招聘信息同步定时任务
 * 用于每日自动更新招聘信息
 */

import { logger } from '../utils/logger';
import JobScraper from './job-scraper.service';
import JobDataCleaner from './job-cleaner.service';
import adminPrisma from '../config/database.admin';

export class JobSyncScheduler {
  private scraper: JobScraper;
  private cleaner: JobDataCleaner;
  private isRunning: boolean = false;

  constructor() {
    this.scraper = new JobScraper();
    this.cleaner = new JobDataCleaner();
  }

  async syncJobs(): Promise<{
    success: boolean;
    sources: number;
    scraped: number;
    cleaned: number;
    deduplicated: number;
    filtered: number;
    saved: number;
    duration: number;
    error?: string;
  }> {
    if (this.isRunning) {
      logger.warn('招聘信息同步任务已在运行中，跳过本次执行');
      return {
        success: false,
        sources: 0,
        scraped: 0,
        cleaned: 0,
        deduplicated: 0,
        filtered: 0,
        saved: 0,
        duration: 0,
        error: '任务已在运行中',
      };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('开始执行招聘信息同步任务');

      const scrapingResults = await this.scraper.scrapeAllSources();
      
      const allJobs = scrapingResults.flatMap(result => result.jobs);
      const successfulSources = scrapingResults.filter(r => r.success).length;

      logger.info(`从 ${successfulSources} 个数据源抓取到 ${allJobs.length} 条招聘信息`);

      const processingResult = await this.cleaner.processJobs(allJobs);

      await this.logSyncResult({
        sources: successfulSources,
        scraped: allJobs.length,
        ...processingResult,
      });

      const duration = Date.now() - startTime;
      logger.info(`招聘信息同步任务完成，耗时 ${duration}ms`, processingResult);

      return {
        success: true,
        sources: successfulSources,
        scraped: allJobs.length,
        ...processingResult,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('招聘信息同步任务失败:', error);

      return {
        success: false,
        sources: 0,
        scraped: 0,
        cleaned: 0,
        deduplicated: 0,
        filtered: 0,
        saved: 0,
        duration,
        error: error.message,
      };
    } finally {
      this.isRunning = false;
    }
  }

  private async logSyncResult(result: any): Promise<void> {
    try {
      logger.info('招聘信息同步结果:', result);
    } catch (error: any) {
      logger.error('记录同步结果失败:', error);
    }
  }

  startDailySchedule(cronExpression: string = '0 2 * * *'): void {
    logger.info(`启动每日招聘信息同步任务，Cron表达式: ${cronExpression}`);

    const cron = require('node-cron');
    
    cron.schedule(cronExpression, async () => {
      logger.info('定时任务触发：开始招聘信息同步');
      await this.syncJobs();
    });

    logger.info('定时任务已启动，将在每天凌晨2点执行同步任务');
  }

  startHourlySchedule(): void {
    logger.info('启动每小时招聘信息同步任务');

    const cron = require('node-cron');
    
    cron.schedule('0 * * * *', async () => {
      logger.info('定时任务触发：开始招聘信息同步');
      await this.syncJobs();
    });

    logger.info('定时任务已启动，将在每小时执行同步任务');
  }

  startCustomSchedule(cronExpression: string): void {
    logger.info(`启动自定义招聘信息同步任务，Cron表达式: ${cronExpression}`);

    const cron = require('node-cron');
    
    cron.schedule(cronExpression, async () => {
      logger.info('定时任务触发：开始招聘信息同步');
      await this.syncJobs();
    });

    logger.info(`定时任务已启动，Cron表达式: ${cronExpression}`);
  }

  async manualSync(): Promise<any> {
    logger.info('手动触发招聘信息同步任务');
    return await this.syncJobs();
  }

  isSyncRunning(): boolean {
    return this.isRunning;
  }
}

export default JobSyncScheduler;
