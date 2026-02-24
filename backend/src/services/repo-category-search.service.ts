/**
 * GitHub仓库分类智能搜索服务
 * 为每个分类定义搜索关键词，从GitHub搜索新项目
 */

import axios from 'axios';
import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const githubClient = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` }),
  },
  timeout: 30000,
});

/**
 * 分类搜索关键词映射
 * 基于具身智能GitHub仓库资源清单文档定义
 */
export const CATEGORY_SEARCH_KEYWORDS: Record<string, {
  keywords: string[];
  description: string;
}> = {
  '1.1': {
    keywords: [
      'VLA vision-language-action robot',
      'OpenVLA robot policy',
      'robot transformer policy',
      'vision language robot action',
      'embodied multimodal robot',
    ],
    description: '视觉-语言-动作模型 (VLA)',
  },
  '1.2': {
    keywords: [
      'imitation learning robot',
      'behavior cloning robot',
      'ACT robot manipulation',
      'ALOHA robot',
      'diffusion policy robot',
      'robot learning from demonstration',
    ],
    description: '模仿学习与行为克隆',
  },
  '1.3': {
    keywords: [
      'reinforcement learning robot',
      'PPO SAC robot',
      'robot RL training',
      'deep RL robotics',
      'policy gradient robot',
    ],
    description: '强化学习框架与算法',
  },
  '1.4': {
    keywords: [
      'world model robot',
      'Dreamer robot',
      'TD-MPC robot',
      'MuZero robot',
      'predictive model robotics',
      'model-based RL robot',
    ],
    description: '世界模型与预测',
  },
  '2.1': {
    keywords: [
      'robot dataset',
      'robotics demonstration dataset',
      'manipulation dataset',
      'robot learning data',
      'embodied AI dataset',
    ],
    description: '核心数据集',
  },
  '2.2': {
    keywords: [
      'robot simulation',
      'Isaac Gym',
      'MuJoCo robot',
      'PyBullet robot',
      'robot simulator',
      'physics engine robot',
    ],
    description: '机器人仿真环境',
  },
  '3.1': {
    keywords: [
      'robot grasping',
      'manipulation robot',
      'robot arm control',
      'pick and place robot',
      'robot motion planning',
    ],
    description: '机器人操作与抓取',
  },
  '3.2': {
    keywords: [
      'dexterous manipulation',
      'robot hand',
      'shadow hand robot',
      'allegro hand',
      'dexterous grasping',
    ],
    description: '灵巧手与精细操作',
  },
  '3.3': {
    keywords: [
      'motion planning',
      'trajectory optimization robot',
      'robot control',
      'MPC robot',
      'inverse kinematics',
    ],
    description: '运动规划与控制',
  },
  '4.1': {
    keywords: [
      'SLAM robot',
      'visual SLAM',
      'LIO-SAM',
      'ORB-SLAM',
      'robot navigation',
      'lidar SLAM',
    ],
    description: '机器人导航与SLAM',
  },
  '4.2': {
    keywords: [
      'point cloud',
      '3D vision',
      'Open3D',
      'PCL point cloud',
      '3D reconstruction',
      'depth estimation robot',
    ],
    description: '3D视觉与点云处理',
  },
  '4.3': {
    keywords: [
      'robot vision',
      'object detection robot',
      'segmentation robot',
      'robot perception',
      'visual recognition robot',
    ],
    description: '机器人视觉与感知',
  },
  '5.1': {
    keywords: [
      'ROS robot',
      'ROS2',
      'robot operating system',
      'ROS navigation',
      'ROS control',
    ],
    description: 'ROS与机器人操作系统',
  },
  '5.2': {
    keywords: [
      'humanoid robot',
      'quadruped robot',
      'bipedal robot',
      'legged robot',
      'robot dog',
    ],
    description: '人形机器人与四足机器人',
  },
  '5.3': {
    keywords: [
      'open source robot',
      'DIY robot',
      'robot hardware',
      'low cost robot',
      'robot arm kit',
    ],
    description: '开源机器人硬件平台',
  },
  '5.4': {
    keywords: [
      'LLM robot',
      'large language model robotics',
      'ChatGPT robot',
      'language robot',
      'LLM agent robot',
    ],
    description: '大语言模型与机器人结合',
  },
  '5.5': {
    keywords: [
      'teleoperation robot',
      'robot teleoperation',
      'VR robot control',
      'remote robot',
      'robot data collection',
    ],
    description: '遥操作与数据采集',
  },
  '5.6': {
    keywords: [
      'Sim2Real',
      'domain adaptation robot',
      'transfer learning robot',
      'real-to-sim',
      'simulation to real',
    ],
    description: 'Sim2Real与域适应',
  },
  '6.1': {
    keywords: [
      'robot learning framework',
      'LeRobot',
      'robot training framework',
      'robot learning library',
    ],
    description: '机器人学习框架',
  },
  '6.2': {
    keywords: [
      'robotics toolbox',
      'robot library',
      'kinematics library',
      'dynamics library',
      'robot tools',
    ],
    description: '机器人工具与库',
  },
  '6.3': {
    keywords: [
      'awesome robotics',
      'robotics resources',
      'embodied AI list',
      'robot papers',
    ],
    description: '综合资源清单',
  },
  '6.4': {
    keywords: [
      'autonomous driving',
      'self-driving car',
      'autonomous vehicle',
      'carla simulator',
      'autoware',
    ],
    description: '自动驾驶与移动机器人',
  },
  '6.5': {
    keywords: [
      'tactile sensor robot',
      'robot touch',
      'force sensor robot',
      'tactile robotics',
    ],
    description: '触觉感知与传感器',
  },
  '6.6': {
    keywords: [
      'multi-robot',
      'swarm robot',
      'multi-agent robot',
      'robot team',
    ],
    description: '多机器人系统',
  },
  '6.7': {
    keywords: [
      'robot safety',
      'safe robot',
      'collision avoidance robot',
      'robot reliability',
    ],
    description: '机器人安全与可靠性',
  },
};

interface GitHubSearchResult {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface SuggestedRepo {
  repoId: string;
  fullName: string;
  name: string;
  owner: string;
  description: string;
  language: string;
  starsCount: number;
  forksCount: number;
  issuesCount: number;
  topics: string[];
  htmlUrl: string;
  createdDate: Date;
  updatedDate: Date;
  matchedCategory: string;
  matchedKeywords: string[];
}

/**
 * 搜索指定分类的候选项目
 * @param categoryId 分类ID (如 '1.1')
 * @param minStars 最低Star数
 * @param maxResults 最大结果数
 */
export async function searchReposByCategory(
  categoryId: string,
  minStars: number = 100,
  maxResults: number = 20
): Promise<SuggestedRepo[]> {
  const categoryConfig = CATEGORY_SEARCH_KEYWORDS[categoryId];
  if (!categoryConfig) {
    throw new Error(`未知的分类ID: ${categoryId}`);
  }

  logger.info(`搜索分类 ${categoryId} 的候选项目，关键词数量: ${categoryConfig.keywords.length}`);

  const existingRepos = await userPrisma.githubRepo.findMany({
    select: { fullName: true },
  });
  const existingFullNames = new Set(existingRepos.map(r => r.fullName.toLowerCase()));

  const allResults: Map<string, SuggestedRepo> = new Map();

  for (const keywordQuery of categoryConfig.keywords) {
    try {
      const query = `${keywordQuery} stars:>=${minStars}`;
      
      const response = await githubClient.get('/search/repositories', {
        params: {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: Math.min(maxResults, 30),
        },
      });

      const repos: GitHubSearchResult[] = response.data.items || [];

      for (const repo of repos) {
        const fullNameLower = repo.full_name.toLowerCase();
        
        if (existingFullNames.has(fullNameLower)) {
          continue;
        }

        if (allResults.has(repo.full_name)) {
          const existing = allResults.get(repo.full_name)!;
          if (!existing.matchedKeywords.includes(keywordQuery)) {
            existing.matchedKeywords.push(keywordQuery);
          }
        } else {
          allResults.set(repo.full_name, {
            repoId: String(repo.id),
            fullName: repo.full_name,
            name: repo.name,
            owner: repo.owner.login,
            description: repo.description || '',
            language: repo.language || 'Unknown',
            starsCount: repo.stargazers_count,
            forksCount: repo.forks_count,
            issuesCount: repo.open_issues_count,
            topics: repo.topics || [],
            htmlUrl: repo.html_url,
            createdDate: new Date(repo.created_at),
            updatedDate: new Date(repo.updated_at),
            matchedCategory: categoryId,
            matchedKeywords: [keywordQuery],
          });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error: any) {
      logger.error(`搜索关键词 "${keywordQuery}" 失败:`, error.message);
    }
  }

  const results = Array.from(allResults.values())
    .sort((a, b) => b.starsCount - a.starsCount)
    .slice(0, maxResults);

  logger.info(`分类 ${categoryId} 搜索完成，找到 ${results.length} 个新项目`);
  
  return results;
}

/**
 * 批量添加仓库到数据库
 */
export async function addReposToCategory(
  repos: Array<{ fullName: string; category: string }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const repoData of repos) {
    try {
      const response = await githubClient.get(`/repos/${repoData.fullName}`);
      const repo = response.data;

      await userPrisma.githubRepo.create({
        data: {
          repoId: BigInt(repo.id),
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner.login,
          description: repo.description || '',
          language: repo.language || 'Unknown',
          starsCount: repo.stargazers_count,
          forksCount: repo.forks_count,
          issuesCount: repo.open_issues_count,
          topics: JSON.stringify(repo.topics || []),
          htmlUrl: repo.html_url,
          createdDate: new Date(repo.created_at),
          updatedDate: new Date(repo.updated_at),
          category: repoData.category,
        },
      });

      results.success++;
      logger.info(`成功添加仓库: ${repo.full_name}`);
    } catch (error: any) {
      results.failed++;
      const errorMsg = `${repoData.fullName}: ${error.message}`;
      results.errors.push(errorMsg);
      logger.error(`添加仓库失败: ${errorMsg}`);
    }
  }

  return results;
}

/**
 * 获取所有分类的候选项目统计
 */
export async function getCategorySuggestionStats(minStars: number = 100): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};
  
  const existingRepos = await userPrisma.githubRepo.findMany({
    select: { fullName: true },
  });
  const existingFullNames = new Set(existingRepos.map(r => r.fullName.toLowerCase()));

  for (const [categoryId, config] of Object.entries(CATEGORY_SEARCH_KEYWORDS)) {
    try {
      let count = 0;
      
      for (const keywordQuery of config.keywords.slice(0, 2)) {
        const query = `${keywordQuery} stars:>=${minStars}`;
        
        const response = await githubClient.get('/search/repositories', {
          params: {
            q: query,
            sort: 'stars',
            order: 'desc',
            per_page: 10,
          },
        });

        const repos: GitHubSearchResult[] = response.data.items || [];
        const newRepos = repos.filter(r => !existingFullNames.has(r.full_name.toLowerCase()));
        count += newRepos.length;
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      stats[categoryId] = count;
    } catch (error: any) {
      logger.error(`获取分类 ${categoryId} 统计失败:`, error.message);
      stats[categoryId] = 0;
    }
  }

  return stats;
}
