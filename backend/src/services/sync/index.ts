/**
 * 数据同步服务统一导出
 * 提供定时同步任务和手动同步接口
 */

import { syncArxivPapers, syncArxivByCategory } from './arxiv.sync';
import { syncGithubRepos, syncGithubByLanguage } from './github.sync';
import { syncHuggingFaceModels, syncHuggingFaceByTask } from './huggingface.sync';
import { syncHuggingFacePapersByDate, syncRecentHuggingFacePapers } from './huggingface-papers.sync';
import { syncBilibiliVideos, syncBilibiliHotVideos, syncBilibiliTechVideos } from './bilibili.sync';
import { syncYouTubeVideos, syncYouTubePopularVideos } from './youtube.sync';
import { syncJobsFromGithub } from './jobs.sync';
import { syncHotNews, syncHotNewsByPlatforms } from './hot-news.sync';
import { syncDailyHotApi, syncDailyHotApiByPlatforms } from './dailyhot-api.sync';
import { sync36krNews } from './36kr.sync';
import { syncTechNews, syncTechNewsBySource } from './tech-news.sync';
import { syncSemanticScholarPapers } from './semantic-scholar.sync';
import { dailySmartFilter } from './smart-news-filter.sync';
import { syncPapersByKeywords, syncAdminKeywordPapers, syncUserKeywordPapers, syncAllKeywordPapers } from './paper-search.sync';
import { syncVideosByKeywords, syncRecentVideos } from './bilibili-search.sync';
import { logger } from '../../utils/logger';

/**
 * 同步所有第三方数据
 */
export async function syncAllData() {
  logger.info('========== 开始同步所有第三方数据 ==========');
  
  const results = {
    arxiv: { success: false, synced: 0, errors: 0 },
    semanticScholar: { success: false, synced: 0, errors: 0 },
    github: { success: false, synced: 0, errors: 0 },
    huggingface: { success: false, synced: 0, errors: 0 },
    bilibili: { success: false, synced: 0, errors: 0 },
    youtube: { success: false, synced: 0, errors: 0 },
    jobs: { success: false, synced: 0, errors: 0 },
    techNews: { success: false, synced: 0, errors: 0 },
    hotNews: { success: false, synced: 0, errors: 0 },
    dailyHotApi: { success: false, synced: 0, errors: 0 },
    smartFilter: { success: false, synced: 0, errors: 0 },
  };

  try {
    // 1. 同步arXiv论文 (具身智能相关，今天最新)
    logger.info('1/11 同步arXiv论文（今天最新）...');
    // 格式化日期为arXiv API格式 (YYYYMMDDHHMMSS)
    const formatArxivDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    };
    // 计算1年前的日期
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const startDate = formatArxivDate(oneYearAgo);
    const now = new Date();
    const endDate = formatArxivDate(now);
    // 同步多个相关领域的论文
    const categories = [
      'cs.RO', // Robotics
      'cs.AI', // Artificial Intelligence
      'cs.CV', // Computer Vision
      'cs.LG', // Machine Learning
    ];
    let totalSynced = 0;
    let totalErrors = 0;
    for (const category of categories) {
      try {
        const result = await syncArxivPapers(`cat:${category}`, 500, startDate, endDate);
        totalSynced += result.synced;
        totalErrors += result.errors;
      } catch (error: any) {
        logger.error(`同步分类 ${category} 失败:`, error.message);
        totalErrors++;
      }
    }
    results.arxiv = { success: true, synced: totalSynced, errors: totalErrors };
  } catch (error: any) {
    logger.error(`arXiv同步失败: ${error.message}`);
  }

  try {
    // 2. 同步Semantic Scholar论文（补充arXiv，获取更全面的论文数据）
    // 如果限流则跳过，不阻塞其他数据源同步
    logger.info('2/11 同步Semantic Scholar论文（最新）...');
    const semanticResult = await syncSemanticScholarPapers(
      'embodied AI OR robotics OR computer vision',
      100,
      new Date().getFullYear(),
      ['Computer Science', 'Robotics'],
      true // skipOnRateLimit=true，如果限流则跳过
    );
    results.semanticScholar = {
      success: semanticResult.success,
      synced: semanticResult.synced,
      errors: semanticResult.errors,
    };
    
    if (!semanticResult.success && semanticResult.message?.includes('限流')) {
      logger.warn(`Semantic Scholar同步跳过（限流），继续同步其他数据源`);
    }
  } catch (error: any) {
    // 限流错误不记录为严重错误
    if (error.message?.includes('限流')) {
      logger.warn(`Semantic Scholar同步跳过（限流）: ${error.message}`);
    } else {
      logger.error(`Semantic Scholar同步失败: ${error.message}`);
    }
  }

  try {
    // 3. 同步GitHub项目 (机器人、具身智能相关，获取最新)
    logger.info('3/11 同步GitHub项目（最新）...');
    results.github = await syncGithubRepos('embodied-ai OR robotics OR computer-vision stars:>50', 200);
  } catch (error: any) {
    logger.error(`GitHub同步失败: ${error.message}`);
  }

  try {
    // 4. 同步HuggingFace模型 (视觉、多模态模型，获取最新)
    logger.info('4/11 同步HuggingFace模型（最新）...');
    results.huggingface = await syncHuggingFaceModels('robotics', 200);
  } catch (error: any) {
    logger.error(`HuggingFace同步失败: ${error.message}`);
  }

  try {
    // 5. 同步Bilibili视频 (机器人、具身智能相关，获取最新)
    logger.info('5/11 同步Bilibili视频（最新）...');
    results.bilibili = await syncBilibiliVideos('机器人 OR 具身智能', 100);
  } catch (error: any) {
    logger.error(`Bilibili同步失败: ${error.message}`);
  }

  try {
    // 6. 同步YouTube视频 (如果配置了API Key)
    if (process.env.YOUTUBE_API_KEY) {
      logger.info('6/11 同步YouTube视频...');
      results.youtube = await syncYouTubeVideos('embodied AI OR robotics', 100);
    } else {
      logger.info('6/11 跳过YouTube视频同步（未配置YOUTUBE_API_KEY）');
    }
  } catch (error: any) {
    logger.error(`YouTube同步失败: ${error.message}`);
  }

  try {
    // 7. 同步GitHub岗位
    logger.info('7/11 同步GitHub岗位...');
    await syncJobsFromGithub({ maxResults: 200 });
    results.jobs = { success: true, synced: 200, errors: 0 };
  } catch (error: any) {
    logger.error(`GitHub岗位同步失败: ${error.message}`);
  }

  try {
    // 8. 同步科技新闻（TechCrunch等）
    logger.info('8/11 同步科技新闻...');
    const techNewsResult = await syncTechNews(100);
    results.techNews = {
      success: techNewsResult.success,
      synced: techNewsResult.synced,
      errors: techNewsResult.errors,
    };
  } catch (error: any) {
    logger.error(`科技新闻同步失败: ${error.message}`);
  }

  try {
    // 9. 同步热点新闻（hot_news）
    logger.info('9/11 同步热点新闻...');
    const hotNewsResult = await syncHotNews('baidu', 100);
    results.hotNews = {
      success: hotNewsResult.success,
      synced: hotNewsResult.synced,
      errors: hotNewsResult.errors,
    };
  } catch (error: any) {
    logger.error(`热点新闻同步失败: ${error.message}`);
  }

  try {
    // 10. 同步DailyHotApi新闻
    logger.info('10/11 同步DailyHotApi新闻...');
    const dailyHotResult = await syncDailyHotApi('baidu', 100);
    results.dailyHotApi = {
      success: dailyHotResult.success,
      synced: dailyHotResult.synced,
      errors: dailyHotResult.errors,
    };
  } catch (error: any) {
    logger.error(`DailyHotApi同步失败: ${error.message}`);
  }

  try {
    // 11. 智能筛选相关新闻
    logger.info('11/11 智能筛选相关新闻...');
    await dailySmartFilter();
    results.smartFilter = { success: true, synced: 0, errors: 0 };
  } catch (error: any) {
    logger.error(`智能筛选失败: ${error.message}`);
  }

  logger.info('========== 数据同步完成 ==========');
  logger.info(`arXiv: ${results.arxiv.synced} 篇`);
  logger.info(`Semantic Scholar: ${results.semanticScholar.synced} 篇`);
  logger.info(`GitHub: ${results.github.synced} 个`);
  logger.info(`HuggingFace: ${results.huggingface.synced} 个`);
  logger.info(`Bilibili: ${results.bilibili.synced} 个`);
  logger.info(`YouTube: ${results.youtube.synced} 个`);
  logger.info(`GitHub岗位: ${results.jobs.synced} 个`);
  logger.info(`科技新闻: ${results.techNews.synced} 条`);
  logger.info(`热点新闻: ${results.hotNews.synced} 条`);
  logger.info(`DailyHotApi: ${results.dailyHotApi.synced} 条`);

  return results;
}

