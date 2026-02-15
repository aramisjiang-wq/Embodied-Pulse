import userPrisma from '../config/database.user';

async function main() {
  try {
    console.log('开始清理所有测试数据...\n');

    const userActionCount = await userPrisma.userAction.count();
    console.log(`找到 ${userActionCount} 个用户行为记录`);
    const userActionDeleted = await userPrisma.userAction.deleteMany({});
    console.log(`✓ 删除用户行为记录: ${userActionDeleted.count}个`);

    const pointRecordCount = await userPrisma.pointRecord.count();
    console.log(`找到 ${pointRecordCount} 个积分记录`);
    const pointRecordDeleted = await userPrisma.pointRecord.deleteMany({});
    console.log(`✓ 删除积分记录: ${pointRecordDeleted.count}个`);

    const postCount = await userPrisma.post.count();
    console.log(`找到 ${postCount} 个帖子`);
    const postDeleted = await userPrisma.post.deleteMany({});
    console.log(`✓ 删除帖子: ${postDeleted.count}个`);

    const userCount = await userPrisma.user.count();
    console.log(`找到 ${userCount} 个用户`);
    const userDeleted = await userPrisma.user.deleteMany({});
    console.log(`✓ 删除用户: ${userDeleted.count}个`);

    const paperCount = await userPrisma.paper.count();
    console.log(`找到 ${paperCount} 个论文`);
    const paperDeleted = await userPrisma.paper.deleteMany({});
    console.log(`✓ 删除论文: ${paperDeleted.count}个`);

    const repoCount = await userPrisma.githubRepo.count();
    console.log(`找到 ${repoCount} 个GitHub仓库`);
    const repoDeleted = await userPrisma.githubRepo.deleteMany({});
    console.log(`✓ 删除GitHub仓库: ${repoDeleted.count}个`);

    const videoCount = await userPrisma.video.count();
    console.log(`找到 ${videoCount} 个视频`);
    const videoDeleted = await userPrisma.video.deleteMany({});
    console.log(`✓ 删除视频: ${videoDeleted.count}个`);

    console.log(`\n完成！`);
    console.log(`用户行为记录: ${userActionDeleted.count}个已删除`);
    console.log(`积分记录: ${pointRecordDeleted.count}个已删除`);
    console.log(`帖子: ${postDeleted.count}个已删除`);
    console.log(`用户: ${userDeleted.count}个已删除`);
    console.log(`论文: ${paperDeleted.count}个已删除`);
    console.log(`GitHub仓库: ${repoDeleted.count}个已删除`);
    console.log(`视频: ${videoDeleted.count}个已删除`);
  } catch (error) {
    console.error('清理失败:', error);
  } finally {
    await userPrisma.$disconnect();
  }
}

main();
