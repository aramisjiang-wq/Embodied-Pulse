import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const sqliteUser = new PrismaClient({
  datasources: {
    db: { url: 'file:./prisma/dev-user.db' },
  },
});

const postgresUser = new PrismaClient({
  datasources: {
    db: { url: process.env.USER_DATABASE_URL || 'postgresql://embodied_user:embodied_password@localhost:5432/embodied_pulse_user?schema=public' },
  },
});

interface NewsData {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  category: string;
  tags: string | null;
  publishedAt: Date;
  viewCount: number;
  favoriteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

async function migrateNews() {
  try {
    console.log('开始迁移新闻数据...');

    const startTime = Date.now();

    const sqliteNews = await sqliteUser.news.findMany();
    console.log(`从SQLite读取 ${sqliteNews.length} 条新闻`);

    let successCount = 0;
    let errorCount = 0;

    for (const news of sqliteNews) {
      try {
        await postgresUser.news.create({
          data: {
            id: news.id,
            title: news.title,
            summary: news.summary,
            content: news.content,
            source: news.source,
            sourceUrl: news.sourceUrl,
            imageUrl: news.imageUrl,
            category: news.category,
            tags: news.tags,
            publishedAt: news.publishedAt,
            viewCount: news.viewCount,
            favoriteCount: news.favoriteCount,
            createdAt: news.createdAt,
            updatedAt: news.updatedAt,
          },
        });
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`已迁移 ${successCount}/${sqliteNews.length} 条新闻`);
        }
      } catch (error: any) {
        console.error(`迁移新闻失败 [${news.id}] ${news.title}:`, error.message);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;

    console.log(`\n迁移完成！`);
    console.log(`成功: ${successCount} 条`);
    console.log(`失败: ${errorCount} 条`);
    console.log(`耗时: ${(duration / 1000).toFixed(2)} 秒`);

    if (errorCount > 0) {
      console.warn(`\n警告: 有 ${errorCount} 条新闻迁移失败，请检查错误日志`);
    }
  } catch (error) {
    console.error('迁移过程发生错误:', error);
    process.exit(1);
  } finally {
    await sqliteUser.$disconnect();
    await postgresUser.$disconnect();
  }
}

async function verifyMigration() {
  try {
    console.log('\n验证迁移结果...');

    const sqliteCount = await sqliteUser.news.count();
    const postgresCount = await postgresUser.news.count();

    console.log(`SQLite记录数: ${sqliteCount}`);
    console.log(`PostgreSQL记录数: ${postgresCount}`);

    if (sqliteCount === postgresCount) {
      console.log('✅ 数据验证通过：记录数一致');
    } else {
      console.warn(`⚠️  数据验证失败：记录数不一致 (差异: ${Math.abs(sqliteCount - postgresCount)})`);
    }

    const sampleNews = await postgresUser.news.findFirst();
    if (sampleNews) {
      console.log('\n示例新闻记录:');
      console.log(`  ID: ${sampleNews.id}`);
      console.log(`  标题: ${sampleNews.title}`);
      console.log(`  分类: ${sampleNews.category}`);
      console.log(`  发布时间: ${sampleNews.publishedAt}`);
    }
  } catch (error) {
    console.error('验证失败:', error);
  } finally {
    await sqliteUser.$disconnect();
    await postgresUser.$disconnect();
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'migrate':
      await migrateNews();
      break;
    case 'verify':
      await verifyMigration();
      break;
    default:
      console.log('用法:');
      console.log('  npx tsx scripts/migrate-to-postgres.ts migrate  # 执行迁移');
      console.log('  npx tsx scripts/migrate-to-postgres.ts verify  # 验证迁移');
      process.exit(1);
  }
}

main();
