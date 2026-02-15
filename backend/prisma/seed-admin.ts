/**
 * 管理员数据库种子数据
 * 用于初始化管理端管理员账号
 */

import { PrismaClient } from '../node_modules/.prisma/client-admin';

const adminPrisma = new PrismaClient();

async function main() {
  console.log('开始初始化管理员数据库种子数据...');

  // 检查是否已存在管理员
  const existingAdmin = await adminPrisma.admins.findFirst({
    where: { email: 'admin@embodiedpulse.com' }
  });

  if (existingAdmin) {
    console.log('✓ 管理员已存在:', existingAdmin.username, '(', existingAdmin.email, ')');
    console.log('跳过创建');
    return;
  }

  // 创建超级管理员
  const adminUser = await adminPrisma.admins.create({
    data: {
      id: crypto.randomUUID(),
      admin_number: 'A000001',
      username: 'admin',
      email: 'admin@embodiedpulse.com',
      password_hash: '$2a$10$75diH9ttiDKERYYWLIlKnukZSjeuSBR..fRf69e/d/3r.t43zk78K', // admin123456
      role: 'super_admin',
      is_active: true,
      updated_at: new Date(),
    },
  });
  console.log('✓ 创建超级管理员:', adminUser.username, '(', adminUser.email, ')');
  console.log('✓ 默认密码: admin123456');

  console.log('✅ 管理员数据库种子数据初始化完成!');
}

main()
  .catch((e) => {
    console.error('❌ 管理员数据库种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await adminPrisma.$disconnect();
  });
