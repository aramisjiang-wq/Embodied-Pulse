/**
 * 订阅预置配置
 * 定义默认的订阅关键词和标签
 */

/**
 * 论文预置关键词（具身智能相关）
 */
export const PAPER_PRESET_KEYWORDS = [
  // 核心术语
  'embodied AI',
  'embodied intelligence',
  'embodied agent',
  
  // 机器人相关
  'robotic manipulation',
  'robot learning',
  'robotic grasping',
  'humanoid robot',
  'mobile manipulation',
  
  // 感知与理解
  'vision-language-action',
  'VLA model',
  'multimodal robot',
  'spatial reasoning',
  'scene understanding',
  
  // 学习方法
  'reinforcement learning for robotics',
  'imitation learning',
  'learning from demonstration',
  'sim-to-real',
  'world model',
  
  // 任务类型
  'object manipulation',
  'navigation',
  'pick and place',
  'tool use',
  'dexterous manipulation',
];

/**
 * 论文预置分类
 */
export const PAPER_PRESET_CATEGORIES = [
  'cs.RO',  // Robotics
  'cs.AI',  // Artificial Intelligence
  'cs.LG',  // Machine Learning
  'cs.CV',  // Computer Vision
  'cs.HC',  // Human-Computer Interaction
];

/**
 * 论文预置作者（具身智能领域知名学者）
 */
export const PAPER_PRESET_AUTHORS = [
  'Sergey Levine',
  'Pieter Abbeel',
  'Chelsea Finn',
  'Lerrel Pinto',
  'Dieter Fox',
  'Abhinav Gupta',
  'Animesh Garg',
  'Dorsa Sadigh',
  'Jeannette Bohg',
  'Ken Goldberg',
];

/**
 * 视频预置UP主（公共内容，管理员配置）
 */
export const VIDEO_PRESET_UPLOADERS = {
  bilibili: [
    '跟李沐学AI',
    '3Blue1Brown官方',
    'Yannic Kilcher',
    '机器之心Pro',
    '量子位',
  ],
  youtube: [
    'Yannic Kilcher',
    'Two Minute Papers',
    'AI Explained',
    'MIT OpenCourseWare',
    'Stanford Online',
  ],
};

/**
 * GitHub预置主题
 */
export const GITHUB_PRESET_TOPICS = [
  'robotics',
  'embodied-ai',
  'reinforcement-learning',
  'robot-learning',
  'manipulation',
  'navigation',
  'ros',
  'ros2',
  'pytorch',
  'tensorflow',
  'isaac-sim',
  'mujoco',
];

/**
 * HuggingFace预置任务
 */
export const HUGGINGFACE_PRESET_TASKS = [
  'robotics',
  'reinforcement-learning',
  'image-to-text',
  'visual-question-answering',
  'object-detection',
  'depth-estimation',
];

/**
 * 获取论文预置订阅配置
 */
export function getPaperPresetSubscription() {
  return {
    contentType: 'paper',
    keywords: PAPER_PRESET_KEYWORDS.slice(0, 10), // 取前10个关键词
    tags: PAPER_PRESET_CATEGORIES,
    authors: PAPER_PRESET_AUTHORS.slice(0, 5), // 取前5个作者
  };
}

/**
 * 获取视频预置订阅配置（公共）
 */
export function getVideoPresetSubscription(platform: 'bilibili' | 'youtube') {
  return {
    contentType: 'video',
    uploaders: VIDEO_PRESET_UPLOADERS[platform],
    platform,
    isPublic: true, // 公共订阅，所有用户可见
  };
}
