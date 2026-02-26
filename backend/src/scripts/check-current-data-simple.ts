import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

async function checkCurrentData() {
  logger.info('📊 检查当前数据库数据状态...');
  
  try {
    const paperCount = await userPrisma.paper.count();
    const repoCount = await userPrisma.githubRepo.count();
    const modelCount = await userPrisma.huggingFaceModel.count();
    const videoCount = await userPrisma.video.count();
    
    logger.info('========================================');
    logger.info('📊 当前数据统计:');
    logger.info('========================================');
    logger.info(`  📄 学术论文: ${paperCount} 篇`);
    logger.info(`  💻 GitHub项目: ${repoCount} 个`);
    logger.info(`  🤖 HuggingFace模型: ${modelCount} 个`);
    logger.info(`  📺 视频资料: ${videoCount} 个`);
    logger.info('========================================');
    
    return { paperCount, repoCount, modelCount, videoCount };
  } catch (error: any) {
    logger.error('检查数据失败:', error.message);
    throw error;
  } finally {
    await userPrisma.$disconnect();
  }
}

checkCurrentData().catch((error) => {
  logger.error('检查数据失败:', error);
  process.exit(1);
});
