/**
 * 生成测试数据
 * 为数据库生成测试用的新闻、论文、视频、仓库数据
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

async function main() {
  logger.info('========== 开始生成测试数据 ==========');

  try {
    const prisma = await userPrisma;

    // 生成新闻数据
    const newsData = [
      {
        id: '5f930ec6-0bc2-43be-8f58-415bcd0d5fdf',
        title: '具身智能领域迎来新突破：人形机器人实现自主导航',
        summary: '最新研究显示，基于多模态大模型的人形机器人在复杂环境中实现了自主导航和物体识别，标志着具身智能技术取得重要进展。',
        content: '最新研究显示，基于多模态大模型的人形机器人在复杂环境中实现了自主导航和物体识别，标志着具身智能技术取得重要进展。该系统结合了视觉语言模型和强化学习算法，使机器人能够在未知环境中自主规划路径并完成指定任务。',
        source: '36kr',
        url: 'https://36kr.com/p/test1',
        cover_url: 'https://example.com/image1.jpg',
        category: 'research',
        tags: JSON.stringify(['具身智能', '人形机器人', '多模态', '视觉语言模型']),
        published_date: new Date('2026-02-01'),
        view_count: 120,
        favorite_count: 15,
      },
      {
        id: 'ea561cf1-cfc8-405e-a119-b84a84980b1d',
        title: 'AI机器人公司完成2亿美元B轮融资，加速产品商业化',
        summary: '专注于具身智能技术的AI机器人公司宣布完成2亿美元B轮融资，将用于加速产品研发和市场拓展。',
        content: '专注于具身智能技术的AI机器人公司宣布完成2亿美元B轮融资，本轮融资由多家知名投资机构领投。公司表示，资金将用于加速产品研发和市场拓展，推动具身智能技术在工业和服务领域的应用。',
        source: '36kr',
        url: 'https://36kr.com/p/test2',
        cover_url: 'https://example.com/image2.jpg',
        category: 'funding',
        tags: JSON.stringify(['具身智能', '融资', '商业化']),
        published_date: new Date('2026-02-01'),
        view_count: 89,
        favorite_count: 8,
      },
      {
        id: '720003d6-7dc4-45c9-a218-ef03ef3202ec',
        title: '新一代机器人操作系统发布，支持Sim-to-Real迁移',
        summary: '新一代机器人操作系统正式发布，引入了先进的仿真到现实迁移技术，大幅降低了机器人开发成本。',
        content: '新一代机器人操作系统正式发布，引入了先进的仿真到现实迁移技术，大幅降低了机器人开发成本。该系统支持多种机器人平台，提供了丰富的预训练模型和工具链，使开发者能够快速构建和部署机器人应用。',
        source: '36kr',
        url: 'https://36kr.com/p/test3',
        cover_url: 'https://example.com/image3.jpg',
        category: 'product',
        tags: JSON.stringify(['机器人', 'Sim-to-Real', '仿真到现实']),
        published_date: new Date('2026-02-02'),
        view_count: 156,
        favorite_count: 22,
      },
      {
        id: '8510d686-a888-41ff-9025-d535236380bf',
        title: '强化学习在机器人抓取任务中的应用研究',
        summary: '最新研究展示了强化学习在机器人抓取任务中的优异表现，通过大量仿真训练实现了高精度的物体抓取。',
        content: '最新研究展示了强化学习在机器人抓取任务中的优异表现，通过大量仿真训练实现了高精度的物体抓取。研究团队采用了深度Q网络和策略梯度方法，使机器人能够适应不同形状和材质的物体。',
        source: '36kr',
        url: 'https://36kr.com/p/test4',
        cover_url: 'https://example.com/image4.jpg',
        category: 'research',
        tags: JSON.stringify(['强化学习', '抓取', '机器人']),
        published_date: new Date('2026-02-02'),
        view_count: 203,
        favorite_count: 31,
      },
      {
        id: 'd9cace74-2631-4d7a-8209-b9f022e0c642',
        title: 'Transformer架构在机器人控制中的创新应用',
        summary: '研究团队将Transformer架构应用于机器人控制任务，实现了端到端的感知控制一体化。',
        content: '研究团队将Transformer架构应用于机器人控制任务，实现了端到端的感知控制一体化。该方法通过自注意力机制捕捉环境中的关键信息，显著提升了机器人在复杂任务中的表现。',
        source: '36kr',
        url: 'https://36kr.com/p/test5',
        cover_url: 'https://example.com/image5.jpg',
        category: 'research',
        tags: JSON.stringify(['Transformer', '感知控制', '机器人']),
        published_date: new Date('2026-02-02'),
        view_count: 178,
        favorite_count: 25,
      },
    ];

    let newsCreated = 0;
    for (const news of newsData) {
      const existing = await prisma.news.findUnique({
        where: { url: news.url },
      });
      if (!existing) {
        await prisma.news.create({ data: news as any });
        newsCreated++;
      }
    }
    logger.info(`✓ 创建了 ${newsCreated} 条新闻数据`);

    // 生成论文数据
    const paperData = [
      {
        arxivId: '2401.00001',
        title: 'Learning to Walk in the Real World with Minimal Human Effort',
        authors: 'John Smith, Jane Doe, et al.',
        abstract: 'We present a novel approach to robot locomotion learning that requires minimal human supervision.',
        pdfUrl: 'https://arxiv.org/pdf/2401.00001.pdf',
        publishedDate: new Date('2024-01-01'),
        citationCount: 45,
        venue: 'arXiv',
        categories: 'cs.RO',
        view_count: 89,
        favorite_count: 12,
      },
      {
        arxivId: '2401.00002',
        title: 'Multimodal Embodied AI for Robotic Manipulation',
        authors: 'Alice Johnson, Bob Wilson, et al.',
        abstract: 'This paper explores multimodal approaches to robotic manipulation tasks.',
        pdfUrl: 'https://arxiv.org/pdf/2401.00002.pdf',
        publishedDate: new Date('2024-01-02'),
        citationCount: 32,
        venue: 'arXiv',
        categories: 'cs.RO',
        view_count: 76,
        favorite_count: 9,
      },
      {
        arxivId: '2401.00003',
        title: 'Sim-to-Real Transfer for Humanoid Robots',
        authors: 'Charlie Brown, David Lee, et al.',
        abstract: 'We propose a new method for transferring policies from simulation to real humanoid robots.',
        pdfUrl: 'https://arxiv.org/pdf/2401.00003.pdf',
        publishedDate: new Date('2024-01-03'),
        citationCount: 28,
        venue: 'arXiv',
        categories: 'cs.RO',
        view_count: 65,
        favorite_count: 8,
      },
    ];

    let paperCreated = 0;
    for (const paper of paperData) {
      const existing = await prisma.paper.findUnique({
        where: { arxivId: paper.arxivId },
      });
      if (!existing) {
        await prisma.paper.create({ data: paper });
        paperCreated++;
      }
    }
    logger.info(`✓ 创建了 ${paperCreated} 条论文数据`);

    // 生成视频数据
    const videoData = [
      {
        platform: 'bilibili',
        videoId: 'BV1xx411c7mD',
        title: '具身智能入门教程：从零开始学习机器人AI',
        description: '本视频介绍具身智能的基本概念，包括感知、决策、执行等核心模块。',
        uploader: 'AI学习频道',
        uploaderId: '123456',
        coverUrl: 'https://example.com/video1.jpg',
        duration: 1800,
        view_count: 12500,
        likeCount: 890,
        commentCount: 156,
        publishedDate: new Date('2024-01-15'),
        tags: JSON.stringify(['具身智能', '机器人', 'AI教程']),
      },
      {
        platform: 'bilibili',
        videoId: 'BV1yy411c7mE',
        title: '强化学习在机器人控制中的应用实战',
        description: '演示如何使用强化学习算法训练机器人完成复杂任务。',
        uploader: '机器人实验室',
        uploaderId: '234567',
        coverUrl: 'https://example.com/video2.jpg',
        duration: 2400,
        view_count: 8900,
        likeCount: 620,
        commentCount: 98,
        publishedDate: new Date('2024-01-20'),
        tags: JSON.stringify(['强化学习', '机器人控制', '实战']),
      },
      {
        platform: 'bilibili',
        videoId: 'BV1zz411c7mF',
        title: 'Sim-to-Real：从仿真到现实的迁移技术详解',
        description: '深入讲解仿真到现实迁移的原理和实现方法。',
        uploader: 'AI技术分享',
        uploaderId: '345678',
        coverUrl: 'https://example.com/video3.jpg',
        duration: 2100,
        view_count: 15600,
        likeCount: 1120,
        commentCount: 234,
        publishedDate: new Date('2024-01-25'),
        tags: JSON.stringify(['Sim-to-Real', '仿真', '机器人']),
      },
    ];

    let videoCreated = 0;
    for (const video of videoData) {
      const existing = await prisma.video.findUnique({
        where: { bvid: video.videoId },
      });
      if (!existing) {
        const { commentCount, ...videoData } = video;
        await prisma.video.create({ data: videoData });
        videoCreated++;
      }
    }
    logger.info(`✓ 创建了 ${videoCreated} 条视频数据`);

    // 生成仓库数据
    const repoData = [
      {
        repoId: 123456789,
        fullName: 'openai/embodied-ai',
        name: 'embodied-ai',
        description: 'OpenAI\'s embodied AI research and implementations.',
        language: 'Python',
        starsCount: 12500,
        forksCount: 2300,
        issuesCount: 45,
        topics: JSON.stringify(['embodied-ai', 'robotics', 'reinforcement-learning']),
        homepageUrl: 'https://openai.com/research/embodied-ai',
        owner: 'openai',
        updatedDate: new Date('2024-01-20'),
        view_count: 8900,
        favorite_count: 156,
      },
      {
        repoId: 987654321,
        fullName: 'deepmind/robotics',
        name: 'robotics',
        description: 'DeepMind robotics research code and datasets.',
        language: 'Python',
        starsCount: 8900,
        forksCount: 1800,
        issuesCount: 32,
        topics: JSON.stringify(['robotics', 'deep-learning', 'control']),
        homepageUrl: 'https://deepmind.com/research/robotics',
        owner: 'deepmind',
        updatedDate: new Date('2024-01-18'),
        view_count: 6700,
        favorite_count: 98,
      },
      {
        repoId: 456789123,
        fullName: 'facebookresearch/habitat',
        name: 'habitat',
        description: 'A platform for embodied AI research.',
        language: 'Python',
        starsCount: 15600,
        forksCount: 3200,
        issuesCount: 78,
        topics: JSON.stringify(['embodied-ai', 'simulation', 'navigation']),
        homepageUrl: 'https://ai.facebook.com/tools/habitat',
        owner: 'facebookresearch',
        updatedDate: new Date('2024-01-22'),
        view_count: 12300,
        favorite_count: 245,
      },
    ];

    let repoCreated = 0;
    for (const repo of repoData) {
      const existing = await prisma.githubRepo.findUnique({
        where: { fullName: repo.fullName },
      });
      if (!existing) {
        await prisma.githubRepo.create({ data: repo });
        repoCreated++;
      }
    }
    logger.info(`✓ 创建了 ${repoCreated} 条仓库数据`);

    logger.info('========== 测试数据生成完成 ==========');
    process.exit(0);
  } catch (error: any) {
    logger.error(`生成测试数据失败: ${error.message}`);
    process.exit(1);
  }
}

main();
