/**
 * 检查数据库表
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

async function main() {
  logger.info('========== 开始检查数据库表 ==========');

  try {
    const prisma = await userPrisma;
    
    const tables: Array<{ name: string }> = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `;
    
    logger.info('数据库中的表:');
    tables.forEach((table: any) => {
      logger.info(`  - ${table.name}`);
    });

    logger.info('========== 数据库表检查完成 ==========');
    process.exit(0);
  } catch (error: any) {
    logger.error(`检查失败: ${error.message}`);
    process.exit(1);
  }
}

main();
