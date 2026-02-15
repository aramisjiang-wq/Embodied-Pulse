/**
 * 创建默认管理员账号
 */

import adminPrisma from '../config/database.admin';
import { hashPassword } from '../utils/password';
import { logger } from '../utils/logger';
import crypto from 'crypto';

async function createAdminAccount() {
  try {
    // 检查是否已存在管理员
    const existing = await adminPrisma.admins.findUnique({
      where: { email: 'admin@embodiedpulse.com' },
    });

    if (existing) {
      logger.info('管理员账号已存在，跳过创建');
      console.log('✅ 管理员账号已存在');
      return;
    }

    // 创建管理员账号
    const passwordHash = await hashPassword('admin123');
    const adminId = crypto.randomUUID();
    const admin = await adminPrisma.admins.create({
      data: {
        id: adminId,
        username: 'admin',
        email: 'admin@embodiedpulse.com',
        password_hash: passwordHash,
        role: 'super_admin',
        is_active: true,
        admin_number: 'ADMIN001',
        updated_at: new Date(),
      },
    });

    logger.info(`管理员账号创建成功: ${admin.id} (${admin.username})`);
    console.log('✅ 管理员账号创建成功');
    console.log(`   邮箱: admin@embodiedpulse.com`);
    console.log(`   密码: admin123`);
    console.log(`   角色: super_admin`);
  } catch (error: any) {
    logger.error('创建管理员账号失败:', error);
    console.error('❌ 创建管理员账号失败:', error.message);
    throw error;
  } finally {
    await adminPrisma.$disconnect();
  }
}

if (require.main === module) {
  createAdminAccount()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { createAdminAccount };