/**
 * 同步具身智能核心数据
 */
export async function syncEmbodiedAIData() {
  logger.info('========== 同步具身智能核心数据 ==========');

  const results = [];

  // arXiv - 机器人和具身AI
  results.push(await syncArxivByCategory('cs.RO', 50));
  results.push(await syncArxivByCategory('cs.AI', 50));

  // GitHub - Python/C++机器人项目
  results.push(await syncGithubByLanguage('Python', 'robotics', 30));
  results.push(await syncGithubByLanguage('C++', 'robotics', 30));

  // HuggingFace - 视觉和强化学习模型
  results.push(await syncHuggingFaceByTask('vision', 30));
  results.push(await syncHuggingFaceByTask('robotics', 30));

  // Bilibili - 机器人和具身智能视频
  results.push(await syncBilibiliVideos('机器人', 30));
  results.push(await syncBilibiliVideos('具身智能', 20));
  results.push(await syncBilibiliTechVideos(30));

  // YouTube - 如果配置了API Key
  if (process.env.YOUTUBE_API_KEY) {
    results.push(await syncYouTubeVideos('embodied AI', 30));
    results.push(await syncYouTubeVideos('robotics', 30));
  }

  logger.info('========== 具身智能数据同步完成 ==========');
  
  return results;
}

// 导出各个同步函数
export {
  syncArxivPapers,
  syncArxivByCategory,
  syncGithubRepos,
  syncGithubByLanguage,
  syncHuggingFaceModels,
  syncHuggingFaceByTask,
  syncHuggingFacePapersByDate,
  syncRecentHuggingFacePapers,
  syncBilibiliVideos,
  syncBilibiliHotVideos,
  syncBilibiliTechVideos,
  syncYouTubeVideos,
  syncYouTubePopularVideos,
  syncJobsFromGithub,
  syncHotNews,
  syncHotNewsByPlatforms,
  syncDailyHotApi,
  syncDailyHotApiByPlatforms,
  sync36krNews,
  syncTechNews,
  syncTechNewsBySource,
  syncSemanticScholarPapers,
  syncPapersByKeywords,
  syncAdminKeywordPapers,
  syncUserKeywordPapers,
  syncAllKeywordPapers,
  syncVideosByKeywords,
  syncRecentVideos,
};
