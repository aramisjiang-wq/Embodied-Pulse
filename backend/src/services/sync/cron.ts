/**
 * 定时任务调度器
 * 负责定时同步第三方API数据到数据库
 * 
 * 稳定性措施：
 * 1. 每个任务独立执行，失败不影响其他任务
 * 2. 内置重试机制和错误处理
 * 3. 请求间隔控制，避免触发API限流
 * 4. 详细的日志记录，便于问题排查
 */

import * as cron from 'node-cron';
import { syncArxivPapers, syncArxivByCategory } from './arxiv.sync';
import { syncGithubRepos } from './github.sync';
import { syncHuggingFaceModels } from './huggingface.sync';
import { syncBilibiliVideos } from './bilibili.sync';
import { syncVideosByKeywords } from './bilibili-search.sync';
import { syncLimXJobs } from './limx-jobs.sync';
import { syncSemanticScholarPapers } from './semantic-scholar.sync';
import { syncPapersByKeywords } from './paper-search.sync';
import { logger } from '../../utils/logger';
import { smartSyncAllUploaders } from '../smart-sync.service';

// arXiv分类列表（全量同步时使用）
const ARXIV_CATEGORIES = [
  'cs.AI',   // 人工智能
  'cs.RO',   // 机器人
  'cs.CV',   // 计算机视觉
  'cs.LG',   // 机器学习
  'cs.CL',   // 计算与语言
  'cs.NE',   // 神经与进化计算
  'cs.MA',   // 多智能体系统
  'eess.SY', // 系统与控制
];

// 请求间隔控制（毫秒）
const REQUEST_DELAY = {
  betweenCategories: 3000,  // 分类之间间隔3秒
  afterError: 5000,         // 错误后等待5秒
  betweenKeywords: 2000,    // 关键词之间间隔2秒
};

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 全量同步所有arXiv分类论文
 * 规则：遍历所有分类，每个分类最多100篇，不限制总数量
 */
async function syncAllArxivCategories() {
  logger.info('[全量同步] 开始同步所有arXiv分类论文...');
  
  let totalSynced = 0;
  let totalErrors = 0;
  const results: { category: string; synced: number; errors: number }[] = [];
  
  for (const category of ARXIV_CATEGORIES) {
    try {
      logger.info(`[全量同步] 同步分类: ${category}`);
      const result = await syncArxivByCategory(category, 100);
      totalSynced += result.synced;
      totalErrors += result.errors;
      results.push({ category, synced: result.synced, errors: result.errors });
      
      // 分类之间添加延迟，避免触发限流
      if (category !== ARXIV_CATEGORIES[ARXIV_CATEGORIES.length - 1]) {
        await delay(REQUEST_DELAY.betweenCategories);
      }
    } catch (error: any) {
      logger.error(`[全量同步] 分类 ${category} 同步失败:`, error.message);
      totalErrors++;
      results.push({ category, synced: 0, errors: 1 });
      
      // 错误后等待更长时间
      await delay(REQUEST_DELAY.afterError);
    }
  }
  
  logger.info(`[全量同步] arXiv全量同步完成: 总成功 ${totalSynced} 篇, 总失败 ${totalErrors} 篇`);
  results.forEach(r => {
    logger.info(`  - ${r.category}: 成功 ${r.synced} 篇, 失败 ${r.errors} 篇`);
  });
  
  return { synced: totalSynced, errors: totalErrors };
}

/**
 * 全量同步论文关键词（不限制数量）
 */
async function syncAllPapersByKeywords() {
  logger.info('[全量同步] 开始同步所有论文关键词...');
  
  try {
    // 不限制数量，每关键词最多100篇
    const result = await syncPapersByKeywords('all', 30, 100);
    logger.info(`[全量同步] 论文关键词同步完成: 成功 ${result.synced} 篇, 关键词 ${result.keywords} 个`);
    return result;
  } catch (error: any) {
    logger.error(`[全量同步] 论文关键词同步失败:`, error.message);
    throw error;
  }
}

/**
 * 全量同步Bilibili关键词视频（不限制数量）
 */
