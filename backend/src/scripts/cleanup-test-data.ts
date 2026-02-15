import userPrisma from '../config/database.user';

async function main() {
  try {
    console.log('开始清理测试数据...\n');

    const huggingfaceCount = await userPrisma.huggingFaceModel.count();
    console.log(`找到 ${huggingfaceCount} 个HuggingFace模型`);
    const huggingfaceDeleted = await userPrisma.huggingFaceModel.deleteMany({});
    console.log(`✓ 删除HuggingFace模型: ${huggingfaceDeleted.count}个`);

    const jobCount = await userPrisma.job.count();
    console.log(`找到 ${jobCount} 个岗位`);
    const jobDeleted = await userPrisma.job.deleteMany({});
    console.log(`✓ 删除岗位: ${jobDeleted.count}个`);

    console.log(`\n完成！`);
    console.log(`HuggingFace模型: ${huggingfaceDeleted.count}个已删除`);
    console.log(`岗位: ${jobDeleted.count}个已删除`);
  } catch (error) {
    console.error('清理失败:', error);
  } finally {
    await userPrisma.$disconnect();
  }
}

main();
