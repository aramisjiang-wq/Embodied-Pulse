import userPrisma from '../config/database.user';

const TEST_NEWS = [
  {
    title: 'OpenAI发布新一代GPT-5模型，实现真正的多模态理解与生成',
    summary: 'OpenAI今日宣布推出GPT-5旗舰模型，该模型首次实现了真正的多模态理解与生成能力，能够同时处理文本、图像、音频和视频，并在具身智能任务中展现出卓越的性能。',
    content: 'OpenAI今日宣布推出GPT-5旗舰模型，这是该公司迄今为止最强大的人工智能系统。GPT-5首次实现了真正的多模态理解与生成能力，能够同时处理文本、图像、音频和视频等多种模态的信息。\n\n在具身智能领域，GPT-5展现出了令人印象深刻的能力。该模型能够理解物理世界的规律，并根据语言指令完成复杂的机器人操作任务。OpenAI表示，GPT-5在机器人操控精度方面比上一代提升了40%以上。\n\n此外，GPT-5还具备强大的推理能力和常识理解，能够在不确定的环境中做出合理的决策。这使得它在自动驾驶、智能家居、工业自动化等领域具有广阔的应用前景。\n\nOpenAI透露，已与多家机器人公司建立合作关系，将GPT-5集成到下一代智能机器人中。预计首批搭载GPT-5的消费级机器人将于明年下半年面世。',
    source: 'TechCrunch',
    author: 'John Smith',
    url: 'https://techcrunch.com/gpt-5-launch',
    sourceUrl: 'https://techcrunch.com',
    imageUrl: 'https://picsum.photos/seed/gpt5/400/250',
    category: 'technology',
    tags: JSON.stringify(['GPT-5', 'OpenAI', '多模态', '具身智能']),
    viewCount: 15420,
    publishedAt: new Date('2024-02-03'),
  },
  {
    title: '清华大学研发新型人形机器人"清华小智"，具备复杂环境适应能力',
    summary: '清华大学智能科学与技术实验室近日发布了一款名为"清华小智"的新型人形机器人，该机器人能够在复杂非结构化环境中自主导航和操作，标志着中国在具身智能领域取得重大突破。',
    content: '清华大学智能科学与技术实验室近日发布了一款名为"清华小智"的新型人形机器人。该机器人身高1.7米，体重65公斤，具备36个自由度，能够完成行走、奔跑、攀爬、抓取等多种动作。\n\n"清华小智"最大的特点是其强大的环境适应能力。通过集成先进的计算机视觉和触觉感知系统，机器人能够在复杂非结构化环境中自主导航，即使在光线不足或地面不平的情况下也能保持稳定。\n\n在抓取能力方面，"清华小智"采用了新型的灵巧手设计，能够抓取各种形状和材质的物体，包括易碎的玻璃杯和不规则的工具。这使得它能够胜任家庭服务和工业装配等多种应用场景。\n\n清华大学表示，"清华小智"将在明年进入产业化阶段，预计将在医疗护理、家庭服务等领域率先应用。',
    source: '新华网',
    author: '张明',
    url: 'https://news.tsinghua.edu.cn/qhwx',
    sourceUrl: 'https://news.tsinghua.edu.cn',
    imageUrl: 'https://picsum.photos/seed/tsinghua/400/250',
    category: 'research',
    tags: JSON.stringify(['清华大学', '人形机器人', '具身智能', '中国科研']),
    viewCount: 8932,
    publishedAt: new Date('2024-02-02'),
  },
  {
    title: '英伟达发布下一代机器人计算平台Isaac SuperX，性能提升5倍',
    summary: '英伟达在GTC大会上发布了新一代机器人计算平台Isaac SuperX，该平台专为大规模具身智能应用设计，提供前所未有的计算性能和能效比。',
    content: '英伟达在今日举办的GTC大会上正式发布了新一代机器人计算平台Isaac SuperX。这是一款专为大规模具身智能应用设计的计算平台，相比上一代产品性能提升了5倍，能效比提升了3倍。\n\nIsaac SuperX采用了英伟达最新的Blackwell架构GPU，集成了先进的神经网络加速器。该平台支持同时运行数十个复杂的AI模型，包括视觉感知、语言理解、运动规划和决策制定等。\n\n在软件方面，Isaac SuperX预装了英伟达最新的Isaac机器人开发工具包，提供完整的仿真环境和开发框架。开发者可以在虚拟环境中快速训练和测试机器人算法，然后无缝部署到实际硬件上。\n，英伟达宣布将与多家机器人制造商合作，将Isaac SuperX集成到下一代工业机器人和服务机器人中。预计明年第一季度开始供货。',
    source: 'VentureBeat',
    author: 'Sarah Johnson',
    url: 'https://venturebeat.com/nvidia-isaac-superx',
    sourceUrl: 'https://venturebeat.com',
    imageUrl: 'https://picsum.photos/seed/nvidia/400/250',
    category: 'technology',
    tags: JSON.stringify(['英伟达', 'Isaac', '机器人平台', 'GPU']),
    viewCount: 12450,
    publishedAt: new Date('2024-02-01'),
  },
  {
    title: '具身智能公司Figure AI完成6.7亿美元B轮融资，估值突破50亿美元',
    summary: '专注于通用人形机器人的初创公司Figure AI今日宣布完成6.7亿美元B轮融资，估值达到50亿美元，成为具身智能领域估值最高的独角兽企业。',
    content: '专注于通用人形机器人的初创公司Figure AI今日宣布完成6.7亿美元B轮融资，投资方包括微软、OpenAI、英伟达等知名科技公司。此轮融资后，Figure AI估值达到50亿美元，成为具身智能领域估值最高的独角兽企业。\n\nFigure AI成立于2022年，其目标是开发能够替代人类从事各种工作的通用人形机器人。该公司的首款产品Figure 01已经在多家汽车工厂进行测试，能够完成装配、质检和物流等多种任务。\n\nCEO Brett Adcock表示，此轮融资将主要用于加速产品研发和扩大生产规模。公司计划在未来两年内将员工数量从目前的200人扩大到1000人，并在美国建立首个大规模生产基地。\n\n他还透露，Figure AI正在开发新一代人形机器人，预计将具备更强的精细操作能力和更长的续航时间。这些机器人将首先应用于物流、制造和医疗护理等领域。',
    source: 'Bloomberg',
    author: 'Michael Chen',
    url: 'https://bloomberg.com/figure-ai-funding',
    sourceUrl: 'https://bloomberg.com',
    imageUrl: 'https://picsum.photos/seed/figure/400/250',
    category: 'funding',
    tags: JSON.stringify(['Figure AI', '融资', '人形机器人', '独角兽']),
    viewCount: 7856,
    publishedAt: new Date('2024-01-31'),
  },
  {
    title: '谷歌DeepMind发布机器人控制大模型Robotics Transformer 2',
    summary: '谷歌DeepMind近日发布了新一代机器人控制大模型Robotics Transformer 2（RT-2），该模型能够从互联网-scale的数据中学习通用的机器人操作策略，显著提升了机器人的泛化能力。',
    content: '谷歌DeepMind近日发布了新一代机器人控制大模型Robotics Transformer 2（RT-2）。与上一代相比，RT-2最显著的改进在于其泛化能力 - 它能够将从互联网大规模数据中学到的知识迁移到机器人控制任务中。\n\nRT-2采用了视觉-语言-动作（VLA）架构，能够同时理解视觉信息、语言指令和动作输出。通过在互联网上的图像和文本数据上进行预训练，RT-2获得了丰富的世界知识，能够理解各种物体和场景的概念。\n\n在实验中，RT-2在未见过的新任务上的成功率达到了上一代产品的3倍。这意味着机器人能够更好地处理从未遇到过的物体和环境，大大减少了针对特定任务进行训练的需求。\n\nDeepMind表示，RT-2已经能够在实验室环境中完成诸如"将红色积木放入蓝色盒子"这样的复杂指令，即使它从未见过这些具体的物体。',
    source: 'MIT Technology Review',
    author: 'Emily Rodriguez',
    url: 'https://technologyreview.com/rt-2-launch',
    sourceUrl: 'https://technologyreview.com',
    imageUrl: 'https://picsum.photos/seed/rt2/400/250',
    category: 'research',
    tags: JSON.stringify(['谷歌', 'DeepMind', 'RT-2', '机器人控制']),
    viewCount: 9876,
    publishedAt: new Date('2024-01-30'),
  },
  {
    title: '波士顿动力发布新一代Atlas液压机器人，展示惊人运动能力',
    summary: '波士顿动力公司今日发布了新一代Atlas人形机器人，这是该公司首款完全电驱动的Atlas机器人，具备更强的运动能力和更高的能源效率。',
    content: '波士顿动力公司今日发布了新一代Atlas人形机器人。与之前的液压驱动版本不同，新Atlas采用了完全电动驱动系统，这使得它更安静、更高效，同时也更容易控制和维护。\n\n新一代Atlas展示了令人印象深刻的运动能力，包括行走、跑步、跳跃、翻滚甚至跑酷等动作。在演示视频中，Atlas能够灵活地穿越复杂的地形，完成高难度的体操动作。\n\n波士顿动力表示，新Atlas的续航时间比上一代产品增加了50%，同时负载能力也得到了显著提升。这使得它更适合在现实世界中长时间工作。\n\n在感知方面，新Atlas集成了更先进的传感器系统，包括360度激光雷达和多个深度摄像头。这使得机器人能够实时感知周围环境并做出相应的调整。',
    source: 'The Verge',
    author: 'David Kim',
    url: 'https://theverge.com/atlas-electric',
    sourceUrl: 'https://theverge.com',
    imageUrl: 'https://picsum.photos/seed/atlas/400/250',
    category: 'product',
    tags: JSON.stringify(['波士顿动力', 'Atlas', '人形机器人', '电动化']),
    viewCount: 23456,
    publishedAt: new Date('2024-01-29'),
  },
  {
    title: '中国发布《具身智能产业发展行动计划》，2025年产业规模目标5000亿元',
    summary: '工业和信息化部近日联合多部门发布了《具身智能产业发展行动计划（2024-2025年）》，明确提出到2025年具身智能产业规模达到5000亿元的目标。',
    content: '工业和信息化部近日联合科技部、教育部等多部门发布了《具身智能产业发展行动计划（2024-2025年）》。这是中国首次从国家层面制定具身智能产业的发展规划。\n\n《计划》明确了发展目标：到2025年，具身智能产业规模达到5000亿元，形成2-3家具有国际竞争力的领军企业；突破一批关键核心技术，在感知、决策、控制等核心技术上实现自主可控；建成一批具身智能应用示范场景。\n\n《计划》还提出了重点任务，包括加强基础研究和前沿探索、突破核心关键技术、建设高水平创新平台、培育壮大市场主体、推动典型应用场景落地等。\n\n专家表示，《计划》的发布将有力推动中国具身智能产业的快速发展，预计将带动机器人、自动驾驶、智能制造等相关产业产值超过2万亿元。',
    source: '人民日报',
    author: '李华',
    url: 'https://people.com.cn/embodied-ai-plan',
    sourceUrl: 'https://people.com.cn',
    imageUrl: 'https://picsum.photos/seed/policy/400/250',
    category: 'policy',
    tags: JSON.stringify(['政策', '中国', '产业规划', '5000亿']),
    viewCount: 15678,
    publishedAt: new Date('2024-01-28'),
  },
  {
    title: '特斯拉Optimus机器人进入特斯拉工厂实习，预计明年量产',
    summary: '特斯拉CEO埃隆·马斯克今日宣布，Optimus人形机器人已开始在上海超级工厂进行实习工作，预计明年将实现量产并对外销售。',
    content: '特斯拉CEO埃隆·马斯克今日在社交媒体上宣布，Optimus人形机器人已开始在上海超级工厂进行实习工作。这是Optimus首次在真实的工业环境中进行测试。\n\n根据特斯拉发布的信息，Optimus目前主要负责工厂中的零件搬运和简单的装配工作。虽然这些任务看似简单，但它们对于验证机器人在复杂环境中的可靠性至关重要。\n\n马斯克表示，Optimus的进度超出预期，预计明年将实现量产。他预测，Optimus将成为特斯拉最重要的产品之一，长期需求可能超过100亿台。\n\n在技术方面，特斯拉强调Optimus采用了与特斯拉汽车相同的AI系统，包括神经网络、视觉处理和路径规划等。这种技术复用不仅降低了成本，也加速了机器人的迭代和改进。',
    source: 'Reuters',
    author: 'Lisa Wang',
    url: 'https://reuters.com/optimus-factory',
    sourceUrl: 'https://reuters.com',
    imageUrl: 'https://picsum.photos/seed/optimus/400/250',
    category: 'product',
    tags: JSON.stringify(['特斯拉', 'Optimus', '人形机器人', '量产']),
    viewCount: 34567,
    publishedAt: new Date('2024-01-27'),
  },
  {
    title: '斯坦福大学开发新型触觉传感器，让机器人拥有"类人触觉"',
    summary: '斯坦福大学研究人员近日开发了一种新型触觉传感器Tacotron，能够让机器人获得接近人类的触觉感知能力，这对于精细操作任务具有重要意义。',
    content: '斯坦福大学研究人员近日开发了一种名为Tacotron的新型触觉传感器。与传统触觉传感器不同，Tacotron能够感知接触物体的硬度、质地、温度等多种信息，接近人类的触觉感知能力。\n\nTacotron采用了创新的传感器设计，在柔软的弹性层中集成了高密度的压力传感器阵列。当传感器接触物体时，能够精确测量接触力的分布和变化，从而推断出物体的属性。\n\n在实验中，装备Tacrotron的机器人能够准确地区分不同材质的布料、识别水果的成熟度，甚至能够读取盲文。这些能力对于精细操作任务具有重要意义。\n\n研究人员表示，Tacotron的成本较低，有望在商业机器人中得到广泛应用。他们已经成立了一家初创公司，计划在明年推出商业化的触觉传感器产品。',
    source: 'Science',
    author: 'Dr. James Wilson',
    url: 'https://science.stanford.edu/tacotron',
    sourceUrl: 'https://science.stanford.edu',
    imageUrl: 'https://picsum.photos/seed/tactile/400/250',
    category: 'research',
    tags: JSON.stringify(['斯坦福', '触觉传感器', 'Tacotron', '精细操作']),
    viewCount: 6543,
    publishedAt: new Date('2024-01-26'),
  },
  {
    title: '亚马逊部署10万台机器人仓库，效率提升40%',
    summary: '亚马逊近日宣布，其全球仓库网络中已部署超过10万台机器人，这些机器人与人类员工协同工作，使得仓库运营效率提升了40%。',
    content: '亚马逊近日宣布，其全球仓库网络中已部署超过10万台机器人。这些机器人包括移动机器人（用于搬运货架）、分拣机器人、包装机器人等多种类型。\n\n亚马逊的机器人系统采用了先进的AI技术，能够自主规划路径、避障和优化工作流程。机器人与人类员工协同工作，承担重复性、高强度的体力劳动，而人类员工则负责更复杂的决策和异常处理。\n\n数据显示，引入机器人后，亚马逊仓库的运营效率提升了40%，订单处理时间缩短了50%以上。同时，员工的工作条件也得到改善，减少了长时间搬运重物的需求。\n\n亚马逊表示，未来将继续加大对机器人技术的投资，计划在未来三年内将机器人数量翻一番。他们还在开发新一代的协作机器人，能够更自然地与人类员工交互。',
    source: 'Wall Street Journal',
    author: 'Robert Brown',
    url: 'https://wsj.com/amazon-robots',
    sourceUrl: 'https://wsj.com',
    imageUrl: 'https://picsum.photos/seed/amazon/400/250',
    category: 'product',
    tags: JSON.stringify(['亚马逊', '仓储机器人', '自动化', '效率提升']),
    viewCount: 11234,
    publishedAt: new Date('2024-01-25'),
  },
];

async function main() {
  try {
    console.log('开始创建测试新闻数据...\n');

    let createdCount = 0;
    let skippedCount = 0;

    for (const newsData of TEST_NEWS) {
      try {
        await userPrisma.news.create({
          data: {
            ...newsData,
            publishedAt: newsData.publishedAt || new Date(),
          },
        });
        createdCount++;
        console.log(`✓ 创建新闻: ${newsData.title.substring(0, 50)}...`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          skippedCount++;
          console.log(`- 跳过已存在: ${newsData.title.substring(0, 50)}...`);
        } else {
          console.error(`✗ 创建失败: ${newsData.title.substring(0, 50)}...`, error.message);
        }
      }
    }

    console.log(`\n完成！`);
    console.log(`创建: ${createdCount}条新闻`);
    console.log(`跳过: ${skippedCount}条`);
    console.log(`总计: ${TEST_NEWS.length}条`);
  } catch (error) {
    console.error('创建失败:', error);
  }
}

main();
