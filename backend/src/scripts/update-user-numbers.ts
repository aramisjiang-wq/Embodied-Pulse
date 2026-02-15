/**
 * 为现有用户和管理员生成编号
 */

import userPrisma from '../config/database.user';
import adminPrisma from '../config/database.admin';
import { generateUserNumber, generateAdminNumber } from '../utils/user-number';
import { logger } from '../utils/logger';

async function updateUserNumbers() {
  try {
    logger.info('开始为现有用户生成编号...');
    
    // 获取所有没有编号的用户
    const usersWithoutNumber = await userPrisma.user.findMany({
      where: {
        userNumber: null as any, // SQLite允许null值
      },
    });

    logger.info(`找到 ${usersWithoutNumber.length} 个需要生成编号的用户`);

    for (const user of usersWithoutNumber) {
      const userNumber = await generateUserNumber();
      await userPrisma.user.update({
        where: { id: user.id },
        data: { userNumber },
      });
      logger.info(`用户 ${user.username} (${user.id}) 已分配编号: ${userNumber}`);
    }

    logger.info('用户编号更新完成');
  } catch (error) {
    logger.error('更新用户编号失败:', error);
    throw error;
  }
}

async function updateAdminNumbers() {
  try {
    logger.info('开始为现有管理员生成编号...');
    
    // 获取所有没有编号的管理员
    const adminsWithoutNumber = await adminPrisma.admins.findMany({
      where: {
        admin_number: undefined,
      },
    });

    logger.info(`找到 ${adminsWithoutNumber.length} 个需要生成编号的管理员`);

    for (const admin of adminsWithoutNumber) {
      const adminNumber = await generateAdminNumber();
      await adminPrisma.admins.update({
        where: { id: admin.id },
        data: { admin_number: adminNumber },
      });
      logger.info(`管理员 ${admin.username} (${admin.id}) 已分配编号: ${adminNumber}`);
    }

    logger.info('管理员编号更新完成');
  } catch (error) {
    logger.error('更新管理员编号失败:', error);
    throw error;
  }
}

async function main() {
  try {
    await updateUserNumbers();
    await updateAdminNumbers();
    logger.info('所有编号更新完成');
    process.exit(0);
  } catch (error) {
    logger.error('脚本执行失败:', error);
    process.exit(1);
  }
}

main();
