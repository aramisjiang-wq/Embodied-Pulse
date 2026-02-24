/**
 * 检查用户库中的用户数量（用于排查管理端「用户列表」看不到数据的问题）
 * 运行：在 backend 目录下执行 npx tsx scripts/check-user-count.ts
 */

import userPrisma from '../src/config/database.user';

async function main() {
  try {
    await userPrisma.$connect();
    const count = await userPrisma.user.count();
    const list = await userPrisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, userNumber: true, username: true, email: true, createdAt: true },
    });
    console.log('用户库路径由 USER_DATABASE_URL 或默认 file:./prisma/dev-user.db 决定');
    console.log('当前用户总数:', count);
    console.log('最近 10 条用户:', JSON.stringify(list, null, 2));
    if (count === 0) {
      console.log('\n提示：若你曾在站内注册过，请确认：1) 后端启动目录是否与注册时一致；2) 是否设置了 USER_DATABASE_URL 指向了别的库。');
    }
  } catch (e) {
    console.error('检查失败:', e);
    process.exit(1);
  } finally {
    await userPrisma.$disconnect();
  }
}

main();
