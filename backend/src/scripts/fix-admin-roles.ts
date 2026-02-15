/**
 * 修复管理员角色
 * 将所有管理员的role设置为'super_admin'
 */

import adminPrisma from '../config/database.admin';
import { logger } from '../utils/logger';

async function fixAdminRoles() {
  try {
    console.log('========================================');
    console.log('修复管理员角色');
    console.log('========================================\n');

    const admins = await adminPrisma.admins.findMany();

    console.log(`找到 ${admins.length} 个管理员\n`);

    let fixedCount = 0;

    for (const admin of admins) {
      console.log('----------------------------------------');
      console.log(`ID: ${admin.id}`);
      console.log(`用户名: ${admin.username}`);
      console.log(`邮箱: ${admin.email}`);
      console.log(`当前角色: ${admin.role || '(空)'}`);
      console.log(`激活状态: ${admin.is_active ? '是' : '否'}`);

      if (!admin.role || admin.role !== 'super_admin') {
        console.log(`⚠️  需要修复角色`);

        await adminPrisma.admins.update({
          where: { id: admin.id },
          data: {
            role: 'super_admin',
          },
        });

        console.log(`✅  角色已更新为: super_admin`);
        fixedCount++;
      } else {
        console.log(`✅  角色正确，无需修复`);
      }

      console.log('----------------------------------------\n');
    }

    console.log(`========================================`);
    console.log(`修复完成！共修复 ${fixedCount} 个管理员`);
    console.log('========================================\n');

    console.log('请重新登录管理端以获取新的Token！');

  } catch (error) {
    console.error('修复失败:', error);
    process.exit(1);
  }
}

fixAdminRoles()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('修复失败:', error);
    process.exit(1);
  });