async function syncAllBilibiliKeywords() {
  logger.info('[全量同步] 开始同步所有Bilibili关键词视频...');
  
  try {
    // 不限制数量，每关键词最多100条
    const result = await syncVideosByKeywords(30, 100);
    logger.info(`[全量同步] Bilibili关键词同步完成: 成功 ${result.synced} 条, 关键词 ${result.keywords} 个`);
    return result;
  } catch (error: any) {
    logger.error(`[全量同步] Bilibili关键词同步失败:`, error.message);
    throw error;
  }
}

/**
 * 全量同步Semantic Scholar论文（不限制数量，依次补充）
 */
async function syncAllSemanticScholar() {
  logger.info('[全量同步] 开始同步Semantic Scholar论文...');
  
  try {
    // 不限制数量，每次最多100篇
    const result = await syncSemanticScholarPapers(
      'embodied AI OR robotics OR computer vision OR machine learning',
      100,  // 不限制，每次最多100篇
      new Date().getFullYear(),
      ['Computer Science', 'Robotics'],
      false  // 不跳过限流，会重试
    );
    
    if (result.success) {
      logger.info(`[全量同步] Semantic Scholar同步完成: 成功 ${result.synced} 篇`);
    } else {
      logger.warn(`[全量同步] Semantic Scholar同步部分失败: ${result.message}`);
    }
    return result;
  } catch (error: any) {
    logger.error(`[全量同步] Semantic Scholar同步失败:`, error.message);
    throw error;
  }
}

/**
 * 同步所有数据源
 * 
 * 全量同步规则（每任务最高100个）：
 * 1. arXiv论文：遍历所有分类，每个分类最多100篇
 * 2. GitHub项目：搜索关键词，最多100个
 * 3. HuggingFace模型：搜索关键词，最多100个
 * 4. Bilibili视频：根据UP主列表同步，最多100条
 * 5. 论文关键词：同步所有关键词，每关键词最多100篇
 * 6. Bilibili关键词：同步所有关键词，每关键词最多100条
 * 7. Semantic Scholar：补充同步，每次最多100篇
 */
