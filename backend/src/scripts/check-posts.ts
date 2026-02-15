import userPrisma from '../config/database.user';

async function main() {
  try {
    console.log('检查市集帖子数据...\n');

    const posts = await userPrisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`总帖子数: ${posts.length}\n`);

    const typeCounts: Record<string, number> = {};
    posts.forEach(post => {
      typeCounts[post.contentType] = (typeCounts[post.contentType] || 0) + 1;
    });

    console.log('按类型统计:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\n最近的帖子:');
    posts.slice(0, 5).forEach((post, index) => {
      console.log(`  ${index + 1}. [${post.contentType}] ${post.title || '(无标题)'} - ${post.user.username}`);
    });
  } catch (error) {
    console.error('检查失败:', error);
  }
}

main();
