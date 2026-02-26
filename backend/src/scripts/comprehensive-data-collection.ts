import userPrisma from '../config/database.user';
import { syncArxivPapers } from '../services/sync/arxiv.sync';
import { logger } from '../utils/logger';

async function checkCurrentData() {
  logger.info('📊 检查当前数据库数据状态...');
  
  const [paperCount, repoCount, modelCount, videoCount] = await Promise.all([
    userPrisma.paper.count(),
    userPrisma.githubRepo.count(),
    userPrisma.huggingFaceModel.count(),
    userPrisma.video.count(),
  ]);
  
  logger.info('========================================');
  logger.info('当前数据统计:');
  logger.info(`  📄 学术论文: ${paperCount} 篇`);
  logger.info(`  💻 GitHub项目: ${repoCount} 个`);
  logger.info(`  🤖 HuggingFace模型: ${modelCount} 个`);
  logger.info(`  📺 视频资料: ${videoCount} 个`);
  logger.info('========================================');
  
  return { paperCount, repoCount, modelCount, videoCount };
}

async function collectAcademicPapers() {
  logger.info('\n📄 开始收集学术论文...');
  
  const queries = [
    { query: 'embodied AI', maxResults: 50, label: '具身智能' },
    { query: 'robotics', maxResults: 50, label: '机器人学' },
    { query: 'computer vision', maxResults: 50, label: '计算机视觉' },
    { query: 'machine learning', maxResults: 50, label: '机器学习' },
    { query: 'reinforcement learning', maxResults: 50, label: '强化学习' },
  ];
  
  let totalSynced = 0;
  
  for (const { query, maxResults, label } of queries) {
    try {
      logger.info(`  同步 ${label} 相关论文...`);
      const result = await syncArxivPapers(query, maxResults);
      totalSynced += result.synced;
      logger.info(`  ✅ ${label}: 成功 ${result.synced} 篇`);
    } catch (error: any) {
      logger.error(`  ❌ ${label} 同步失败: ${error.message}`);
    }
    
    // 延迟避免限流
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  logger.info(`\n📄 学术论文收集完成: 总计 ${totalSynced} 篇`);
  return totalSynced;
}

async function main() {
  logger.info('🚀 开始全面数据资源收集\n');
  
  try {
    // 1. 检查当前数据状态
    const initialStats = await checkCurrentData();
    
    // 2. 收集学术论文
    const papersSynced = await collectAcademicPapers();
    
    // 3. 检查最终数据状态
    logger.info('\n📊 数据收集完成，检查最终状态...');
    const finalStats = await checkCurrentData();
    
    // 4. 显示汇总
    logger.info('\n🎉 数据资源收集汇总:');
    logger.info('========================================');
    logger.info(`  📄 学术论文: +${finalStats.paperCount - initialStats.paperCount} 篇 (总计: ${finalStats.paperCount})`);
    logger.info(`  💻 GitHub项目: +${finalStats.repoCount - initialStats.repoCount} 个 (总计: ${finalStats.repoCount})`);
    logger.info(`  🤖 HuggingFace模型: +${finalStats.modelCount - initialStats.modelCount} 个 (总计: ${finalStats.modelCount})`);
    logger.info(`  📺 视频资料: +${finalStats.videoCount - initialStats.videoCount} 个 (总计: ${finalStats.videoCount})`);
    logger.info('========================================');
    
  } catch (error: any) {
    logger.error('❌ 数据收集过程中发生错误:', error.message);
    throw error;
  } finally {
    await userPrisma.$disconnect();
  }
}

main().catch((error) => {
  logger.error('数据收集失败:', error);
  process.exit(1);
});
