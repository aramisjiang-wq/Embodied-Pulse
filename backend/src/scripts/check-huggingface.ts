import userPrisma from '../config/database.user';

async function main() {
  try {
    console.log('检查HuggingFace模型数据...\n');

    const models = await userPrisma.huggingFaceModel.findMany({
      orderBy: { lastModified: 'desc' },
    });

    console.log(`总模型数: ${models.length}\n`);

    if (models.length > 0) {
      console.log('最近的模型:');
      models.slice(0, 5).forEach((model, index) => {
        console.log(`  ${index + 1}. ${model.fullName}`);
        console.log(`     任务: ${model.task || 'N/A'}`);
        console.log(`     下载: ${model.downloads}, 点赞: ${model.likes}`);
        console.log(`     最后修改: ${model.lastModified || 'N/A'}`);
        console.log();
      });
    } else {
      console.log('数据库中没有HuggingFace模型数据！');
      console.log('需要运行同步脚本来获取数据。');
    }
  } catch (error) {
    console.error('检查失败:', error);
  }
}

main();
