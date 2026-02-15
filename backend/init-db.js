const { PrismaClient } = require('@prisma/client');
const { syncAllData } = require('./src/services/sync/index');
const { logger } = require('./src/utils/logger');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev-user.db'
    }
  }
});

async function initDatabase() {
  try {
    logger.info('开始初始化数据库...');
    
    // 检查是否已有数据
    const paperCount = await prisma.paper.count();
    const videoCount = await prisma.video.count();
    const repoCount = await prisma.githubRepo.count();
    const modelCount = await prisma.huggingfaceModel.count();
    const newsCount = await prisma.news.count();
    const jobCount = await prisma.job.count();
    
    logger.info(`当前数据统计:`);
    logger.info(`  论文: ${paperCount}`);
    logger.info(`  视频: ${videoCount}`);
    logger.info(`  GitHub仓库: ${repoCount}`);
    logger.info(`  HuggingFace模型: ${modelCount}`);
    logger.info(`  新闻: ${newsCount}`);
    logger.info(`  岗位: ${jobCount}`);
    
    if (paperCount > 0 || videoCount > 0 || repoCount > 0 || 
        modelCount > 0 || newsCount > 0 || jobCount > 0) {
      logger.info('数据库已有数据，跳过同步');
      await prisma.$disconnect();
      return;
    }
    
    logger.info('开始同步真实数据...');
    await syncAllData();
    
    logger.info('数据库初始化完成！');
    await prisma.$disconnect();
  } catch (error) {
    logger.error('数据库初始化失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

initDatabase();