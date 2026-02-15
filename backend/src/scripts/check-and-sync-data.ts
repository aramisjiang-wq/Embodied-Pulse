/**
 * 检查并同步所有数据库数据
 * 倒推检查：数据库 → API → 前端
 */

import prisma from '../config/database';
import adminPrisma from '../config/database.admin';
import userPrisma from '../config/database.user';
import { syncAllData } from '../services/sync/index';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

interface TableStats {
  name: string;
  count: number;
  minRequired: number;
  status: 'sufficient' | 'insufficient' | 'empty';
}

/**
 * 检查主数据库表数据
 */
async function checkMainDatabase(): Promise<TableStats[]> {
  const stats: TableStats[] = [];
  
  try {
    // Papers表
    const papersCount = await prisma.paper.count();
    stats.push({
      name: 'Papers',
      count: papersCount,
      minRequired: 50,
      status: papersCount >= 50 ? 'sufficient' : papersCount > 0 ? 'insufficient' : 'empty',
    });
    
    // GitHubRepos表
    const reposCount = await prisma.githubRepo.count();
    stats.push({
      name: 'GitHubRepos',
      count: reposCount,
      minRequired: 30,
      status: reposCount >= 30 ? 'sufficient' : reposCount > 0 ? 'insufficient' : 'empty',
    });
    
    // HuggingFaceModels表
    const modelsCount = await prisma.huggingFaceModel.count();
    stats.push({
      name: 'HuggingFaceModels',
      count: modelsCount,
      minRequired: 20,
      status: modelsCount >= 20 ? 'sufficient' : modelsCount > 0 ? 'insufficient' : 'empty',
    });
    
    // Videos表
    const videosCount = await prisma.video.count();
    stats.push({
      name: 'Videos',
      count: videosCount,
      minRequired: 20,
      status: videosCount >= 20 ? 'sufficient' : videosCount > 0 ? 'insufficient' : 'empty',
    });
    
    // Jobs表
    const jobsCount = await prisma.job.count();
    stats.push({
      name: 'Jobs',
      count: jobsCount,
      minRequired: 10,
      status: jobsCount >= 10 ? 'sufficient' : jobsCount > 0 ? 'insufficient' : 'empty',
    });
    
    // Banners表
    const bannersCount = await prisma.banner.count();
    stats.push({
      name: 'Banners',
      count: bannersCount,
      minRequired: 1,
      status: bannersCount >= 1 ? 'sufficient' : 'empty',
    });
    
    // Announcements表
    const announcementsCount = await prisma.announcement.count();
    stats.push({
      name: 'Announcements',
      count: announcementsCount,
      minRequired: 0, // 可选
      status: announcementsCount >= 0 ? 'sufficient' : 'empty',
    });
    
    // Posts表（市集帖子）
    const postsCount = await prisma.post.count();
    stats.push({
      name: 'Posts',
      count: postsCount,
      minRequired: 0, // 用户生成
      status: postsCount >= 0 ? 'sufficient' : 'empty',
    });
    
    // Comments表
    const commentsCount = await prisma.comment.count();
    stats.push({
      name: 'Comments',
      count: commentsCount,
      minRequired: 0, // 用户生成
      status: commentsCount >= 0 ? 'sufficient' : 'empty',
    });
    
  } catch (error: any) {
    logger.error('检查主数据库失败:', error);
  }
  
  return stats;
}

/**
 * 检查用户端数据库表数据
 */
async function checkUserDatabase(): Promise<TableStats[]> {
  const stats: TableStats[] = [];
  
  try {
    // 检查表是否存在
    const usersCount = await userPrisma.user.count();
    stats.push({
      name: 'Users',
      count: usersCount,
      minRequired: 0, // 用户注册生成
      status: usersCount >= 0 ? 'sufficient' : 'empty',
    });
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      stats.push({
        name: 'Users',
        count: 0,
        minRequired: 0,
        status: 'empty',
      });
      logger.warn('用户端数据库表不存在，需要运行迁移');
    } else {
      logger.error('检查用户端数据库失败:', error);
    }
  }
  
  return stats;
}

/**
 * 检查管理端数据库表数据
 */
async function checkAdminDatabase(): Promise<TableStats[]> {
  const stats: TableStats[] = [];
  
  try {
    const adminsCount = await adminPrisma.admins.count();
    stats.push({
      name: 'Admins',
      count: adminsCount,
      minRequired: 1,
      status: adminsCount >= 1 ? 'sufficient' : 'empty',
    });
  } catch (error: any) {
    logger.error('检查管理端数据库失败:', error);
  }
  
  return stats;
}

/**
 * 同步缺失的数据
 */
