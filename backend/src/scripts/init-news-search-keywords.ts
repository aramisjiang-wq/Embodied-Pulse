/**
 * 初始化新闻搜索关键词
 */

import adminPrisma, { ensureAdminDatabaseConnected } from '../config/database.admin';
import { logger } from '../utils/logger';

async function main() {
  logger.info('开始初始化新闻搜索关键词...');

  await ensureAdminDatabaseConnected();

  const keywords = [
    { keyword: '具身智能', category: '核心概念', priority: 100 },
    { keyword: 'Embodied AI', category: '核心概念', priority: 100 },
    { keyword: '机器人', category: '核心概念', priority: 90 },
    { keyword: '人工智能', category: '核心概念', priority: 90 },
    { keyword: '深度学习', category: '技术相关', priority: 80 },
    { keyword: '机器学习', category: '技术相关', priority: 80 },
    { keyword: '强化学习', category: '学习方法', priority: 85 },
    { keyword: '模仿学习', category: '学习方法', priority: 85 },
    { keyword: '计算机视觉', category: '技术相关', priority: 75 },
    { keyword: '自然语言处理', category: '技术相关', priority: 75 },
    { keyword: '大语言模型', category: '技术相关', priority: 95 },
    { keyword: 'LLM', category: '技术相关', priority: 95 },
    { keyword: 'VLA', category: '技术相关', priority: 95 },
    { keyword: 'Vision-Language-Action', category: '技术相关', priority: 95 },
    { keyword: '多模态', category: '技术相关', priority: 85 },
    { keyword: '机器人控制', category: '应用场景', priority: 70 },
    { keyword: '运动规划', category: '应用场景', priority: 70 },
    { keyword: '导航', category: '应用场景', priority: 70 },
    { keyword: '抓取', category: '应用场景', priority: 70 },
    { keyword: '操作', category: '应用场景', priority: 70 },
    { keyword: '人机交互', category: '应用场景', priority: 75 },
    { keyword: '工业机器人', category: '应用场景', priority: 65 },
    { keyword: '服务机器人', category: '应用场景', priority: 65 },
    { keyword: '医疗机器人', category: '应用场景', priority: 65 },
    { keyword: '农业机器人', category: '应用场景', priority: 65 },
    { keyword: '自动驾驶', category: '应用场景', priority: 80 },
    { keyword: 'SLAM', category: '技术相关', priority: 80 },
    { keyword: '感知', category: '技术相关', priority: 75 },
    { keyword: '推理', category: '技术相关', priority: 75 },
    { keyword: 'Transformer', category: '技术相关', priority: 85 },
    { keyword: '扩散模型', category: '技术相关', priority: 85 },
    { keyword: '神经网络', category: '技术相关', priority: 80 },
    { keyword: '传感器', category: '技术相关', priority: 70 },
    { keyword: '执行器', category: '技术相关', priority: 70 },
    { keyword: '仿真', category: '技术相关', priority: 75 },
    { keyword: 'ROS', category: '技术相关', priority: 75 },
    { keyword: 'Gazebo', category: '技术相关', priority: 70 },
    { keyword: 'MuJoCo', category: '技术相关', priority: 70 },
    { keyword: 'Isaac Gym', category: '技术相关', priority: 70 },
    { keyword: 'Habitat', category: '技术相关', priority: 70 },
    { keyword: 'RLBench', category: '技术相关', priority: 70 },
    { keyword: 'ManiSkill', category: '技术相关', priority: 70 },
    { keyword: 'Open-X-Embodiment', category: '技术相关', priority: 70 },
    { keyword: 'Affordance', category: '技术相关', priority: 75 },
    { keyword: 'Grounding', category: '技术相关', priority: 75 },
    { keyword: 'Sensorimotor', category: '技术相关', priority: 75 },
    { keyword: 'Embodied Cognition', category: '核心概念', priority: 80 },
    { keyword: 'Embodied Perception', category: '核心概念', priority: 80 },
    { keyword: 'Embodied Reasoning', category: '核心概念', priority: 80 },
    { keyword: 'Embodied Robotics', category: '核心概念', priority: 85 },
    { keyword: 'Embodied Intelligence', category: '核心概念', priority: 85 },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const keywordData of keywords) {
    try {
      const existing = await adminPrisma.news_search_keywords.findUnique({
        where: { keyword: keywordData.keyword },
      });

      if (existing) {
        logger.info(`关键词已存在，跳过: ${keywordData.keyword}`);
        skippedCount++;
        continue;
      }

      await adminPrisma.news_search_keywords.create({
        data: {
          keyword: keywordData.keyword,
          category: keywordData.category,
          priority: keywordData.priority,
        } as any,
      });

      createdCount++;
      logger.info(`创建关键词: ${keywordData.keyword}`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        logger.error(`创建关键词失败 (${keywordData.keyword}):`, error.message);
      }
    }
  }

  logger.info(`\n初始化完成:`);
  logger.info(`  创建: ${createdCount}`);
  logger.info(`  跳过: ${skippedCount}`);
}

if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('初始化失败:', error);
      process.exit(1);
    });
}

export { main as initNewsSearchKeywords };
