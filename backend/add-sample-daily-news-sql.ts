
import userPrisma from './src/config/database.user';
import adminPrisma from './src/config/database.admin';

async function main() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const sampleNews = [
    {
      id: crypto.randomUUID(),
      date: today,
      title: '具身智能领域迎来新突破：人形机器人实现自主导航',
      content: '最新研究显示，基于多模态大模型的人形机器人在复杂环境中实现了自主导航和物体识别，标志着具身智能技术取得重要进展。该系统结合了视觉语言模型和强化学习算法，使机器人能够在未知环境中自主规划路径并完成指定任务。',
      is_pinned: 1,
      pinned_at: new Date().toISOString(),
      view_count: 120,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      date: today,
      title: 'AI机器人公司完成2亿美元B轮融资，加速产品商业化',
      content: '专注于具身智能技术的AI机器人公司宣布完成2亿美元B轮融资，本轮融资由多家知名投资机构领投。公司表示，资金将用于加速产品研发和市场拓展，推动具身智能技术在工业和服务领域的应用。',
      is_pinned: 0,
      pinned_at: null,
      view_count: 89,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      date: yesterday,
      title: '新一代机器人操作系统发布，支持Sim-to-Real迁移',
      content: '新一代机器人操作系统正式发布，引入了先进的仿真到现实迁移技术，大幅降低了机器人开发成本。该系统支持多种机器人平台，提供了丰富的预训练模型和工具链，使开发者能够快速构建和部署机器人应用。',
      is_pinned: 0,
      pinned_at: null,
      view_count: 156,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      date: yesterday,
      title: '强化学习在机器人抓取任务中的应用研究',
      content: '最新研究展示了强化学习在机器人抓取任务中的优异表现，通过大量仿真训练实现了高精度的物体抓取。研究团队采用了深度Q网络和策略梯度方法，使机器人能够适应不同形状和材质的物体。',
      is_pinned: 0,
      pinned_at: null,
      view_count: 203,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  console.log('=== Adding sample DailyNews to user database ===');
  for (const news of sampleNews) {
    try {
      await userPrisma.$executeRaw`
        INSERT INTO daily_news (id, date, title, content, is_pinned, pinned_at, view_count, created_at, updated_at)
        VALUES (${news.id}, ${news.date}, ${news.title}, ${news.content}, ${news.is_pinned}, ${news.pinned_at}, ${news.view_count}, ${news.created_at}, ${news.updated_at})
      `;
      console.log(`✓ Created: ${news.title}`);
    } catch (e) {
      console.error(`✗ Failed to create: ${news.title}`, e);
    }
  }

  console.log('\n=== Adding sample DailyNews to admin database ===');
  for (const news of sampleNews) {
    try {
      await adminPrisma.$executeRaw`
        INSERT INTO daily_news (id, date, title, content, is_pinned, pinned_at, view_count, created_at, updated_at)
        VALUES (${news.id}, ${news.date}, ${news.title}, ${news.content}, ${news.is_pinned}, ${news.pinned_at}, ${news.view_count}, ${news.created_at}, ${news.updated_at})
      `;
      console.log(`✓ Created: ${news.title}`);
    } catch (e) {
      console.error(`✗ Failed to create: ${news.title}`, e);
    }
  }

  await userPrisma.$disconnect();
  await adminPrisma.$disconnect();

  console.log('\n✅ Sample DailyNews added to both databases!');
}

main().catch(console.error);
