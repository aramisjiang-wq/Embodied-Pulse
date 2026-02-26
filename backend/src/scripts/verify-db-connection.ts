import { PrismaClient as PrismaUserClient } from '../generated/prisma-client-user';
import { PrismaClient as PrismaAdminClient } from '../generated/prisma-client-admin';
import { logger } from '../utils/logger';

async function verifyDatabaseConnection() {
  logger.info('开始验证数据库连接...');
  
  const userDb = new PrismaUserClient();
  const adminDb = new PrismaAdminClient();
  
  try {
    // 测试用户数据库连接
    await userDb.$connect();
    logger.info('✅ 用户数据库连接成功');
    
    // 测试管理员数据库连接
    await adminDb.$connect();
    logger.info('✅ 管理员数据库连接成功');
    
    // 检查现有数据
    const paperCount = await userDb.paper.count();
    const repoCount = await userDb.githubRepo.count();
    const modelCount = await userDb.huggingFaceModel.count();
    const videoCount = await userDb.video.count();
    
    logger.info('📊 现有数据统计:');
    logger.info(`  - 论文: ${paperCount} 篇`);
    logger.info(`  - GitHub项目: ${repoCount} 个`);
    logger.info(`  - HuggingFace模型: ${modelCount} 个`);
    logger.info(`  - 视频: ${videoCount} 个`);
    
    return {
      success: true,
      counts: { paperCount, repoCount, modelCount, videoCount }
    };
  } catch (error: any) {
    logger.error('❌ 数据库连接失败:', error.message);
    throw error;
  } finally {
    await userDb.$disconnect();
    await adminDb.$disconnect();
  }
}

verifyDatabaseConnection()
  .then(() => {
    logger.info('数据库验证完成');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('验证失败:', error);
    process.exit(1);
  });
