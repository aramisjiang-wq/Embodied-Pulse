/**
 * 定时任务调度器
 * 负责定时同步第三方API数据到数据库
 */

import * as cron from 'node-cron';
import { syncArxivPapers } from './arxiv.sync';
import { syncGithubRepos } from './github.sync';
import { syncHuggingFaceModels } from './huggingface.sync';
import { syncRecentHuggingFacePapers } from './huggingface-papers.sync';
import { syncBilibiliVideos } from './bilibili.sync';
import { syncVideosByKeywords } from './bilibili-search.sync';
import { syncYouTubeVideos } from './youtube.sync';
import { syncJobsFromGithub } from './jobs.sync';
import { sync36krNews } from './36kr.sync';
import { syncTechNews } from './tech-news.sync';
import { syncSemanticScholarPapers } from './semantic-scholar.sync';
import { syncHotNews } from './hot-news.sync';
import { syncDailyHotApi } from './dailyhot-api.sync';
import { dailySmartFilter } from './smart-news-filter.sync';
import { syncPapersByKeywords } from './paper-search.sync';
import { logger } from '../../utils/logger';
import { smartSyncAllUploaders } from '../smart-sync.service';

/**
 * 同步所有数据源
 */
export async function syncAllData() {
  logger.info('开始全量数据同步...');
  
  try {
    // 并行同步所有数据源
    await Promise.allSettled([
      syncArxivPapers('embodied AI', 50),
      syncGithubRepos('embodied intelligence', 30),
      syncHuggingFaceModels('robotics', 30),
      smartSyncAllUploaders(999999, { forceFullSync: true }),
      syncYouTubeVideos(undefined, 20), // 使用扩展关键词库
      syncBilibiliVideos(undefined, 20), // 使用扩展关键词库
      syncTechNews(50),
      syncHotNews('baidu', 50),
      syncDailyHotApi('baidu', 50),
    ]);
    
    logger.info('全量数据同步完成');
  } catch (error) {
    logger.error('全量数据同步失败:', error);
  }
}

/**
 * 启动定时任务
 */
