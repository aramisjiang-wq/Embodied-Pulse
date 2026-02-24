/**
 * 在用户库中按关键词查找用户（username / email / userNumber）
 * 运行：在 backend 目录下执行 npx tsx scripts/find-user-by-keyword.ts 404777086
 */

import userPrisma from '../src/config/database.user';

async function main() {
  const keyword = process.argv[2] || '404777086';
  try {
    await userPrisma.$connect();
    const total = await userPrisma.user.count();
    console.log('用户库当前总用户数:', total);
    console.log('查找关键词:', keyword);

    // 按 username / email / userNumber 包含 keyword 查询
    const users = await userPrisma.user.findMany({
      where: {
        OR: [
          { username: { contains: keyword } },
          { email: { contains: keyword } },
          { userNumber: { contains: keyword } },
        ],
      },
      take: 50,
      select: {
        id: true,
        userNumber: true,
        username: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (users.length === 0) {
      console.log('未找到匹配用户。列出最近 5 条用户供核对：');
      const recent = await userPrisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, userNumber: true, username: true, email: true, createdAt: true },
      });
      console.log(JSON.stringify(recent, null, 2));
    } else {
      console.log('找到', users.length, '个匹配用户：');
      console.log(JSON.stringify(users, null, 2));
    }
  } catch (e) {
    console.error('执行失败:', e);
    process.exit(1);
  } finally {
    await userPrisma.$disconnect();
  }
}

main();
