/**
 * 检查数据库状态
 */

import userPrisma from '../config/database.user';
import adminPrisma from '../config/database.admin';
import { logger } from '../utils/logger';

async function main() {
  logger.info('========== 开始检查数据库状态 ==========');

  try {
    // 检查用户数据库
    const userPrismaClient = await userPrisma;
    
    const newsCount = await userPrismaClient.news.count();
    const paperCount = await userPrismaClient.paper.count();
    const videoCount = await userPrismaClient.video.count();
    const repoCount = await userPrismaClient.githubRepo.count();
    const userCount = await userPrismaClient.user.count();

    logger.info('用户数据库状态:');
    logger.info(`  新闻数量: ${newsCount}`);
    logger.info(`  论文数量: ${paperCount}`);
    logger.info(`  视频数量: ${videoCount}`);
    logger.info(`  仓库数量: ${repoCount}`);
    logger.info(`  用户数量: ${userCount}`);

    // 检查管理员数据库
    const adminPrismaClient = await adminPrisma;
    
    const adminUserCount = await adminPrismaClient.admins.count();
    const dataSourceCount = await adminPrismaClient.data_sources.count();

    logger.info('管理员数据库状态:');
    logger.info(`  管理员数量: ${adminUserCount}`);
    logger.info(`  数据源数量: ${dataSourceCount}`);

    logger.info('========== 数据库状态检查完成 ==========');
    process.exit(0);
  } catch (error: any) {
    logger.error(`检查失败: ${error.message}`);
    process.exit(1);
  }
}

main();
