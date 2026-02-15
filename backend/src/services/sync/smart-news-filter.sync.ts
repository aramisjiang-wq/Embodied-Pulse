/**
 * 智能新闻筛选服务
 * 从全量新闻中筛选出与机器人、AI、具身智能相关的新闻
 * 包括融资、新产品动态等
 */

import userPrisma from '../../config/database.user';
import { logger } from '../../utils/logger';
// 使用Prisma生成的类型（与数据库模型匹配）
type News = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  platform: string;
  publishedDate: Date | null;
  viewCount: number;
  favoriteCount: number;
  shareCount: number;
  score: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// 关键词列表 - 用于筛选相关新闻
const KEYWORDS = {
  // 核心概念
  core: [
    '机器人', 'robot', 'robotics',
    '人工智能', 'AI', 'artificial intelligence', '机器学习', 'machine learning',
    '具身智能', 'embodied intelligence', 'embodied AI', 'embodied artificial intelligence',
    '智能体', 'agent', '智能机器人',
  ],
  // 技术相关
  technology: [
    '计算机视觉', 'computer vision', 'CV',
    '自然语言处理', 'NLP', 'natural language processing',
    '深度学习', 'deep learning', '神经网络', 'neural network',
    '强化学习', 'reinforcement learning', 'RL',
    '大模型', 'large model', 'LLM', 'GPT',
    '多模态', 'multimodal',
  ],
  // 应用场景
  application: [
    '自动驾驶', 'autonomous driving', 'self-driving',
    '服务机器人', 'service robot',
    '工业机器人', 'industrial robot',
    '医疗机器人', 'medical robot', 'healthcare robot',
    '教育机器人', 'educational robot',
    '家庭机器人', 'home robot', 'household robot',
    '人形机器人', 'humanoid robot',
    '仿生机器人', 'bionic robot',
  ],
  // 公司和产品
  companies: [
    'OpenAI', 'Google', 'Microsoft', 'Meta', 'Tesla', 'Tesla Bot',
    'Boston Dynamics', 'Boston Dynamics',
    '优必选', 'UBTech', '小米', 'Xiaomi', '小米机器人',
    '腾讯', 'Tencent', '阿里巴巴', 'Alibaba', '百度', 'Baidu',
    '字节跳动', 'ByteDance', '商汤', 'SenseTime', '旷视', 'Megvii',
    '大疆', 'DJI', '科大讯飞', 'iFlytek',
    'Figure', 'Agility Robotics', '1X', 'Sanctuary AI',
  ],
  // 融资相关
  financing: [
    '融资', 'funding', '投资', 'investment', 'IPO', '上市',
    'A轮', 'B轮', 'C轮', 'D轮', 'E轮', 'F轮', 'G轮',
    '种子轮', '天使轮', 'Pre-A', 'Pre-B',
    '亿美元', '千万美元', '亿元人民币', '估值',
    '领投', '跟投', '参投',
  ],
  // 新产品动态
  products: [
    '发布', 'launch', '推出', '新品', '新产品',
    '升级', 'upgrade', '更新', 'update',
    '突破', 'breakthrough', '创新', 'innovation',
    '首次', 'first', '首次亮相', 'debut',
  ],
};

/**
 * 计算新闻与关键词的匹配度
 */
export function calculateRelevanceScore(news: any): number {
  const title = (news.title || '').toLowerCase();
  const description = (news.description || '').toLowerCase();
  const text = `${title} ${description}`;

  let score = 0;

  // 核心概念权重最高
  for (const keyword of KEYWORDS.core) {
    if (text.includes(keyword.toLowerCase())) {
      score += 10;
    }
  }

  // 技术相关
  for (const keyword of KEYWORDS.technology) {
    if (text.includes(keyword.toLowerCase())) {
      score += 5;
    }
  }

  // 应用场景
  for (const keyword of KEYWORDS.application) {
    if (text.includes(keyword.toLowerCase())) {
      score += 6;
    }
  }

  // 公司和产品
  for (const keyword of KEYWORDS.companies) {
    if (text.includes(keyword.toLowerCase())) {
      score += 4;
    }
  }

  // 融资相关（重要但权重稍低）
  for (const keyword of KEYWORDS.financing) {
    if (text.includes(keyword.toLowerCase())) {
      score += 3;
    }
  }

  // 新产品动态
  for (const keyword of KEYWORDS.products) {
    if (text.includes(keyword.toLowerCase())) {
      score += 2;
    }
  }

  // 如果标题中包含核心关键词，额外加分
  const titleLower = title.toLowerCase();
  for (const keyword of KEYWORDS.core) {
    if (titleLower.includes(keyword.toLowerCase())) {
      score += 5;
    }
  }

  return score;
}

