/**
 * 新闻同步服务
 * 从36Kr等平台抓取具身智能相关新闻
 */

import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';
import axios from 'axios';

const prisma = userPrisma as any;

interface NewsItem {
  title: string;
  description: string;
  content?: string;
  source: string;
  url: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  published_date: Date;
}

interface SyncResult {
  synced: number;
  errors: number;
  duplicates: number;
}

const EMBODIED_INTELLIGENCE_KEYWORDS = [
  '具身智能',
  'embodied AI',
  'embodied intelligence',
  '机器人',
  'robotics',
  '人形机器人',
  'humanoid robot',
  'AI机器人',
  '智能机器人',
  '机器人学习',
  'robot learning',
  '感知控制',
  'perception control',
  '运动控制',
  'motor control',
  '多模态',
  'multimodal',
  '视觉导航',
  'visual navigation',
  '操作',
  'manipulation',
  '抓取',
  'grasping',
  'Sim-to-Real',
  '仿真到现实',
  '强化学习',
  'reinforcement learning',
  '模仿学习',
  'imitation learning',
  'Transformer',
  '大模型',
  'LLM',
  'VLM',
  '视觉语言模型',
  '视觉语言导航',
  'VLN',
];

function isEmbodiedIntelligenceRelated(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return EMBODIED_INTELLIGENCE_KEYWORDS.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
}

function categorizeNews(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes('融资') || text.includes('funding') || text.includes('投资') || text.includes('investment')) {
    return 'funding';
  }
  
  if (text.includes('发布') || text.includes('launch') || text.includes('产品') || text.includes('product')) {
    return 'product';
  }
  
  if (text.includes('论文') || text.includes('paper') || text.includes('研究') || text.includes('research') || text.includes('算法')) {
    return 'research';
  }
  
  return 'technology';
}

function extractTags(title: string, description: string): string[] {
  const tags: string[] = [];
  const text = `${title} ${description}`;

  EMBODIED_INTELLIGENCE_KEYWORDS.forEach(keyword => {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      tags.push(keyword);
    }
  });

  return [...new Set(tags)].slice(0, 5);
}

async function syncFrom36Kr(): Promise<SyncResult> {
  try {
    logger.info('开始从36Kr同步新闻');

    let synced = 0;
    let errors = 0;
    let duplicates = 0;

    const response = await axios.get('https://36kr.com/api/news-web/newsflash', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const newsList = response.data?.data?.data || [];

    for (const item of newsList) {
      try {
        const title = item.title || '';
        const description = item.description || item.description || '';
        const url = item.news_url || item.url || '';

        if (!title || !url) continue;

        if (!isEmbodiedIntelligenceRelated(title, description)) {
          continue;
        }

        const existingNews = await prisma.news.findUnique({
          where: { url },
        });

        if (existingNews) {
          duplicates++;
          continue;
        }

        const category = categorizeNews(title, description);
        const tags = extractTags(title, description);
        const published_date = item.published_at ? new Date(item.published_at) : new Date();

        await prisma.news.create({
          data: {
            id: crypto.randomUUID(),
            title,
            description,
            content: item.content || description,
            source: '36kr',
            url,
            imageUrl: item.image_url || item.cover || null,
            category,
            tags: JSON.stringify(tags),
            published_date,
            viewCount: 0,
            favoriteCount: 0,
          },
        });

        synced++;
        logger.info(`同步新闻: ${title}`);
      } catch (error) {
        logger.error('同步单条新闻失败:', error);
        errors++;
      }
    }

    logger.info(`36Kr同步完成: 同步 ${synced} 条, 跳过 ${duplicates} 条, 错误 ${errors} 个`);

    return { synced, errors, duplicates };
  } catch (error) {
    logger.error('从36Kr同步新闻失败:', error);
    throw new Error('SYNC_36KR_FAILED');
  }
}

async function cleanOldNews(daysToKeep: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.news.deleteMany({
      where: {
        published_date: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`清理旧新闻: 删除 ${result.count} 条`);
    return result.count;
  } catch (error) {
    logger.error('清理旧新闻失败:', error);
    throw new Error('CLEAN_NEWS_FAILED');
  }
}

async function getSyncStats(): Promise<any> {
  try {
    const totalNews = await prisma.news.count();
    const todayNews = await prisma.news.count({
      where: {
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const categoryStats = await prisma.news.groupBy({
      by: ['category'],
      _count: true,
    });

    return {
      total: totalNews,
      today: todayNews,
      byCategory: categoryStats.map((stat: any) => ({
        category: stat.category,
        count: stat._count,
      })),
    };
  } catch (error) {
    logger.error('获取同步统计失败:', error);
    throw new Error('GET_SYNC_STATS_FAILED');
  }
}

export {
  syncFrom36Kr,
  cleanOldNews,
  getSyncStats,
  isEmbodiedIntelligenceRelated,
  categorizeNews,
  extractTags,
};
export type { NewsItem, SyncResult };
