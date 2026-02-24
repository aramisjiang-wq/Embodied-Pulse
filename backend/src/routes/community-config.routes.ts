import { Router } from 'express';
import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

const router = Router();
const prisma = userPrisma as any;

router.get('/hot-topics', async (req, res) => {
  try {
    const config = await prisma.systemConfig.findFirst({
      where: {
        key: 'community_hot_topics'
      }
    });

    let hotTopics = [];
    if (config && config.value) {
      try {
        hotTopics = JSON.parse(config.value);
      } catch (e) {
        logger.error('Failed to parse hot topics config:', e);
      }
    }

    res.json({
      code: 0,
      message: 'success',
      data: {
        topics: hotTopics
      }
    });
  } catch (error) {
    logger.error('Get hot topics config error:', error);
    res.status(500).json({
      code: 500,
      message: '获取热门话题配置失败',
      data: null
    });
  }
});

router.put('/hot-topics', async (req, res) => {
  try {
    const { topics } = req.body;

    if (!Array.isArray(topics)) {
      return res.status(400).json({
        code: 400,
        message: 'topics必须是数组',
        data: null
      });
    }

    const existingConfig = await prisma.systemConfig.findFirst({
      where: {
        key: 'community_hot_topics'
      }
    });

    if (existingConfig) {
      await prisma.systemConfig.update({
        where: {
          id: existingConfig.id
        },
        data: {
          value: JSON.stringify(topics),
          updatedAt: new Date()
        }
      });
    } else {
      await prisma.systemConfig.create({
        data: {
          key: 'community_hot_topics',
          value: JSON.stringify(topics),
          description: '市集热门话题配置'
        }
      });
    }

    res.json({
      code: 0,
      message: '更新成功',
      data: {
        topics
      }
    });
  } catch (error) {
    logger.error('Update hot topics config error:', error);
    res.status(500).json({
      code: 500,
      message: '更新热门话题配置失败',
      data: null
    });
  }
});

router.get('/auto-topics', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const posts = await prisma.post.findMany({
      where: {
        status: 'active',
        createdAt: {
          gte: startDate
        }
      },
      select: {
        tags: true
      }
    });

    const topicCounts: Record<string, number> = {};
    posts.forEach((post: any) => {
      if (post.tags) {
        try {
          const tags = JSON.parse(post.tags);
          tags.forEach((tag: string) => {
            topicCounts[tag] = (topicCounts[tag] || 0) + 1;
          });
        } catch (e) {
          logger.error('Failed to parse tags:', post.tags);
        }
      }
    });

    const sortedTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([topic, count]) => ({ topic, count }));

    res.json({
      code: 0,
      message: 'success',
      data: {
        topics: sortedTopics
      }
    });
  } catch (error) {
    logger.error('Get auto topics error:', error);
    res.status(500).json({
      code: 500,
      message: '获取自动识别话题失败',
      data: null
    });
  }
});

export default router;