/**
 * 判断新闻是否与机器人/AI/具身智能相关
 */
function isRelevantNews(news: News, minScore: number = 5): boolean {
  const score = calculateRelevanceScore(news);
  return score >= minScore;
}

/**
 * 筛选相关新闻
 * @param platform 平台名称，如果指定则只筛选该平台的新闻
 * @param days 筛选最近N天的新闻，默认7天
 * @param minScore 最低匹配分数，默认5
 */
export async function filterRelevantNews(
  platform?: string,
  days: number = 7,
  minScore: number = 5
): Promise<{ relevant: News[]; filtered: News[]; stats: { total: number; relevant: number; filtered: number } }> {
  try {
    logger.info(`开始筛选相关新闻，平台: ${platform || '全部'}, 最近${days}天, 最低分数: ${minScore}`);

    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 构建查询条件
    const where: any = {
      publishedDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (platform) {
      where.platform = platform;
    }

    // 获取所有符合条件的新闻
    const allNews = await userPrisma.news.findMany({
      where,
      orderBy: {
        publishedDate: 'desc',
      },
    });

    logger.info(`获取到 ${allNews.length} 条新闻`);

    // 筛选相关新闻
    const relevantNews: News[] = [];
    const filteredNews: News[] = [];

    for (const news of allNews) {
      const score = calculateRelevanceScore(news);
      if (score >= minScore) {
        relevantNews.push(news as any);
      } else {
        filteredNews.push(news as any);
      }
    }

    // 按匹配分数排序
    relevantNews.sort((a, b) => {
      const scoreA = calculateRelevanceScore(a);
      const scoreB = calculateRelevanceScore(b);
      return scoreB - scoreA;
    });

    logger.info(`筛选完成: 相关 ${relevantNews.length} 条, 过滤 ${filteredNews.length} 条`);

    return {
      relevant: relevantNews,
      filtered: filteredNews,
      stats: {
        total: allNews.length,
        relevant: relevantNews.length,
        filtered: filteredNews.length,
      },
    };
  } catch (error: any) {
    logger.error(`筛选相关新闻失败: ${error.message}`);
    throw error;
  }
}

/**
 * 标记新闻为相关（可以通过添加标签或分类字段实现）
 * 这里我们通过更新description字段添加标记
 */
export async function markRelevantNews(newsIds: string[]): Promise<number> {
  try {
    let markedCount = 0;

    for (const newsId of newsIds) {
      try {
        const news = await userPrisma.news.findUnique({
          where: { id: newsId },
        });

        if (news) {
          // 检查是否已经标记
          const description = news.description || '';
          if (!description.includes('[AI相关]')) {
            await userPrisma.news.update({
              where: { id: newsId },
              data: {
                description: description
                  ? `${description} [AI相关]`
                  : '[AI相关]',
              },
            });
            markedCount++;
          }
        }
      } catch (error: any) {
        logger.error(`标记新闻 ${newsId} 失败: ${error.message}`);
      }
    }

    logger.info(`标记了 ${markedCount} 条相关新闻`);
    return markedCount;
  } catch (error: any) {
    logger.error(`标记相关新闻失败: ${error.message}`);
    throw error;
  }
}

/**
 * 每日智能筛选任务
 * 筛选最近7天的新闻，并标记相关新闻
 */
export async function dailySmartFilter(): Promise<{
  success: boolean;
  stats: { total: number; relevant: number; marked: number };
}> {
  try {
    logger.info('========== 开始每日智能新闻筛选 ==========');

    // 筛选最近7天的新闻
    const result = await filterRelevantNews(undefined, 7, 5);

    // 标记相关新闻
    const newsIds = result.relevant.map((news) => news.id);
    const markedCount = await markRelevantNews(newsIds);

    logger.info('========== 每日智能新闻筛选完成 ==========');
    logger.info(`统计: 总计 ${result.stats.total} 条, 相关 ${result.stats.relevant} 条, 已标记 ${markedCount} 条`);

    return {
      success: true,
      stats: {
        total: result.stats.total,
        relevant: result.stats.relevant,
        marked: markedCount,
      },
    };
  } catch (error: any) {
    logger.error(`每日智能筛选失败: ${error.message}`);
    throw error;
  }
}
