import { PrismaClient } from '@prisma/client';

const userPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    console.log('检查HuggingFace模型数据...\n');

    const models = await userPrisma.huggingFaceModel.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`找到 ${models.length} 个模型:\n`);

    models.forEach((model: any, index: number) => {
      console.log(`${index + 1}. ${model.fullName}`);
      console.log(`   作者: ${model.author || 'unknown'}`);
      console.log(`   描述: ${model.description || '无'}`);
      console.log(`   任务: ${model.task || '无'}`);
      console.log(`   许可证: ${model.license || '无'}`);
      console.log(`   下载量: ${model.downloads || 0}`);
      console.log(`   点赞数: ${model.likes || 0}`);
      console.log(`   HF ID: ${model.hfId || '无'}`);
      console.log('');
    });

    console.log('数据库表结构:');
    console.log('- HuggingFaceModel表 (user数据库): 存储HuggingFace模型信息');
    console.log('- 包括字段: fullName, author, description, task, license, downloads, likes, hfId等');
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await userPrisma.$disconnect();
  }
}

main();
