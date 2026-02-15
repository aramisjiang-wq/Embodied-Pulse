/**
 * 视频搜索关键词配置
 * 用于Bilibili和YouTube视频搜索
 */

/**
 * Bilibili视频搜索关键词（中文）
 * 使用 OR 连接多个关键词，Bilibili API支持OR语法
 */
export const BILIBILI_VIDEO_KEYWORDS = [
  // 核心概念
  '具身智能',
  '机器人',
  '人工智能',
  'AI',
  '机器学习',
  '智能体',
  '智能机器人',
  
  // 技术相关
  '计算机视觉',
  'CV',
  '深度学习',
  '神经网络',
  '强化学习',
  'RL',
  '大模型',
  'LLM',
  'GPT',
  '多模态',
  '自然语言处理',
  'NLP',
  
  // 应用场景
  '自动驾驶',
  '服务机器人',
  '工业机器人',
  '医疗机器人',
  '教育机器人',
  '家庭机器人',
  '人形机器人',
  '仿生机器人',
  '机械臂',
  '机器人控制',
  '机器人导航',
  'SLAM',
  
  // 学习方法
  '模仿学习',
  '迁移学习',
  '元学习',
  'sim-to-real',
  '仿真到现实',
  
  // 任务类型
  '物体抓取',
  '物体操作',
  '路径规划',
  '视觉导航',
  '灵巧操作',
].join(' OR ');

/**
 * YouTube视频搜索关键词（英文）
 * 使用 OR 连接多个关键词，YouTube API支持OR语法
 */
export const YOUTUBE_VIDEO_KEYWORDS = [
  // Core concepts
  'embodied AI',
  'embodied intelligence',
  'embodied artificial intelligence',
  'robotics',
  'robot',
  'artificial intelligence',
  'AI',
  'machine learning',
  'agent',
  'intelligent robot',
  
  // Technology
  'computer vision',
  'CV',
  'deep learning',
  'neural network',
  'reinforcement learning',
  'RL',
  'large model',
  'LLM',
  'GPT',
  'multimodal',
  'natural language processing',
  'NLP',
  'vision-language',
  'VLA',
  'vision-language-action',
  
  // Applications
  'autonomous driving',
  'self-driving',
  'service robot',
  'industrial robot',
  'medical robot',
  'healthcare robot',
  'educational robot',
  'home robot',
  'household robot',
  'humanoid robot',
  'bionic robot',
  'robot arm',
  'robot control',
  'robot navigation',
  'SLAM',
  
  // Learning methods
  'imitation learning',
  'transfer learning',
  'meta learning',
  'sim-to-real',
  'simulation to reality',
  
  // Tasks
  'object manipulation',
  'grasping',
  'path planning',
  'visual navigation',
  'dexterous manipulation',
  'pick and place',
  'tool use',
].join(' OR ');

/**
 * 获取Bilibili视频搜索关键词
 * @param useExtended 是否使用扩展关键词（默认true）
 */
export function getBilibiliKeywords(useExtended: boolean = true): string {
  if (useExtended) {
    return BILIBILI_VIDEO_KEYWORDS;
  }
  // 精简版：只使用核心关键词
  return '具身智能 OR 机器人 OR 人工智能 OR AI';
}

/**
 * 获取YouTube视频搜索关键词
 * @param useExtended 是否使用扩展关键词（默认true）
 */
export function getYouTubeKeywords(useExtended: boolean = true): string {
  if (useExtended) {
    return YOUTUBE_VIDEO_KEYWORDS;
  }
  // 精简版：只使用核心关键词
  return 'embodied AI OR robotics OR artificial intelligence';
}
