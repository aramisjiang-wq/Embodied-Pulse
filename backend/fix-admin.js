const { PrismaClient } = require('@prisma/client');

const adminPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/admin.db',
    },
  },
});

async function fixAdminRole() {
  try {
    console.log('开始修复管理员角色...');
    
    const result = await adminPrisma.$executeRaw`
      UPDATE admins 
      SET role = 'super_admin' 
      WHERE role IS NULL OR role != 'super_admin'
    `;
    
    console.log(`已修复 ${result} 个管理员的角色`);
    
    const admins = await adminPrisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      }
    });
    
    console.log('\n管理员列表:');
    admins.forEach(admin => {
      console.log(`- ${admin.username} (${admin.email}): role=${admin.role}, active=${admin.isActive}`);
    });
    
    console.log('\n修复完成！请重新登录管理端。');
  } catch (error) {
    console.error('修复失败:', error);
    throw error;
  } finally {
    await adminPrisma.$disconnect();
  }
}

fixAdminRole()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('错误:', error);
    process.exit(1);
  });