async function syncMissingData(stats: TableStats[]): Promise<void> {
  const needsSync = stats.filter(s => s.status === 'empty' || s.status === 'insufficient');
  
  if (needsSync.length === 0) {
    logger.info('所有数据表都有充足的数据，无需同步');
    return;
  }
  
  logger.info(`需要同步 ${needsSync.length} 个数据表的数据`);
  
  // 检查需要同步的表
  const needsPapers = needsSync.find(s => s.name === 'Papers');
  const needsRepos = needsSync.find(s => s.name === 'GitHubRepos');
  const needsModels = needsSync.find(s => s.name === 'HuggingFaceModels');
  const needsVideos = needsSync.find(s => s.name === 'Videos');
  const needsJobs = needsSync.find(s => s.name === 'Jobs');
  
  // 运行同步
  if (needsPapers || needsRepos || needsModels || needsVideos || needsJobs) {
    logger.info('开始同步第三方数据...');
    try {
      const result = await syncAllData();
      logger.info('数据同步完成:', result);
    } catch (error: any) {
      logger.error('数据同步失败:', error);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 数据库数据检查和同步');
  console.log('='.repeat(60) + '\n');
  
  // 检查主数据库
  console.log('🔍 检查主数据库...');
  const mainStats = await checkMainDatabase();
  
  // 检查用户端数据库
  console.log('🔍 检查用户端数据库...');
  const userStats = await checkUserDatabase();
  
  // 检查管理端数据库
  console.log('🔍 检查管理端数据库...');
  const adminStats = await checkAdminDatabase();
  
  // 合并所有统计
  const allStats = [...mainStats, ...userStats, ...adminStats];
  
  // 打印统计结果
  console.log('\n' + '='.repeat(60));
  console.log('📋 数据统计结果');
  console.log('='.repeat(60) + '\n');
  
  allStats.forEach(stat => {
    const icon = stat.status === 'sufficient' ? '✅' : stat.status === 'insufficient' ? '⚠️' : '❌';
    const statusText = stat.status === 'sufficient' ? '充足' : stat.status === 'insufficient' ? '不足' : '为空';
    console.log(`${icon} ${stat.name}: ${stat.count} 条 (需要: ${stat.minRequired}+) - ${statusText}`);
  });
  
  // 统计
  const sufficient = allStats.filter(s => s.status === 'sufficient').length;
  const insufficient = allStats.filter(s => s.status === 'insufficient').length;
  const empty = allStats.filter(s => s.status === 'empty').length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`总计: ✅ ${sufficient} 充足 | ⚠️ ${insufficient} 不足 | ❌ ${empty} 为空`);
  console.log('='.repeat(60) + '\n');
  
  // 同步缺失的数据
  if (insufficient > 0 || empty > 0) {
    console.log('🔄 开始同步缺失的数据...\n');
    await syncMissingData(allStats);
    
    // 重新检查
    console.log('\n🔍 重新检查数据...\n');
    const mainStatsAfter = await checkMainDatabase();
    const userStatsAfter = await checkUserDatabase();
    const adminStatsAfter = await checkAdminDatabase();
    const allStatsAfter = [...mainStatsAfter, ...userStatsAfter, ...adminStatsAfter];
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 同步后数据统计');
    console.log('='.repeat(60) + '\n');
    
    allStatsAfter.forEach(stat => {
      const icon = stat.status === 'sufficient' ? '✅' : stat.status === 'insufficient' ? '⚠️' : '❌';
      const statusText = stat.status === 'sufficient' ? '充足' : stat.status === 'insufficient' ? '不足' : '为空';
      console.log(`${icon} ${stat.name}: ${stat.count} 条 (需要: ${stat.minRequired}+) - ${statusText}`);
    });
    
    const sufficientAfter = allStatsAfter.filter(s => s.status === 'sufficient').length;
    const insufficientAfter = allStatsAfter.filter(s => s.status === 'insufficient').length;
    const emptyAfter = allStatsAfter.filter(s => s.status === 'empty').length;
    
    console.log('\n' + '='.repeat(60));
    console.log(`总计: ✅ ${sufficientAfter} 充足 | ⚠️ ${insufficientAfter} 不足 | ❌ ${emptyAfter} 为空`);
    console.log('='.repeat(60) + '\n');
  } else {
    console.log('✅ 所有数据表都有充足的数据，无需同步\n');
  }
  
  // 清理连接
  await prisma.$disconnect();
  await userPrisma.$disconnect();
  await adminPrisma.$disconnect();
}

// 运行
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ 检查和同步完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 检查和同步失败:', error);
      process.exit(1);
    });
}

export { main };
