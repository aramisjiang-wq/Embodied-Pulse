/**
 * 验证数据完整性
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

async function main() {
  logger.info('========== 开始验证数据完整性 ==========');

  try {
    const prisma = await userPrisma;
    
    const newsCount = await prisma.news.count();
    const paperCount = await prisma.paper.count();
    const videoCount = await prisma.video.count();
    const repoCount = await prisma.githubRepo.count();
    const jobCount = await prisma.job.count();

    logger.info('数据统计:');
    logger.info(`  新闻数量: ${newsCount}`);
    logger.info(`  论文数量: ${paperCount}`);
    logger.info(`  视频数量: ${videoCount}`);
    logger.info(`  仓库数量: ${repoCount}`);
    logger.info(`  岗位数量: ${jobCount}`);

    const total = newsCount + paperCount + videoCount + repoCount + jobCount;
    logger.info(`  总计: ${total} 条数据`);

    logger.info('========== 数据完整性验证完成 ==========');
    process.exit(0);
  } catch (error: any) {
    logger.error(`验证失败: ${error.message}`);
    process.exit(1);
  }
}

main();
