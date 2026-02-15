/**
 * 初始化论文搜索关键词脚本
 * 用于批量创建具身智能领域的搜索关键词
 */

import { createKeyword } from '../services/paper-search-keyword.service';
import { logger } from '../utils/logger';

interface KeywordData {
  keyword: string;
  category: string;
  sourceType: string;
  priority: number;
  description: string;
  tags: string;
}

const EMBODIED_AI_KEYWORDS: KeywordData[] = [
  // 核心概念
  {
    keyword: 'Embodied AI',
    category: '核心概念',
    sourceType: 'admin',
    priority: 100,
    description: '具身人工智能，强调智能体通过身体与环境的交互来学习和适应',
    tags: JSON.stringify(['具身AI', 'Embodied', 'AI']),
  },
  {
    keyword: 'Embodied Intelligence',
    category: '核心概念',
    sourceType: 'admin',
    priority: 100,
    description: '具身智能，研究智能体如何通过身体与物理世界交互',
    tags: JSON.stringify(['具身智能', 'Embodied', 'Intelligence']),
  },
  {
    keyword: 'Embodied Robotics',
    category: '核心概念',
    sourceType: 'admin',
    priority: 100,
    description: '具身机器人，强调机器人通过身体感知和行动的能力',
    tags: JSON.stringify(['具身机器人', 'Embodied', 'Robotics']),
  },
  {
    keyword: 'VLA',
    category: '核心概念',
    sourceType: 'admin',
    priority: 100,
    description: 'Vision-Language-Action，视觉-语言-行动模型，是具身AI的核心技术',
    tags: JSON.stringify(['VLA', 'Vision-Language-Action', 'Multimodal']),
  },
  {
    keyword: 'Vision-Language-Action',
    category: '核心概念',
    sourceType: 'admin',
    priority: 95,
    description: '视觉-语言-行动模型，连接视觉、语言和行动的跨模态模型',
    tags: JSON.stringify(['VLA', 'Vision-Language-Action', 'Multimodal']),
  },
  {
    keyword: 'Multimodal',
    category: '核心概念',
    sourceType: 'admin',
    priority: 90,
    description: '多模态，处理多种模态（视觉、语言、触觉等）的AI系统',
    tags: JSON.stringify(['Multimodal', '多模态', 'Cross-modal']),
  },
  {
    keyword: 'Sensorimotor',
    category: '核心概念',
    sourceType: 'admin',
    priority: 85,
    description: '感觉运动，强调感知和行动的紧密耦合',
    tags: JSON.stringify(['Sensorimotor', '感觉运动', 'Perception-Action']),
  },
  {
    keyword: 'Grounding',
    category: '核心概念',
    sourceType: 'admin',
    priority: 85,
    description: '具身化，将抽象概念与物理世界的感知和行动联系起来',
    tags: JSON.stringify(['Grounding', '具身化', 'Symbol Grounding']),
  },
  {
    keyword: 'Affordance',
    category: '核心概念',
    sourceType: 'admin',
    priority: 85,
    description: '可供性，物体对智能体提供的行动可能性',
    tags: JSON.stringify(['Affordance', '可供性', 'Object-Action']),
  },

  // 技术相关
  {
    keyword: 'Reinforcement Learning',
    category: '技术相关',
    sourceType: 'admin',
    priority: 80,
    description: '强化学习，通过试错和奖励来学习最优策略',
    tags: JSON.stringify(['RL', '强化学习', 'Reinforcement Learning']),
  },
  {
    keyword: 'Imitation Learning',
    category: '技术相关',
    sourceType: 'admin',
    priority: 80,
    description: '模仿学习，通过模仿专家演示来学习技能',
    tags: JSON.stringify(['Imitation Learning', '模仿学习', 'Learning from Demonstration']),
  },
  {
    keyword: 'Self-supervised Learning',
    category: '技术相关',
    sourceType: 'admin',
    priority: 75,
    description: '自监督学习，从无标注数据中学习表示',
    tags: JSON.stringify(['Self-supervised', '自监督学习', 'Unsupervised']),
  },
  {
    keyword: 'Transformer',
    category: '技术相关',
    sourceType: 'admin',
    priority: 75,
    description: 'Transformer架构，基于自注意力机制的深度学习模型',
    tags: JSON.stringify(['Transformer', 'Attention', 'Deep Learning']),
  },
  {
    keyword: 'Diffusion Model',
    category: '技术相关',
    sourceType: 'admin',
    priority: 70,
    description: '扩散模型，通过逐步去噪生成数据的生成模型',
    tags: JSON.stringify(['Diffusion', '扩散模型', 'Generative Model']),
  },
  {
    keyword: 'Neural Network',
    category: '技术相关',
    sourceType: 'admin',
    priority: 70,
    description: '神经网络，模拟生物神经系统的计算模型',
    tags: JSON.stringify(['Neural Network', '神经网络', 'Deep Learning']),
  },
  {
    keyword: 'Computer Vision',
    category: '技术相关',
    sourceType: 'admin',
    priority: 70,
    description: '计算机视觉，让计算机理解和解释视觉信息',
    tags: JSON.stringify(['CV', 'Computer Vision', '计算机视觉']),
  },
  {
    keyword: 'Natural Language Processing',
    category: '技术相关',
    sourceType: 'admin',
    priority: 70,
    description: '自然语言处理，让计算机理解和生成人类语言',
    tags: JSON.stringify(['NLP', 'Natural Language Processing', '自然语言处理']),
  },
  {
    keyword: 'Robotics Control',
    category: '技术相关',
    sourceType: 'admin',
    priority: 70,
    description: '机器人控制，控制机器人运动的算法和技术',
    tags: JSON.stringify(['Robotics Control', '机器人控制', 'Control Theory']),
  },
  {
    keyword: 'Motion Planning',
    category: '技术相关',
    sourceType: 'admin',
    priority: 70,
    description: '运动规划，规划机器人或智能体的运动轨迹',
    tags: JSON.stringify(['Motion Planning', '运动规划', 'Path Planning']),
  },
  {
    keyword: 'SLAM',
    category: '技术相关',
    sourceType: 'admin',
    priority: 70,
    description: '同步定位与地图构建，同时估计位置和构建环境地图',
    tags: JSON.stringify(['SLAM', 'Simultaneous Localization and Mapping', '定位建图']),
  },
  {
    keyword: 'Visual Servoing',
    category: '技术相关',
    sourceType: 'admin',
    priority: 65,
    description: '视觉伺服，基于视觉反馈的控制方法',
    tags: JSON.stringify(['Visual Servoing', '视觉伺服', 'Visual Feedback']),
  },

  // 应用场景
  {
    keyword: 'Navigation',
    category: '应用场景',
    sourceType: 'admin',
    priority: 60,
    description: '导航，智能体在环境中自主移动的能力',
    tags: JSON.stringify(['Navigation', '导航', 'Path Planning']),
  },
  {
    keyword: 'Manipulation',
    category: '应用场景',
    sourceType: 'admin',
    priority: 60,
    description: '操作，机器人操作物体的能力',
    tags: JSON.stringify(['Manipulation', '操作', 'Robot Manipulation']),
  },
  {
    keyword: 'Grasping',
    category: '应用场景',
    sourceType: 'admin',
    priority: 60,
    description: '抓取，机器人抓取物体的能力',
    tags: JSON.stringify(['Grasping', '抓取', 'Robot Grasping']),
  },
  {
    keyword: 'Human-Robot Interaction',
    category: '应用场景',
    sourceType: 'admin',
    priority: 60,
    description: '人机交互，人与机器人之间的交互和协作',
    tags: JSON.stringify(['HRI', 'Human-Robot Interaction', '人机交互']),
  },
  {
    keyword: 'Autonomous Driving',
    category: '应用场景',
    sourceType: 'admin',
    priority: 55,
    description: '自动驾驶，车辆自主导航和决策',
    tags: JSON.stringify(['Autonomous Driving', '自动驾驶', 'Self-driving']),
  },
  {
    keyword: 'Service Robot',
    category: '应用场景',
    sourceType: 'admin',
    priority: 55,
    description: '服务机器人，为人类提供服务的机器人',
    tags: JSON.stringify(['Service Robot', '服务机器人', 'Home Robot']),
  },
  {
    keyword: 'Industrial Robot',
    category: '应用场景',
    sourceType: 'admin',
    priority: 55,
    description: '工业机器人，用于工业生产的机器人',
    tags: JSON.stringify(['Industrial Robot', '工业机器人', 'Manufacturing']),
  },
  {
    keyword: 'Medical Robot',
    category: '应用场景',
    sourceType: 'admin',
    priority: 55,
    description: '医疗机器人，用于医疗诊断和手术的机器人',
    tags: JSON.stringify(['Medical Robot', '医疗机器人', 'Surgical Robot']),
  },
  {
    keyword: 'Agricultural Robot',
    category: '应用场景',
    sourceType: 'admin',
    priority: 55,
    description: '农业机器人，用于农业生产的机器人',
    tags: JSON.stringify(['Agricultural Robot', '农业机器人', 'Farming Robot']),
  },

  // 学习方法
  {
    keyword: 'Meta-learning',
    category: '学习方法',
    sourceType: 'admin',
    priority: 50,
    description: '元学习，学习如何学习，快速适应新任务',
    tags: JSON.stringify(['Meta-learning', '元学习', 'Learning to Learn']),
  },
  {
    keyword: 'Transfer Learning',
    category: '学习方法',
    sourceType: 'admin',
    priority: 50,
    description: '迁移学习，将知识从一个任务迁移到另一个任务',
    tags: JSON.stringify(['Transfer Learning', '迁移学习', 'Domain Adaptation']),
  },
  {
    keyword: 'Online Learning',
    category: '学习方法',
    sourceType: 'admin',
    priority: 50,
    description: '在线学习，从连续数据流中学习',
    tags: JSON.stringify(['Online Learning', '在线学习', 'Continual Learning']),
  },
  {
    keyword: 'Few-shot Learning',
    category: '学习方法',
    sourceType: 'admin',
    priority: 50,
    description: '少样本学习，从少量样本中学习',
    tags: JSON.stringify(['Few-shot Learning', '少样本学习', 'Low-shot Learning']),
  },

  // 任务类型
  {
    keyword: 'Visual Question Answering',
    category: '任务类型',
    sourceType: 'admin',
    priority: 45,
    description: '视觉问答，基于图像回答问题',
    tags: JSON.stringify(['VQA', 'Visual Question Answering', '视觉问答']),
  },
  {
    keyword: 'Object Detection',
    category: '任务类型',
    sourceType: 'admin',
    priority: 45,
    description: '目标检测，在图像中定位和识别物体',
    tags: JSON.stringify(['Object Detection', '目标检测', 'Object Recognition']),
  },
  {
    keyword: 'Semantic Segmentation',
    category: '任务类型',
    sourceType: 'admin',
    priority: 45,
    description: '语义分割，将图像分割成有意义的区域',
    tags: JSON.stringify(['Semantic Segmentation', '语义分割', 'Image Segmentation']),
  },
  {
    keyword: 'Depth Estimation',
    category: '任务类型',
    sourceType: 'admin',
    priority: 45,
    description: '深度估计，估计图像中物体的深度信息',
    tags: JSON.stringify(['Depth Estimation', '深度估计', '3D Vision']),
  },

  // 人群关注
  {
    keyword: 'LLM',
    category: '人群关注',
    sourceType: 'admin',
    priority: 100,
    description: '大语言模型，大规模预训练的语言模型',
    tags: JSON.stringify(['LLM', 'Large Language Model', '大语言模型']),
  },
  {
    keyword: 'Large Language Model',
    category: '人群关注',
    sourceType: 'admin',
    priority: 100,
    description: '大语言模型，具有强大语言理解和生成能力的模型',
    tags: JSON.stringify(['LLM', 'Large Language Model', '大语言模型']),
  },
  {
    keyword: 'Multimodal LLM',
    category: '人群关注',
    sourceType: 'admin',
    priority: 100,
    description: '多模态大语言模型，能够处理多种模态的大模型',
    tags: JSON.stringify(['Multimodal LLM', '多模态大模型', 'MLLM']),
  },
  {
    keyword: 'Robot Learning',
    category: '人群关注',
    sourceType: 'admin',
    priority: 95,
    description: '机器人学习，让机器人从经验中学习',
    tags: JSON.stringify(['Robot Learning', '机器人学习', 'Robotics']),
  },
  {
    keyword: 'Embodied Cognition',
    category: '人群关注',
    sourceType: 'admin',
    priority: 90,
    description: '具身认知，通过身体交互实现的认知能力',
    tags: JSON.stringify(['Embodied Cognition', '具身认知', 'Cognition']),
  },
  {
    keyword: 'Embodied Perception',
    category: '人群关注',
    sourceType: 'admin',
    priority: 90,
    description: '具身感知，通过身体交互实现的感知能力',
    tags: JSON.stringify(['Embodied Perception', '具身感知', 'Perception']),
  },
  {
    keyword: 'Embodied Reasoning',
    category: '人群关注',
    sourceType: 'admin',
    priority: 90,
    description: '具身推理，基于身体交互的推理能力',
    tags: JSON.stringify(['Embodied Reasoning', '具身推理', 'Reasoning']),
  },
];

async function initKeywords() {
  logger.info('开始初始化论文搜索关键词...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const keywordData of EMBODIED_AI_KEYWORDS) {
    try {
      await createKeyword(keywordData);
      successCount++;
      logger.info(`创建关键词成功: ${keywordData.keyword}`);
    } catch (error: any) {
      if (error.message === 'KEYWORD_ALREADY_EXISTS') {
        logger.warn(`关键词已存在: ${keywordData.keyword}`);
      } else {
        errorCount++;
        logger.error(`创建关键词失败: ${keywordData.keyword}`, error);
      }
    }
  }
  
  logger.info(`初始化完成: 成功 ${successCount} 个，失败 ${errorCount} 个`);
}

if (require.main === module) {
  initKeywords()
    .then(() => {
      logger.info('关键词初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('关键词初始化失败:', error);
      process.exit(1);
    });
}

export { initKeywords };
