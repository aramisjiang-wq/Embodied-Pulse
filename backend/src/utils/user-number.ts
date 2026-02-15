/**
 * 用户编号生成工具
 * 生成系统内唯一的用户/管理员编号
 */

import { logger } from './logger';
import userPrisma from '../config/database.user';
import adminPrisma from '../config/database.admin';

/**
 * 生成用户编号
 * 格式: U + 6位数字，从U100000开始
 */
export async function generateUserNumber(): Promise<string> {
  try {
    // 查询当前最大编号
    const maxUser = await userPrisma.user.findFirst({
      orderBy: {
        userNumber: 'desc',
      },
      select: {
        userNumber: true,
      },
    });

    let nextNumber = 100000; // 起始编号

    if (maxUser?.userNumber) {
      // 提取数字部分
      const match = maxUser.userNumber.match(/^U(\d+)$/);
      if (match) {
        const currentNumber = parseInt(match[1], 10);
        nextNumber = currentNumber + 1;
      }
    }

    return `U${nextNumber.toString().padStart(6, '0')}`;
  } catch (error) {
    logger.error('Generate user number error:', error);
    // 如果查询失败，使用时间戳作为后备
    const timestamp = Date.now().toString().slice(-6);
    return `U${timestamp}`;
  }
}

/**
 * 生成管理员编号
 * 格式: A + 6位数字，从A100000开始
 */
export async function generateAdminNumber(): Promise<string> {
  try {
    // 查询当前最大编号
    const maxAdmin = await adminPrisma.admins.findFirst({
      orderBy: {
        admin_number: 'desc',
      },
      select: {
        admin_number: true,
      },
    });

    let nextNumber = 100000;

    if (maxAdmin?.admin_number) {
      const match = maxAdmin.admin_number.match(/^A(\d+)$/);
      if (match) {
        const currentNumber = parseInt(match[1], 10);
        nextNumber = currentNumber + 1;
      }
    }

    return `A${nextNumber.toString().padStart(6, '0')}`;
  } catch (error) {
    logger.error('Generate admin number error:', error);
    // 如果查询失败，使用时间戳作为后备
    const timestamp = Date.now().toString().slice(-6);
    return `A${timestamp}`;
  }
}
