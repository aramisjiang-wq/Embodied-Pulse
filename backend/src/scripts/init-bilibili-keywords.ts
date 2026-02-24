/**
 * 初始化Bilibili搜索关键词
 * 将配置文件中的关键词导入到数据库
 */

import { batchCreateKeywords } from '../services/bilibili-search-keyword.service';
import { logger } from '../utils/logger';

// 具身智能相关关键词，用于 B 站视频检索（100+ 个）
const KEYWORDS = [
  // 核心概念
  { keyword: '具身智能', category: '核心概念', priority: 10, isActive: true, description: '核心概念' },
  { keyword: '具身认知', category: '核心概念', priority: 9, isActive: true, description: '核心概念' },
  { keyword: '机器人', category: '核心概念', priority: 10, isActive: true, description: '核心概念' },
  { keyword: '人工智能', category: '核心概念', priority: 9, isActive: true, description: '核心概念' },
  { keyword: 'AI', category: '核心概念', priority: 9, isActive: true, description: '核心概念' },
  { keyword: '机器学习', category: '核心概念', priority: 8, isActive: true, description: '核心概念' },
  { keyword: '智能体', category: '核心概念', priority: 8, isActive: true, description: '核心概念' },
  { keyword: '智能机器人', category: '核心概念', priority: 8, isActive: true, description: '核心概念' },
  { keyword: 'Embodied AI', category: '核心概念', priority: 9, isActive: true, description: '核心概念' },
  { keyword: '具身AI', category: '核心概念', priority: 9, isActive: true, description: '核心概念' },
  { keyword: '通用人工智能', category: '核心概念', priority: 8, isActive: true, description: '核心概念' },
  { keyword: 'AGI', category: '核心概念', priority: 7, isActive: true, description: '核心概念' },
  // 技术相关
  { keyword: '计算机视觉', category: '技术相关', priority: 7, isActive: true, description: '技术相关' },
  { keyword: 'CV', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: '深度学习', category: '技术相关', priority: 7, isActive: true, description: '技术相关' },
  { keyword: '神经网络', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: '强化学习', category: '技术相关', priority: 7, isActive: true, description: '技术相关' },
  { keyword: 'RL', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: '大模型', category: '技术相关', priority: 7, isActive: true, description: '技术相关' },
  { keyword: 'LLM', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: 'GPT', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: '多模态', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: '自然语言处理', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: 'NLP', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '视觉语言模型', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: 'VLM', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '端到端学习', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: 'Transformer', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: '扩散模型', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '动作预测', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: '运动规划', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: '逆强化学习', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '模仿学习', category: '学习方法', priority: 6, isActive: true, description: '学习方法' },
  { keyword: '迁移学习', category: '学习方法', priority: 6, isActive: true, description: '学习方法' },
  { keyword: '元学习', category: '学习方法', priority: 5, isActive: true, description: '学习方法' },
  { keyword: 'sim-to-real', category: '学习方法', priority: 6, isActive: true, description: '学习方法' },
  { keyword: '仿真到现实', category: '学习方法', priority: 6, isActive: true, description: '学习方法' },
  { keyword: 'Sim2Real', category: '学习方法', priority: 6, isActive: true, description: '学习方法' },
  { keyword: '域适应', category: '学习方法', priority: 5, isActive: true, description: '学习方法' },
  { keyword: '零样本学习', category: '学习方法', priority: 5, isActive: true, description: '学习方法' },
  { keyword: '少样本学习', category: '学习方法', priority: 5, isActive: true, description: '学习方法' },
  // 应用场景
  { keyword: '自动驾驶', category: '应用场景', priority: 7, isActive: true, description: '应用场景' },
  { keyword: '无人驾驶', category: '应用场景', priority: 7, isActive: true, description: '应用场景' },
  { keyword: '服务机器人', category: '应用场景', priority: 7, isActive: true, description: '应用场景' },
  { keyword: '工业机器人', category: '应用场景', priority: 7, isActive: true, description: '应用场景' },
  { keyword: '医疗机器人', category: '应用场景', priority: 7, isActive: true, description: '应用场景' },
  { keyword: '手术机器人', category: '应用场景', priority: 7, isActive: true, description: '应用场景' },
  { keyword: '教育机器人', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: '家庭机器人', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: '人形机器人', category: '应用场景', priority: 8, isActive: true, description: '应用场景' },
  { keyword: '双足机器人', category: '应用场景', priority: 7, isActive: true, description: '应用场景' },
  { keyword: '四足机器人', category: '应用场景', priority: 7, isActive: true, description: '应用场景' },
  { keyword: '仿生机器人', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: '机械臂', category: '应用场景', priority: 7, isActive: true, description: '应用场景' },
  { keyword: '协作机器人', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: '机器人控制', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: '机器人导航', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: 'SLAM', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: '移动机器人', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: '仓储机器人', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: '配送机器人', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: '扫地机器人', category: '应用场景', priority: 5, isActive: true, description: '应用场景' },
  { keyword: '无人机', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: '机器人抓取', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: '机器人操作', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  // 任务类型
  { keyword: '物体抓取', category: '任务类型', priority: 6, isActive: true, description: '任务类型' },
  { keyword: '物体操作', category: '任务类型', priority: 6, isActive: true, description: '任务类型' },
  { keyword: '路径规划', category: '任务类型', priority: 6, isActive: true, description: '任务类型' },
  { keyword: '视觉导航', category: '任务类型', priority: 6, isActive: true, description: '任务类型' },
  { keyword: '灵巧操作', category: '任务类型', priority: 6, isActive: true, description: '任务类型' },
  { keyword: 'dexterous manipulation', category: '任务类型', priority: 5, isActive: true, description: '任务类型' },
  { keyword: '视觉伺服', category: '任务类型', priority: 6, isActive: true, description: '任务类型' },
  { keyword: '力控', category: '任务类型', priority: 5, isActive: true, description: '任务类型' },
  { keyword: '触觉感知', category: '任务类型', priority: 5, isActive: true, description: '任务类型' },
  { keyword: '场景理解', category: '任务类型', priority: 5, isActive: true, description: '任务类型' },
  { keyword: '语义分割', category: '任务类型', priority: 5, isActive: true, description: '任务类型' },
  { keyword: '目标检测', category: '任务类型', priority: 6, isActive: true, description: '任务类型' },
  { keyword: '位姿估计', category: '任务类型', priority: 5, isActive: true, description: '任务类型' },
  // 机构/产品/赛事
  { keyword: '波士顿动力', category: '应用场景', priority: 6, isActive: true, description: '机构/产品' },
  { keyword: '特斯拉机器人', category: '应用场景', priority: 7, isActive: true, description: '机构/产品' },
  { keyword: 'Optimus', category: '应用场景', priority: 6, isActive: true, description: '机构/产品' },
  { keyword: '人形机器人开发', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: 'RoboCup', category: '应用场景', priority: 5, isActive: true, description: '赛事' },
  { keyword: '机器人竞赛', category: '应用场景', priority: 5, isActive: true, description: '赛事' },
  { keyword: '机器人学', category: '核心概念', priority: 7, isActive: true, description: '核心概念' },
  { keyword: '机器人技术', category: '核心概念', priority: 7, isActive: true, description: '核心概念' },
  { keyword: 'ROS', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: '机器人操作系统', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: 'Gazebo', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: 'Isaac Sim', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: 'MuJoCo', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '仿真环境', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '数字孪生', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '具身智能大模型', category: '核心概念', priority: 8, isActive: true, description: '核心概念' },
  { keyword: '通用具身智能', category: '核心概念', priority: 8, isActive: true, description: '核心概念' },
  { keyword: '视觉推理', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: 'VLA', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '视觉语言动作', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '机器人学习', category: '核心概念', priority: 7, isActive: true, description: '核心概念' },
  { keyword: '机器人感知', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: '机器人决策', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: '具身决策', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
  { keyword: '机器人仿真', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '触觉反馈', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '多机器人', category: '应用场景', priority: 5, isActive: true, description: '应用场景' },
  { keyword: '集群机器人', category: '应用场景', priority: 5, isActive: true, description: '应用场景' },
  { keyword: '软体机器人', category: '应用场景', priority: 5, isActive: true, description: '应用场景' },
  { keyword: '外骨骼', category: '应用场景', priority: 5, isActive: true, description: '应用场景' },
  { keyword: '康复机器人', category: '应用场景', priority: 6, isActive: true, description: '应用场景' },
  { keyword: '机器人编程', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '示教学习', category: '学习方法', priority: 5, isActive: true, description: '学习方法' },
  { keyword: '人在回路的强化学习', category: '学习方法', priority: 5, isActive: true, description: '学习方法' },
  { keyword: '离线强化学习', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '世界模型', category: '技术相关', priority: 5, isActive: true, description: '技术相关' },
  { keyword: '具身世界模型', category: '技术相关', priority: 6, isActive: true, description: '技术相关' },
];

async function main() {
  try {
    logger.info('开始初始化Bilibili搜索关键词...');
    logger.info(`准备导入 ${KEYWORDS.length} 个关键词`);

    const result = await batchCreateKeywords(KEYWORDS);

    logger.info('========================================');
    logger.info('初始化完成');
    logger.info('========================================');
    logger.info(`成功: ${result.success.length} 个`);
    logger.info(`失败: ${result.errors.length} 个`);
    
    if (result.errors.length > 0) {
      logger.warn('失败的关键词:');
      result.errors.forEach((err: any) => {
        logger.warn(`  - ${err.keyword}: ${err.error}`);
      });
    }

    process.exit(0);
  } catch (error: any) {
    logger.error('初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { main };