export async function syncAllData() {
  logger.info('========================================');
  logger.info('开始全量数据同步...');
  logger.info('========================================');
  logger.info('同步规则:');
  logger.info('  - arXiv: 8个分类，每分类最多100篇');
  logger.info('  - GitHub: embodied intelligence，最多100个');
  logger.info('  - HuggingFace模型: robotics，最多100个');
  logger.info('  - Bilibili视频: UP主视频，最多100条');
  logger.info('  - 论文关键词: 所有关键词，每关键词最多100篇');
  logger.info('  - Bilibili关键词: 所有关键词，每关键词最多100条');
  logger.info('  - Semantic Scholar: 补充同步，每次最多100篇');
  logger.info('========================================');
  
  const startTime = Date.now();
  const results: { name: string; status: string; synced: number; errors: number }[] = [];
  
  // 1. arXiv全量同步（所有分类）
  try {
    const result = await syncAllArxivCategories();
    results.push({ name: 'arXiv全量', status: 'success', synced: result.synced, errors: result.errors });
  } catch (error: any) {
    results.push({ name: 'arXiv全量', status: 'failed', synced: 0, errors: 1 });
  }
  
  await delay(REQUEST_DELAY.betweenCategories);
  
  // 2. GitHub项目同步
  try {
    const result = await syncGithubRepos('embodied intelligence', 100);
    results.push({ name: 'GitHub项目', status: 'success', synced: result.synced, errors: result.errors });
  } catch (error: any) {
    results.push({ name: 'GitHub项目', status: 'failed', synced: 0, errors: 1 });
    logger.error(`[全量同步] GitHub同步失败:`, error.message);
  }
  
  await delay(REQUEST_DELAY.betweenCategories);
  
  // 3. HuggingFace模型同步
  try {
    const result = await syncHuggingFaceModels('robotics', 100);
    results.push({ name: 'HuggingFace模型', status: 'success', synced: result.synced, errors: result.errors });
  } catch (error: any) {
    results.push({ name: 'HuggingFace模型', status: 'failed', synced: 0, errors: 1 });
    logger.error(`[全量同步] HuggingFace同步失败:`, error.message);
  }
  
  await delay(REQUEST_DELAY.betweenCategories);
  
  // 4. Bilibili视频同步
  try {
    const result = await syncBilibiliVideos(undefined, 100);
    results.push({ name: 'Bilibili视频', status: 'success', synced: result?.synced || 0, errors: result?.errors || 0 });
  } catch (error: any) {
    results.push({ name: 'Bilibili视频', status: 'failed', synced: 0, errors: 1 });
    logger.error(`[全量同步] Bilibili同步失败:`, error.message);
  }
  
  await delay(REQUEST_DELAY.betweenCategories);
  
  // 5. 论文关键词同步
  try {
    const result = await syncAllPapersByKeywords();
    results.push({ name: '论文关键词', status: 'success', synced: result.synced, errors: result.errors || 0 });
  } catch (error: any) {
    results.push({ name: '论文关键词', status: 'failed', synced: 0, errors: 1 });
  }
  
  await delay(REQUEST_DELAY.betweenCategories);
  
  // 6. Bilibili关键词同步
  try {
    const result = await syncAllBilibiliKeywords();
    results.push({ name: 'Bilibili关键词', status: 'success', synced: result.synced, errors: result.errors || 0 });
  } catch (error: any) {
    results.push({ name: 'Bilibili关键词', status: 'failed', synced: 0, errors: 1 });
  }
  
  await delay(REQUEST_DELAY.betweenCategories);
  
  // 7. Semantic Scholar补充同步
  try {
    const result = await syncAllSemanticScholar();
    results.push({ name: 'Semantic Scholar', status: 'success', synced: result.synced, errors: result.errors || 0 });
  } catch (error: any) {
    results.push({ name: 'Semantic Scholar', status: 'failed', synced: 0, errors: 1 });
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  logger.info('========================================');
  logger.info(`全量数据同步完成，耗时 ${duration} 秒`);
  logger.info('同步结果汇总:');
  results.forEach(r => {
    logger.info(`  - ${r.name}: ${r.status === 'success' ? '✅' : '❌'} 成功 ${r.synced}, 失败 ${r.errors}`);
  });
  logger.info('========================================');
}

/**
 * 启动定时任务
 */
export function startCronJobs() {
  logger.info('启动定时任务调度器...');
  
  // ========================================
  // 1. 每天凌晨2点全量同步
  // ========================================
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
  
  // ========================================
  // 2. 每6小时同步arXiv论文（全量，所有分类，不限数量）
  // ========================================
  cron.schedule('0 */6 * * *', async () => {
    logger.info('[定时任务] 同步arXiv论文（全量）');
    try {
      const result = await syncAllArxivCategories();
      logger.info(`[定时任务] arXiv论文同步完成: 成功 ${result.synced} 篇, 失败 ${result.errors} 篇`);
    } catch (error: any) {
      logger.error('[定时任务] arXiv论文同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // ========================================
  // 3. 每6小时根据论文搜索关键词同步论文（不限数量）
  // ========================================
  cron.schedule('30 */6 * * *', async () => {
    logger.info('[定时任务] 根据论文搜索关键词同步论文（不限数量）');
    try {
      const result = await syncPapersByKeywords('all', 30, 100);
      logger.info(`[定时任务] 论文关键词同步完成: 成功 ${result.synced} 篇, 失败 ${result.errors} 篇, 关键词 ${result.keywords} 个`);
    } catch (error: any) {
      logger.error('[定时任务] 论文关键词同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // ========================================
  // 4. 每6小时根据Bilibili搜索关键词同步视频（不限数量）
  // ========================================
  cron.schedule('45 */6 * * *', async () => {
    logger.info('[定时任务] 根据Bilibili搜索关键词同步视频（不限数量）');
    try {
      const result = await syncVideosByKeywords(30, 100);
      logger.info(`[定时任务] Bilibili关键词同步完成: 成功 ${result.synced} 个, 失败 ${result.errors} 个, 关键词 ${result.keywords} 个`);
    } catch (error: any) {
      logger.error('[定时任务] Bilibili关键词同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // ========================================
  // 5. 每12小时同步Semantic Scholar论文（不限数量，依次补充）
  // ========================================
  cron.schedule('30 */12 * * *', async () => {
    logger.info('[定时任务] 同步Semantic Scholar论文（不限数量）');
    try {
      const result = await syncSemanticScholarPapers(
        'embodied AI OR robotics OR computer vision OR machine learning',
        100,
        new Date().getFullYear(),
        ['Computer Science', 'Robotics'],
        false  // 不跳过限流，会重试
      );
      if (result.success) {
        logger.info(`[定时任务] Semantic Scholar论文同步完成: 成功 ${result.synced} 篇, 失败 ${result.errors} 篇`);
      } else {
        logger.warn(`[定时任务] Semantic Scholar论文同步部分失败: ${result.message}`);
      }
    } catch (error: any) {
      logger.error('[定时任务] Semantic Scholar论文同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // ========================================
  // 6. 每8小时同步GitHub项目
  // ========================================
  cron.schedule('0 */8 * * *', async () => {
    logger.info('[定时任务] 同步GitHub项目');
    try {
      const result = await syncGithubRepos('embodied intelligence', 100);
      logger.info(`[定时任务] GitHub项目同步完成: 成功 ${result.synced} 个, 失败 ${result.errors} 个`);
    } catch (error: any) {
      logger.error('[定时任务] GitHub项目同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // ========================================
  // 7. 每12小时同步Bilibili视频（最高100个）
  // ========================================
  cron.schedule('0 */12 * * *', async () => {
    logger.info('[定时任务] 同步Bilibili视频（最高100个）');
    try {
      const result = await syncBilibiliVideos(undefined, 100);
      logger.info(`[定时任务] Bilibili视频同步完成: 成功 ${result?.synced || 0} 个`);
    } catch (error: any) {
      logger.error('[定时任务] Bilibili视频同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // ========================================
  // 8. 每12小时同步HuggingFace模型
  // ========================================
  cron.schedule('30 */12 * * *', async () => {
    logger.info('[定时任务] 同步HuggingFace模型');
    try {
      const result = await syncHuggingFaceModels('robotics', 100);
      logger.info(`[定时任务] HuggingFace模型同步完成: 成功 ${result.synced} 个, 失败 ${result.errors} 个`);
    } catch (error: any) {
      logger.error('[定时任务] HuggingFace模型同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // ========================================
  // 9. 每天凌晨3点同步逐际动力岗位
  // ========================================
  cron.schedule('0 3 * * *', async () => {
    logger.info('[定时任务] 同步逐际动力岗位');
    try {
      const result = await syncLimXJobs();
      logger.info(`[定时任务] 逐际动力岗位同步完成: 成功 ${result.synced} 条`);
    } catch (error: any) {
      logger.error('[定时任务] 逐际动力岗位同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai'
  });
  
  // ========================================
  // 打印任务列表
  // ========================================
  logger.info('========================================');
  logger.info('定时任务调度器启动成功');
  logger.info('任务列表:');
  logger.info('');
  logger.info('【全量同步】');
  logger.info('  - 每天凌晨2点: 全量数据同步');
  logger.info('    - arXiv: 8个分类，每分类最多100篇');
  logger.info('    - GitHub: embodied intelligence，最多100个');
  logger.info('    - HuggingFace: robotics，最多100个');
  logger.info('    - Bilibili视频: UP主视频，最多100条');
  logger.info('    - 论文关键词: 所有关键词，每关键词最多100篇');
  logger.info('    - Bilibili关键词: 所有关键词，每关键词最多100条');
  logger.info('    - Semantic Scholar: 补充同步，每次最多100篇');
  logger.info('');
  logger.info('【增量同步】');
  logger.info('  - 每6小时: arXiv论文同步（全量，所有分类）');
  logger.info('  - 每6小时: 论文关键词同步（不限数量）');
  logger.info('  - 每6小时: Bilibili关键词同步（不限数量）');
  logger.info('  - 每8小时: GitHub项目同步（最多100个）');
  logger.info('  - 每12小时: Bilibili视频同步（最高100个）');
  logger.info('  - 每12小时: Semantic Scholar同步（不限数量）');
  logger.info('  - 每12小时: HuggingFace模型同步（最多100个）');
  logger.info('  - 每天凌晨3点: 逐际动力岗位同步');
  logger.info('');
  logger.info('【稳定性措施】');
  logger.info('  - 分类之间间隔3秒，避免限流');
  logger.info('  - 错误后等待5秒再继续');
  logger.info('  - 每个任务独立执行，失败不影响其他任务');
  logger.info('  - 详细的日志记录，便于问题排查');
  logger.info('');
  logger.info('时区: Asia/Shanghai');
  logger.info('========================================');
}

/**
 * 停止所有定时任务
 */
export function stopCronJobs() {
  logger.info('停止定时任务调度器...');
}
