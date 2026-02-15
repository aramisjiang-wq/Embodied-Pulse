import userPrisma from '../src/config/database.user';

const prisma = userPrisma;

async function seedNews() {
  try {
    console.log('开始创建测试新闻数据...');

    const testNews = [
      {
        id: crypto.randomUUID(),
        title: '具身智能领域迎来新突破：人形机器人实现自主导航',
        summary: '最新研究显示，基于多模态大模型的人形机器人在复杂环境中实现了自主导航和物体识别，标志着具身智能技术取得重要进展。',
        content: '最新研究显示，基于多模态大模型的人形机器人在复杂环境中实现了自主导航和物体识别，标志着具身智能技术取得重要进展。该系统结合了视觉语言模型和强化学习算法，使机器人能够在未知环境中自主规划路径并完成指定任务。',
        source: '36kr',
        sourceUrl: 'https://36kr.com/p/test1',
        imageUrl: 'https://example.com/image1.jpg',
        category: 'research',
        tags: JSON.stringify(['具身智能', '人形机器人', '多模态', '视觉语言模型']),
        publishedAt: new Date('2026-02-01'),
        viewCount: 120,
        favoriteCount: 15,
      },
      {
        id: crypto.randomUUID(),
        title: 'AI机器人公司完成2亿美元B轮融资，加速产品商业化',
        summary: '专注于具身智能技术的AI机器人公司宣布完成2亿美元B轮融资，将用于加速产品研发和市场拓展。',
        content: '专注于具身智能技术的AI机器人公司宣布完成2亿美元B轮融资，本轮融资由多家知名投资机构领投。公司表示，资金将用于加速产品研发和市场拓展，推动具身智能技术在工业和服务领域的应用。',
        source: '36kr',
        sourceUrl: 'https://36kr.com/p/test2',
        imageUrl: 'https://example.com/image2.jpg',
        category: 'funding',
        tags: JSON.stringify(['具身智能', '融资', '商业化']),
        publishedAt: new Date('2026-02-01'),
        viewCount: 89,
        favoriteCount: 8,
      },
      {
        id: crypto.randomUUID(),
        title: '新一代机器人操作系统发布，支持Sim-to-Real迁移',
        summary: '新一代机器人操作系统正式发布，引入了先进的仿真到现实迁移技术，大幅降低了机器人开发成本。',
        content: '新一代机器人操作系统正式发布，引入了先进的仿真到现实迁移技术，大幅降低了机器人开发成本。该系统支持多种机器人平台，提供了丰富的预训练模型和工具链，使开发者能够快速构建和部署机器人应用。',
        source: '36kr',
        sourceUrl: 'https://36kr.com/p/test3',
        imageUrl: 'https://example.com/image3.jpg',
        category: 'product',
        tags: JSON.stringify(['机器人', 'Sim-to-Real', '仿真到现实']),
        publishedAt: new Date('2026-02-02'),
        viewCount: 156,
        favoriteCount: 22,
      },
      {
        id: crypto.randomUUID(),
        title: '强化学习在机器人抓取任务中的应用研究',
        summary: '最新研究展示了强化学习在机器人抓取任务中的优异表现，通过大量仿真训练实现了高精度的物体抓取。',
        content: '最新研究展示了强化学习在机器人抓取任务中的优异表现，通过大量仿真训练实现了高精度的物体抓取。研究团队采用了深度Q网络和策略梯度方法，使机器人能够适应不同形状和材质的物体。',
        source: '36kr',
        sourceUrl: 'https://36kr.com/p/test4',
        imageUrl: 'https://example.com/image4.jpg',
        category: 'research',
        tags: JSON.stringify(['强化学习', '抓取', '机器人']),
        publishedAt: new Date('2026-02-02'),
        viewCount: 203,
        favoriteCount: 31,
      },
      {
        id: crypto.randomUUID(),
        title: 'Transformer架构在机器人控制中的创新应用',
        summary: '研究团队将Transformer架构应用于机器人控制任务，实现了端到端的感知控制一体化。',
        content: '研究团队将Transformer架构应用于机器人控制任务，实现了端到端的感知控制一体化。该方法通过自注意力机制捕捉环境中的关键信息，显著提升了机器人在复杂任务中的表现。',
        source: '36kr',
        sourceUrl: 'https://36kr.com/p/test5',
        imageUrl: 'https://example.com/image5.jpg',
        category: 'research',
        tags: JSON.stringify(['Transformer', '感知控制', '机器人']),
        publishedAt: new Date('2026-02-02'),
        viewCount: 178,
        favoriteCount: 25,
      },
    ];

    for (const news of testNews) {
      await prisma.news.create({ data: news });
      console.log(`创建新闻: ${news.title}`);
    }

    console.log(`成功创建 ${testNews.length} 条测试新闻`);
  } catch (error) {
    console.error('创建测试新闻失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNews();
