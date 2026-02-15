/**
 * 快速添加测试论文数据
 */

import userPrisma from '../config/database.user';

const TEST_PAPERS = [
  {
    arxivId: '2401.16215',
    title: 'EmbodiedAI-Survey: A Comprehensive Survey on Embodied AI and Robotics',
    authors: 'Research Team, AI Lab',
    abstract: 'This comprehensive survey covers the latest advances in embodied artificial intelligence, including robotic manipulation, navigation, and human-robot interaction. We review over 500 papers and highlight key challenges and future directions.',
    pdfUrl: 'https://arxiv.org/pdf/2401.16215.pdf',
    publishedDate: new Date('2024-01-15'),
    citationCount: 156,
    venue: 'arXiv',
    categories: 'cs.RO,cs.AI',
    viewCount: 1523,
    favoriteCount: 89,
    shareCount: 45,
  },
  {
    arxivId: '2401.16216',
    title: 'Learning to Manipulate Objects with Minimal Supervision Using Deep Reinforcement Learning',
    authors: 'Xiaoming Chen, Wei Zhang, et al.',
    abstract: 'We present a novel deep reinforcement learning approach for robotic manipulation that requires minimal human supervision. Our method achieves state-of-the-art performance on multiple benchmarks.',
    pdfUrl: 'https://arxiv.org/pdf/2401.16216.pdf',
    publishedDate: new Date('2024-01-16'),
    citationCount: 89,
    venue: 'arXiv',
    categories: 'cs.RO,cs.LG',
    viewCount: 987,
    favoriteCount: 67,
    shareCount: 32,
  },
  {
    arxivId: '2401.16208',
    title: 'Vision-Language Models for Open-World Robotic Manipulation',
    authors: 'Yuki Tanaka, Hiroshi Yamamoto, et al.',
    abstract: 'This paper introduces a vision-language model specifically designed for open-world robotic manipulation tasks. We show that our model can generalize to novel objects and environments without additional training.',
    pdfUrl: 'https://arxiv.org/pdf/2401.16208.pdf',
    publishedDate: new Date('2024-01-18'),
    citationCount: 234,
    venue: 'arXiv',
    categories: 'cs.RO,cs.CV',
    viewCount: 2156,
    favoriteCount: 123,
    shareCount: 78,
  },
  {
    arxivId: '2401.16202',
    title: 'Sim-to-Real Transfer with Domain Randomization for Quadruped Robots',
    authors: 'Michael Park, Sarah Johnson, et al.',
    abstract: 'We propose an improved domain randomization method for sim-to-real transfer of quadruped robot locomotion policies. Our approach reduces the reality gap by 60% compared to previous methods.',
    pdfUrl: 'https://arxiv.org/pdf/2401.16202.pdf',
    publishedDate: new Date('2024-01-20'),
    citationCount: 78,
    venue: 'arXiv',
    categories: 'cs.RO',
    viewCount: 876,
    favoriteCount: 54,
    shareCount: 28,
  },
  {
    arxivId: '2401.16195',
    title: 'Hierarchical Planning for Long-Horizon Robotic Manipulation',
    authors: 'David Liu, Emily Wang, et al.',
    abstract: 'This paper presents a hierarchical planning framework for long-horizon robotic manipulation tasks. We demonstrate the effectiveness of our approach on complex household and industrial manipulation scenarios.',
    pdfUrl: 'https://arxiv.org/pdf/2401.16195.pdf',
    publishedDate: new Date('2024-01-22'),
    citationCount: 167,
    venue: 'arXiv',
    categories: 'cs.RO,cs.AI',
    viewCount: 1432,
    favoriteCount: 95,
    shareCount: 56,
  },
  {
    arxivId: '2401.16188',
    title: 'Self-Supervised Learning for Robotic Perception and Control',
    authors: 'James Wilson, Lisa Chen, et al.',
    abstract: 'We introduce a self-supervised learning framework that enables robots to learn representations from unlabeled sensory data. Our method significantly reduces the amount of labeled data needed for training robotic agents.',
    pdfUrl: 'https://arxiv.org/pdf/2401.16188.pdf',
    publishedDate: new Date('2024-01-25'),
    citationCount: 198,
    venue: 'arXiv',
    categories: 'cs.RO,cs.LG',
    viewCount: 1876,
    favoriteCount: 112,
    shareCount: 67,
  },
  {
    arxivId: '2401.16175',
    title: 'Large Language Models for Robotic Task Planning',
    authors: 'Kevin Zhang, Rachel Kim, et al.',
    abstract: 'This work explores the use of large language models for high-level task planning in robotics. We show that LLMs can generate valid and efficient task plans for complex manipulation and navigation problems.',
    pdfUrl: 'https://arxiv.org/pdf/2401.16175.pdf',
    publishedDate: new Date('2024-01-28'),
    citationCount: 312,
    venue: 'arXiv',
    categories: 'cs.AI,cs.RO',
    viewCount: 2987,
    favoriteCount: 178,
    shareCount: 98,
  },
  {
    arxivId: '2401.16160',
    title: 'Dexterous In-Hand Manipulation with Reinforcement Learning',
    authors: 'Anna Martinez, Robert Brown, et al.',
    abstract: 'We present a reinforcement learning system for dexterous in-hand manipulation using multi-fingered robotic hands. Our approach achieves human-level performance on various manipulation tasks.',
    pdfUrl: 'https://arxiv.org/pdf/2401.16160.pdf',
    publishedDate: new Date('2024-01-30'),
    citationCount: 145,
    venue: 'arXiv',
    categories: 'cs.RO',
    viewCount: 1321,
    favoriteCount: 87,
    shareCount: 45,
  },
];

async function main() {
  console.log('🚀 开始添加测试论文数据...\n');

  let papersCreated = 0;
  let papersSkipped = 0;

  for (const paper of TEST_PAPERS) {
    try {
      const existing = await userPrisma.paper.findUnique({
        where: { arxivId: paper.arxivId },
      });

      if (existing) {
        console.log(`⏭ 跳过已存在: ${paper.arxivId}`);
        papersSkipped++;
        continue;
      }

      await userPrisma.paper.create({ data: paper });
      console.log(`✅ 创建论文: ${paper.title.substring(0, 50)}...`);
      papersCreated++;
    } catch (error: any) {
      console.error(`❌ 创建失败: ${paper.arxivId}`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 论文数据添加完成:`);
  console.log(`   新建: ${papersCreated}`);
  console.log(`   跳过: ${papersSkipped}`);
  console.log('='.repeat(50));

  process.exit(0);
}

main().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
