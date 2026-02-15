/**
 * 快速修复管理员角色
 */

const { PrismaClient } = require('@prisma/client');

async function fixAdminRole() {
  console.log('========================================');
  console.log('修复管理员角色');
  console.log('========================================\n');

  const adminPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.ADMIN_DATABASE_URL || 'file:./prisma/admin.db',
      },
    },
  });

  try {
    const admins = await adminPrisma.$queryRaw`
      SELECT id, username, email, role, is_active FROM admins
    `;

    console.log(`找到 ${admins.length} 个管理员\n`);

    for (const admin of admins) {
      console.log(`管理员: ${admin.username}`);
      console.log(`  ID: ${admin.id}`);
      console.log(`  邮箱: ${admin.email}`);
      console.log(`  当前角色: ${admin.role || '(空)'}`);
      console.log(`  状态: ${admin.is_active ? '激活' : '未激活'}`);
      
      if (!admin.role || admin.role !== 'super_admin') {
        await adminPrisma.$executeRaw`
          UPDATE admins SET role = 'super_admin' WHERE id = ${admin.id}
        `;
        console.log(`  ✅ 已修复角色: ${admin.role || '(空)'} -> super_admin`);
      } else {
        console.log(`  ✅ 角色已正确`);
      }
      console.log('');
    }

    console.log('========================================');
    console.log('修复完成！');
    console.log('========================================\n');
    console.log('请重新登录管理端：http://localhost:3000/admin/login');
  } catch (error) {
    console.error('修复失败:', error);
    throw error;
  } finally {
    await adminPrisma.$disconnect();
  }
}

fixAdminRole()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('修复失败:', error);
    process.exit(1);
  });
