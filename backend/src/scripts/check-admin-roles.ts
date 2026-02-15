/**
 * 检查管理员角色
 */

import adminPrisma from '../config/database.admin';
import { logger } from '../utils/logger';

async function checkAdminRoles() {
  try {
    console.log('========================================');
    console.log('检查管理员角色');
    console.log('========================================\n');

    const admins = await adminPrisma.admins.findMany();

    console.log(`找到 ${admins.length} 个管理员\n`);

    for (const admin of admins) {
      console.log('----------------------------------------');
      console.log(`ID: ${admin.id}`);
      console.log(`用户名: ${admin.username}`);
      console.log(`邮箱: ${admin.email}`);
      console.log(`角色: ${admin.role}`);
      console.log(`激活状态: ${admin.is_active ? '是' : '否'}`);
      console.log(`创建时间: ${admin.created_at}`);
      console.log('----------------------------------------\n');
    }

  } catch (error) {
    console.error('检查失败:', error);
    process.exit(1);
  }
}

checkAdminRoles()
  .then(() => {
    console.log('\n检查完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('检查失败:', error);
    process.exit(1);
  });
