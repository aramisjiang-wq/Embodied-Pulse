/**
 * 检查管理员角色
 */

const { PrismaClient } = require('@prisma/client');

async function checkAdminRole() {
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

    console.log('管理员列表:');
    console.log(JSON.stringify(admins, null, 2));
  } catch (error) {
    console.error('查询失败:', error);
    throw error;
  } finally {
    await adminPrisma.$disconnect();
  }
}

checkAdminRole()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('查询失败:', error);
    process.exit(1);
  });
