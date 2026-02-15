import adminPrisma from '../config/database.admin';

async function main() {
  try {
    console.log('开始添加HuggingFace作者订阅测试数据...');

    const testAuthors = [
      {
        id: '1',
        author: 'akhaliq',
        authorUrl: 'https://huggingface.co/akhaliq',
        isActive: true,
        modelCount: 15,
        tags: JSON.stringify(['机器人', '具身智能', '计算机视觉']),
        lastSyncAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        author: 'openai',
        authorUrl: 'https://huggingface.co/openai',
        isActive: true,
        modelCount: 8,
        tags: JSON.stringify(['大模型', '自然语言处理', '多模态']),
        lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '3',
        author: 'meta-llama',
        authorUrl: 'https://huggingface.co/meta-llama',
        isActive: true,
        modelCount: 12,
        tags: JSON.stringify(['大模型', '深度学习', 'AI']),
        lastSyncAt: new Date(Date.now() - 7200000).toISOString(),
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: '4',
        author: 'google',
        authorUrl: 'https://huggingface.co/google',
        isActive: false,
        modelCount: 5,
        tags: JSON.stringify(['多模态', '视觉-语言', 'AI']),
        lastSyncAt: new Date(Date.now() - 10800000).toISOString(),
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        id: '5',
        author: 'microsoft',
        authorUrl: 'https://huggingface.co/microsoft',
        isActive: true,
        modelCount: 20,
        tags: JSON.stringify(['自然语言处理', '深度学习', '企业']),
        lastSyncAt: new Date(Date.now() - 14400000).toISOString(),
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        updatedAt: new Date(Date.now() - 14400000).toISOString(),
      },
    ];

    for (const author of testAuthors) {
      await adminPrisma.$executeRawUnsafe(
        `INSERT OR REPLACE INTO huggingface_author_subscriptions 
         (id, author, author_url, is_active, model_count, tags, last_sync_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        author.id,
        author.author,
        author.authorUrl,
        author.isActive ? 1 : 0,
        author.modelCount,
        author.tags,
        author.lastSyncAt,
        author.createdAt,
        author.updatedAt
      );
      console.log(`✓ 添加作者订阅: ${author.author}`);
    }

    console.log('\n所有测试数据添加完成！');
  } catch (error) {
    console.error('添加测试数据失败:', error);
  }
}

main();