export function startCronJobs() {
  logger.info('启动定时任务调度器...');
  
  // 1. 每天凌晨2点全量同步
  cron.schedule('0 2 * * *', async () => {
    logger.info('[定时任务] 开始每日全量数据同步');
    try {
      await syncAllData();
      logger.info('[定时任务] 每日全量数据同步完成');
    } catch (error: any) {
      logger.error('[定时任务] 每日全量数据同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // 2. 每6小时同步arXiv论文（最活跃）
  cron.schedule('0 */6 * * *', async () => {
    logger.info('[定时任务] 同步arXiv论文');
    try {
      const result = await syncArxivPapers('embodied AI', 20);
      logger.info(`[定时任务] arXiv论文同步完成: 成功 ${result.synced} 篇, 失败 ${result.errors} 篇`);
    } catch (error: any) {
      logger.error('[定时任务] arXiv论文同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // 2.1 每6小时根据论文搜索关键词同步论文
  cron.schedule('30 */6 * * *', async () => {
    logger.info('[定时任务] 根据论文搜索关键词同步论文');
    try {
      const result = await syncPapersByKeywords('all', 7, 20);
      logger.info(`[定时任务] 论文关键词同步完成: 成功 ${result.synced} 篇, 失败 ${result.errors} 篇, 关键词 ${result.keywords} 个`);
    } catch (error: any) {
      logger.error('[定时任务] 论文关键词同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // 2.1 每12小时同步Semantic Scholar论文（补充arXiv，如果限流则跳过）
  cron.schedule('30 */12 * * *', async () => {
    logger.info('[定时任务] 同步Semantic Scholar论文');
    try {
      const result = await syncSemanticScholarPapers(
        'embodied AI OR robotics OR computer vision',
        50,
        new Date().getFullYear(),
        ['Computer Science', 'Robotics'],
        true // skipOnRateLimit=true，如果限流则跳过，不阻塞其他任务
      );
      if (result.success) {
        logger.info(`[定时任务] Semantic Scholar论文同步完成: 成功 ${result.synced} 篇, 失败 ${result.errors} 篇`);
      } else {
        // 如果是限流，只记录警告，不记录为错误
        if (result.message?.includes('限流') || result.message?.includes('跳过')) {
          logger.warn(`[定时任务] Semantic Scholar论文同步跳过（限流）: ${result.message}`);
        } else {
          logger.warn(`[定时任务] Semantic Scholar论文同步失败: ${result.message || '未知错误'}`);
        }
      }
    } catch (error: any) {
      // 限流错误不记录为严重错误
      if (error.message?.includes('限流')) {
        logger.warn('[定时任务] Semantic Scholar论文同步跳过（限流）:', error.message);
      } else {
        logger.error('[定时任务] Semantic Scholar论文同步失败:', error.message);
      }
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // 3. 每8小时同步GitHub项目
  cron.schedule('0 */8 * * *', async () => {
    logger.info('[定时任务] 同步GitHub项目');
    try {
      const result = await syncGithubRepos('embodied intelligence', 15);
      logger.info(`[定时任务] GitHub项目同步完成: 成功 ${result.synced} 个, 失败 ${result.errors} 个`);
    } catch (error: any) {
      logger.error('[定时任务] GitHub项目同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // 4. 每12小时同步视频内容
  cron.schedule('0 */12 * * *', async () => {
    logger.info('[定时任务] 同步视频内容');
    try {
      const results = await Promise.allSettled([
        syncBilibiliVideos(undefined, 10), // 使用扩展关键词库
        syncYouTubeVideos(undefined, 10), // 使用扩展关键词库
      ]);
      
      const bilibiliResult = results[0].status === 'fulfilled' ? results[0].value : null;
      const youtubeResult = results[1].status === 'fulfilled' ? results[1].value : null;
      
      logger.info(`[定时任务] 视频内容同步完成: Bilibili ${bilibiliResult?.synced || 0} 个, YouTube ${youtubeResult?.synced || 0} 个`);
      
      if (results[0].status === 'rejected') {
        logger.error('[定时任务] Bilibili视频同步失败:', results[0].reason);
      }
      if (results[1].status === 'rejected') {
        logger.error('[定时任务] YouTube视频同步失败:', results[1].reason);
      }
    } catch (error: any) {
      logger.error('[定时任务] 视频内容同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // 4.1 每6小时根据Bilibili搜索关键词同步视频
  cron.schedule('30 */6 * * *', async () => {
    logger.info('[定时任务] 根据Bilibili搜索关键词同步视频');
    try {
      const result = await syncVideosByKeywords(7, 20);
      logger.info(`[定时任务] Bilibili关键词同步完成: 成功 ${result.synced} 个, 失败 ${result.errors} 个, 关键词 ${result.keywords} 个`);
    } catch (error: any) {
      logger.error('[定时任务] Bilibili关键词同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // 5. 每12小时同步HuggingFace模型
  cron.schedule('30 */12 * * *', async () => {
    logger.info('[定时任务] 同步HuggingFace模型');
    try {
      const result = await syncHuggingFaceModels('robotics', 15);
      logger.info(`[定时任务] HuggingFace模型同步完成: 成功 ${result.synced} 个, 失败 ${result.errors} 个`);
    } catch (error: any) {
      logger.error('[定时任务] HuggingFace模型同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });

  // 5.1 每天凌晨1点同步HuggingFace论文（每天更新）
  cron.schedule('0 1 * * *', async () => {
    logger.info('[定时任务] 同步HuggingFace论文（每天）');
    try {
      const result = await syncRecentHuggingFacePapers(1, 50);
      logger.info(`[定时任务] HuggingFace论文同步完成: 成功 ${result.synced} 篇, 失败 ${result.errors} 篇`);
    } catch (error: any) {
      logger.error('[定时任务] HuggingFace论文同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // 6. 每天凌晨3点同步GitHub岗位（在arXiv之后，避免冲突）
  cron.schedule('0 3 * * *', async () => {
    logger.info('[定时任务] 同步GitHub岗位');
    try {
      await syncJobsFromGithub({ maxResults: 200 });
    } catch (error: any) {
      logger.error('[定时任务] GitHub岗位同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai'
  });
  
  // 7. 每天凌晨4点同步科技新闻（TechCrunch等，作为36kr的替代）
  cron.schedule('0 4 * * *', async () => {
    logger.info('[定时任务] 同步科技新闻');
    try {
      // 先尝试36kr（如果可用）
      try {
        const result36kr = await sync36krNews(50, true);
        if (result36kr.success && result36kr.synced > 0) {
          logger.info(`[定时任务] 36kr新闻同步完成: 成功 ${result36kr.synced} 条`);
        }
      } catch (error: any) {
        logger.warn(`[定时任务] 36kr新闻同步失败，使用科技新闻源: ${error.message}`);
      }
      
      // 同步科技新闻（TechCrunch等）
      const result = await syncTechNews(50);
      if (result.success) {
        logger.info(`[定时任务] 科技新闻同步完成: 成功 ${result.synced} 条, 失败 ${result.errors} 条, 总计 ${result.total} 条`);
      } else {
        logger.warn(`[定时任务] 科技新闻同步完成但无数据: ${result.message || '未获取到任何新闻'}`);
      }
    } catch (error: any) {
      logger.error('[定时任务] 科技新闻同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // 8. 每天凌晨5点智能筛选相关新闻（在36kr同步之后）
  cron.schedule('0 5 * * *', async () => {
    logger.info('[定时任务] 开始智能筛选相关新闻');
    try {
      await dailySmartFilter();
    } catch (error: any) {
      logger.error('[定时任务] 智能筛选失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai'
  });
  
  // 9. 每天凌晨6点同步热点新闻（hot_news API）
  cron.schedule('0 6 * * *', async () => {
    logger.info('[定时任务] 同步热点新闻（hot_news）');
    try {
      const result = await syncHotNews('baidu', 50);
      logger.info(`[定时任务] 热点新闻同步完成: 成功 ${result.synced} 条, 失败 ${result.errors} 条`);
    } catch (error: any) {
      logger.error('[定时任务] 热点新闻同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // 10. 每天凌晨6点30分同步DailyHotApi新闻
  cron.schedule('30 6 * * *', async () => {
    logger.info('[定时任务] 同步DailyHotApi新闻');
    try {
      const result = await syncDailyHotApi('baidu', 50);
      logger.info(`[定时任务] DailyHotApi同步完成: 成功 ${result.synced} 条, 失败 ${result.errors} 条`);
    } catch (error: any) {
      logger.error('[定时任务] DailyHotApi同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  logger.info('定时任务调度器启动成功');
  logger.info('任务列表:');
  logger.info('  - 每天凌晨1点: HuggingFace论文同步（每天更新）');
  logger.info('  - 每天凌晨2点: 全量数据同步');
  logger.info('  - 每天凌晨3点: GitHub岗位同步');
  logger.info('  - 每天凌晨4点: 科技新闻同步（36kr + TechCrunch等）');
  logger.info('  - 每天凌晨5点: 智能筛选相关新闻');
  logger.info('  - 每天凌晨6点: 热点新闻同步（hot_news）');
  logger.info('  - 每天凌晨6点30分: DailyHotApi新闻同步');
  logger.info('  - 每6小时: arXiv论文同步');
  logger.info('  - 每6小时: 论文搜索关键词同步（最近7天）');
  logger.info('  - 每6小时: Bilibili搜索关键词同步（最近7天）');
  logger.info('  - 每12小时: Semantic Scholar论文同步（补充arXiv）');
  logger.info('  - 每8小时: GitHub项目同步');
  logger.info('  - 每12小时: 视频内容同步（Bilibili + YouTube）');
  logger.info('  - 每12小时: HuggingFace模型同步');
  logger.info('');
  logger.info('注意: 定时任务已启用，所有任务都会在指定时间自动执行');
  logger.info('时区: Asia/Shanghai');
}

/**
 * 停止所有定时任务
 */
export function stopCronJobs() {
  logger.info('停止定时任务调度器...');
  // node-cron会自动管理任务生命周期
}
