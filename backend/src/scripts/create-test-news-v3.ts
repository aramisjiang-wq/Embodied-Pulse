import userPrisma from '../config/database.user';

const TEST_NEWS = [
  {
    id: 'news-001',
    platform: 'tech',
    title: 'OpenAI发布新一代GPT-5模型，实现真正的多模态理解与生成',
    url: 'https://techcrunch.com/gpt-5-launch',
    score: '1.0',
    description: 'OpenAI今日宣布推出GPT-5旗舰模型，该模型首次实现了真正的多模态理解与生成能力。',
    published_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    view_count: 15420,
    favorite_count: 895,
    share_count: 1234,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'news-002',
    platform: 'research',
    title: '清华大学研发新型人形机器人"清华小智"',
    url: 'https://news.tsinghua.edu.cn/qhwx',
    score: '0.95',
    description: '清华大学智能科学与技术实验室近日发布了一款名为"清华小智"的新型人形机器人。',
    published_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    view_count: 8932,
    favorite_count: 567,
    share_count: 890,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'news-003',
    platform: 'tech',
    title: '英伟达发布下一代机器人计算平台Isaac SuperX',
    url: 'https://venturebeat.com/nvidia-isaac-superx',
    score: '0.92',
    description: '英伟达在GTC大会上发布了新一代机器人计算平台Isaac SuperX，性能提升5倍。',
    published_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    view_count: 12450,
    favorite_count: 789,
    share_count: 987,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'news-004',
    platform: 'funding',
    title: '具身智能公司Figure AI完成6.7亿美元B轮融资',
    url: 'https://bloomberg.com/figure-ai-funding',
    score: '0.88',
    description: '专注于通用人形机器人的初创公司Figure AI今日宣布完成6.7亿美元B轮融资。',
    published_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    view_count: 7856,
    favorite_count: 456,
    share_count: 678,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'news-005',
    platform: 'research',
    title: '谷歌DeepMind发布机器人控制大模型Robotics Transformer 2',
    url: 'https://technologyreview.com/rt-2-launch',
    score: '0.85',
    description: '谷歌DeepMind近日发布了新一代机器人控制大模型Robotics Transformer 2。',
    published_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    view_count: 9876,
    favorite_count: 678,
    share_count: 876,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'news-006',
    platform: 'product',
    title: '波士顿动力发布新一代Atlas液压机器人',
    url: 'https://theverge.com/atlas-electric',
    score: '0.82',
    description: '波士顿动力公司今日发布了新一代Atlas人形机器人，这是首款完全电驱动的Atlas。',
    published_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    view_count: 23456,
    favorite_count: 1567,
    share_count: 2345,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'news-007',
    platform: 'policy',
    title: '中国发布《具身智能产业发展行动计划》，2025年产业规模目标5000亿元',
    url: 'https://people.com.cn/embodied-ai-plan',
    score: '0.80',
    description: '工业和信息化部近日联合多部门发布了《具身智能产业发展行动计划（2024-2025年）》。',
    published_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    view_count: 15678,
    favorite_count: 890,
    share_count: 1234,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'news-008',
    platform: 'product',
    title: '特斯拉Optimus机器人进入特斯拉工厂实习',
    url: 'https://reuters.com/optimus-factory',
    score: '0.78',
    description: '特斯拉CEO埃隆·马斯克今日宣布，Optimus人形机器人已开始在上海超级工厂进行实习工作。',
    published_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    view_count: 34567,
    favorite_count: 2345,
    share_count: 3456,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'news-009',
    platform: 'research',
    title: '斯坦福大学开发新型触觉传感器Tacotron',
    url: 'https://science.stanford.edu/tacotron',
    score: '0.75',
    description: '斯坦福大学研究人员近日开发了一种新型触觉传感器Tacotron，让机器人拥有接近人类的触觉感知能力。',
    published_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    view_count: 6543,
    favorite_count: 345,
    share_count: 567,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'news-010',
    platform: 'product',
    title: '亚马逊部署10万台机器人仓库，效率提升40%',
    url: 'https://wsj.com/amazon-robots',
    score: '0.72',
    description: '亚马逊近日宣布，其全球仓库网络中已部署超过10万台机器人，效率提升40%。',
    published_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    view_count: 11234,
    favorite_count: 678,
    share_count: 890,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
  },
];

async function main() {
  try {
    console.log('开始创建测试新闻数据...\n');
    console.log(`当前时间: ${new Date().toISOString()}\n`);

    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const newsData of TEST_NEWS) {
      try {
        await userPrisma.news.upsert({
          where: { id: newsData.id },
          update: newsData,
          create: newsData,
        });
        createdCount++;
        console.log(`✓ 创建/更新新闻: ${newsData.title.substring(0, 50)}...`);
        console.log(`  日期: ${newsData.published_date.toISOString()}, 浏览: ${newsData.view_count}`);
      } catch (error: any) {
        failedCount++;
        console.error(`✗ 失败: ${newsData.title.substring(0, 50)}...`, error.message);
      }
    }

    console.log(`\n完成！`);
    console.log(`创建/更新: ${createdCount}条新闻`);
    console.log(`跳过: ${skippedCount}条`);
    console.log(`失败: ${failedCount}条`);
    console.log(`总计: ${TEST_NEWS.length}条`);
  } catch (error) {
    console.error('创建失败:', error);
  }
}

main();
