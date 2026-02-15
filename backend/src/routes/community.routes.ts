import { Router } from 'express';
import userPrisma from '../config/database.user';

const router = Router();
const prisma = userPrisma;

router.get('/hot-topics', async (req, res) => {
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
    posts.forEach(post => {
      if (post.tags) {
        try {
          const tags = JSON.parse(post.tags);
          tags.forEach((tag: string) => {
            topicCounts[tag] = (topicCounts[tag] || 0) + 1;
          });
        } catch (e) {
          console.error('Failed to parse tags:', post.tags);
        }
      }
    });

    const sortedTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    res.json({
      code: 0,
      message: 'success',
      data: {
        topics: sortedTopics.map(t => t.topic),
        topicDetails: sortedTopics
      }
    });
  } catch (error) {
    console.error('Get hot topics error:', error);
    res.status(500).json({
      code: 500,
      message: '获取热门话题失败',
      data: null
    });
  }
});

router.get('/active-users', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        posts: {
          some: {
            createdAt: {
              gte: startDate
            }
          }
        }
      },
      include: {
        _count: {
          select: {
            posts: true,
            comments: true
          }
        }
      },
      orderBy: {
        points: 'desc'
      },
      take: 10
    });

    const activeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      level: user.level,
      points: user.points,
      postCount: user._count.posts,
      commentCount: user._count.comments,
      activityScore: user.points + user._count.posts * 10 + user._count.comments * 5
    })).sort((a, b) => b.activityScore - a.activityScore);

    res.json({
      code: 0,
      message: 'success',
      data: {
        users: activeUsers
      }
    });
  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({
      code: 500,
      message: '获取活跃用户失败',
      data: null
    });
  }
});

export default router;
