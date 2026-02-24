import { Request, Response, NextFunction } from 'express';
import userPrismaAny from '../config/database.user';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const userPrisma = userPrismaAny as any;

export async function getBilibiliUploaders(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const subscriptions = await userPrisma.subscription.findMany({
      where: {
        userId,
        contentType: 'video',
        platform: 'bilibili',
        isActive: true
      },
      select: {
        uploaders: true
      }
    });

    const uploaderIds = subscriptions
      .map((sub: any) =>{
        try {
          const uploaders = JSON.parse(sub.uploaders || '[]');
          return uploaders;
        } catch {
          return [];
        }
      })
      .flat();

    const uniqueUploaderIds = Array.from(new Set(uploaderIds));

    const uploaders = await userPrisma.bilibiliUploader.findMany({
      where: {
        mid: {
          in: uniqueUploaderIds
        },
        isActive: true
      },
      select: {
        id: true,
        mid: true,
        name: true,
        avatar: true,
        description: true,
        videoCount: true,
        tags: true
      }
    });

    const uploadersWithTags = uploaders.map((uploader: any) =>({
      id: uploader.id,
      mid: uploader.mid,
      name: uploader.name,
      avatar: uploader.avatar,
      description: uploader.description,
      videoCount: uploader.videoCount,
      tags: uploader.tags ? JSON.parse(uploader.tags) : []
    }));

    sendSuccess(res, { uploaders: uploadersWithTags });
  } catch (error: any) {
    logger.error('Get Bilibili uploaders error:', error);
    sendError(res, 500, '获取UP主列表失败');
  }
}

export async function getOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { uploaderIds, startDate, endDate } = req.query;

    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    if (!Array.isArray(uploaderIds) || uploaderIds.length === 0) {
      return sendError(res, 400, '请选择UP主');
    }

    const uploaders = await userPrisma.bilibiliUploader.findMany({
      where: {
        id: {
          in: uploaderIds as string[]
        }
      },
      select: {
        id: true,
        mid: true
      }
    });

    const uploaderMids = uploaders.map((u: any) => u.mid);

    const videos = await userPrisma.video.findMany({
      where: {
        platform: 'bilibili',
        uploaderId: {
          in: uploaderMids
        },
        publishedDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      select: {
        id: true,
        playCount: true,
        publishedDate: true
      }
    });

    const totalVideos = videos.length;
    const total_play_count = videos.reduce((sum: number, v: any) => sum + (v.playCount || 0), 0);
    const avg_play_count = totalVideos > 0 ? Math.round(total_play_count / totalVideos) : 0;

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const newVideosThisMonth = videos.filter((v: any) => 
      v.publishedDate && v.publishedDate >= thisMonthStart
    ).length;

    sendSuccess(res, {
      totalUploaders: uploaders.length,
      totalVideos,
      total_play_count,
      newVideosThisMonth,
      avg_play_count,
      lastUpdatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Get overview error:', error);
    sendError(res, 500, '获取概览数据失败');
  }
}

export async function getPublishTrend(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { uploaderIds, startDate, endDate, groupBy } = req.query;

    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    if (!Array.isArray(uploaderIds) || uploaderIds.length === 0) {
      return sendError(res, 400, '请选择UP主');
    }

    const uploaders = await userPrisma.bilibiliUploader.findMany({
      where: {
        id: {
          in: uploaderIds as string[]
        }
      },
      select: {
        id: true,
        mid: true,
        name: true
      }
    });

    const uploaderMids = uploaders.map((u: any) => u.mid);

    const videos = await userPrisma.video.findMany({
      where: {
        platform: 'bilibili',
        uploaderId: {
          in: uploaderMids
        },
        publishedDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      select: {
        uploaderId: true,
        uploader: true,
        publishedDate: true
      },
      orderBy: {
        publishedDate: 'asc'
      }
    });

    const uploaderMap = new Map(uploaders.map((u: any) => [u.id, u.name]));

    const periodMap = new Map<string, Map<string, number>>();

    videos.forEach((video: any) => {
      const uploader = uploaders.find((u: any) => u.mid === video.uploaderId);
      if (!uploader) return;

      let period: string;
      const date = new Date(video.publishedDate!);
      
      if (groupBy === 'day') {
        period = date.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        period = weekStart.toISOString().split('T')[0];
      }

      if (!periodMap.has(period)) {
        periodMap.set(period, new Map());
      }
      
      const uploaderPeriodMap = periodMap.get(period)!;
      const currentCount = uploaderPeriodMap.get(uploader.id) || 0;
      uploaderPeriodMap.set(uploader.id, currentCount + 1);
    });

    const data = Array.from(periodMap.entries()).flatMap(([period, uploaderMap]) =>
      Array.from(uploaderMap.entries()).map(([uploaderId, videoCount]) => ({
        period,
        uploaderId,
        uploaderName: uploaderMap.get(uploaderId) || uploaderId,
        videoCount
      }))
    );

    sendSuccess(res, { data });
  } catch (error: any) {
    logger.error('Get publish trend error:', error);
    sendError(res, 500, '获取发布趋势失败');
  }
}

export async function getPlayHeatmap(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { uploaderIds, startDate, endDate } = req.query;

    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    if (!Array.isArray(uploaderIds) || uploaderIds.length === 0) {
      return sendError(res, 400, '请选择UP主');
    }

    const uploaders = await userPrisma.bilibiliUploader.findMany({
      where: {
        id: {
          in: uploaderIds as string[]
        }
      },
      select: {
        id: true,
        mid: true,
        name: true
      }
    });

    const uploaderMids = uploaders.map((u: any) => u.mid);

    const videos = await userPrisma.video.findMany({
      where: {
        platform: 'bilibili',
        uploaderId: {
          in: uploaderMids
        },
        publishedDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      select: {
        uploaderId: true,
        playCount: true,
        publishedDate: true
      }
    });

    const uploaderMap = new Map(uploaders.map((u: any) => [u.id, u.name]));
    const uploaderIdToMidMap = new Map(uploaders.map((u: any) => [u.mid, u.id]));

    const monthMap = new Map<string, Map<string, number>>();

    videos.forEach((video: any) => {
      const uploaderMid = video.uploaderId;
      if (!uploaderMid) return;
      
      const uploaderId = uploaderIdToMidMap.get(String(uploaderMid)) as string;
      if (!uploaderId) return;

      const month = `${new Date(video.publishedDate).getFullYear()}-${String(new Date(video.publishedDate).getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(month)) {
        monthMap.set(month, new Map());
      }

      const uploaderMonthMap = monthMap.get(month)!;
      const currentCount = (uploaderMonthMap.get(String(uploaderId)) as number) || 0;
      uploaderMonthMap.set(String(uploaderId), currentCount + (video.playCount || 0));
    });

    const data = Array.from(monthMap.entries()).flatMap(([month, playCountMap]) =>
      Array.from(playCountMap.entries()).map(([uploaderId, playCount]) => ({
        month,
        uploaderId,
        uploaderName: String(uploaderMap.get(uploaderId) || uploaderId),
        playCount
      }))
    );

    sendSuccess(res, { data });
  } catch (error: any) {
    logger.error('Get play heatmap error:', error);
    sendError(res, 500, '获取播放量热力图失败');
  }
}

export async function getRankings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { uploaderIds, startDate, endDate, type } = req.query;

    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    if (!Array.isArray(uploaderIds) || uploaderIds.length === 0) {
      return sendError(res, 400, '请选择UP主');
    }

    const uploaders = await userPrisma.bilibiliUploader.findMany({
      where: {
        id: {
          in: uploaderIds as string[]
        }
      },
      select: {
        id: true,
        mid: true,
        name: true,
        avatar: true
      }
    });

    const uploaderMids = uploaders.map((u: any) => u.mid);
    const uploaderIdToMidMap = new Map(uploaders.map((u: any) => [u.mid, u.id]));

    const videos = await userPrisma.video.findMany({
      where: {
        platform: 'bilibili',
        uploaderId: {
          in: uploaderMids
        },
        publishedDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      select: {
        uploaderId: true,
        playCount: true,
        likeCount: true,
        favoriteCount: true
      }
    });

    const uploaderStats = new Map<string, {
      videoCount: number;
      total_play_count: number;
      total_like_count: number;
      total_favorite_count: number;
    }>();

    videos.forEach((video: any) => {
      const uploaderMid = video.uploaderId;
      if (!uploaderMid) return;
      
      const uploaderId = uploaderIdToMidMap.get(String(uploaderMid)) as string;
      if (!uploaderId) return;

      const stats = (uploaderStats.get(uploaderId) as any) || {
        videoCount: 0,
        total_play_count: 0,
        total_like_count: 0,
        total_favorite_count: 0
      };

      stats.videoCount += 1;
      stats.total_play_count += video.playCount || 0;
      stats.total_like_count += video.likeCount || 0;
      stats.total_favorite_count += video.favoriteCount || 0;

      uploaderStats.set(uploaderId, stats);
    });

    const rankings = Array.from(uploaderStats.entries())
      .map(([uploaderId, stats]) => {
        const uploader = uploaders.find((u: any) => u.id === uploaderId);
        return {
          rank: 0,
          uploaderId,
          uploaderName: String(uploader?.name || uploaderId),
          avatar: uploader?.avatar,
          videoCount: stats.videoCount,
          total_play_count: stats.total_play_count,
          avg_play_count: stats.videoCount > 0 ? Math.round(stats.total_play_count / stats.videoCount) : 0,
          total_like_count: stats.total_like_count,
          total_favorite_count: stats.total_favorite_count,
          growth_rate: 0
        };
      })
      .sort((a, b) => {
        switch (type) {
          case 'publishCount':
            return b.videoCount - a.videoCount;
          case 'playCount':
            return b.total_play_count - a.total_play_count;
          case 'avg_play_count':
            return b.avg_play_count - a.avg_play_count;
          case 'growth_rate':
            return b.growth_rate - a.growth_rate;
          default:
            return b.total_play_count - a.total_play_count;
        }
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    sendSuccess(res, { rankings });
  } catch (error: any) {
    logger.error('Get rankings error:', error);
    sendError(res, 500, '获取排行榜失败');
  }
}

export async function getUploaderDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { uploaderId, startDate, endDate } = req.query;

    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    if (!uploaderId) {
      return sendError(res, 400, '请选择UP主');
    }

    const uploader = await userPrisma.bilibiliUploader.findUnique({
      where: { id: uploaderId as string },
      select: {
        id: true,
        mid: true,
        name: true,
        avatar: true,
        description: true,
        tags: true,
        videoCount: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!uploader) {
      return sendError(res, 404, 'UP主不存在');
    }

    const videos = await userPrisma.video.findMany({
      where: {
        platform: 'bilibili',
        uploaderId: uploader.mid,
        publishedDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      select: {
        id: true,
        title: true,
        playCount: true,
        likeCount: true,
        favoriteCount: true,
        publishedDate: true
      },
      orderBy: {
        publishedDate: 'desc'
      }
    });

    const totalVideos = videos.length;
    const total_play_count = videos.reduce((sum: number, v: any) => sum + (v.playCount || 0), 0);
    const avg_play_count = totalVideos > 0 ? Math.round(total_play_count / totalVideos) : 0;
    const total_like_count = videos.reduce((sum: number, v: any) => sum + (v.likeCount || 0), 0);
    const total_favorite_count = videos.reduce((sum: number, v: any) => sum + (v.favoriteCount || 0), 0);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const newVideosThisMonth = videos.filter((v: any) => 
      v.publishedDate && v.publishedDate >= thisMonthStart
    ).length;

    const dayMap = new Map<string, number>();
    videos.forEach((video: any) => {
      if (!video.publishedDate) return;
      const date = new Date(video.publishedDate).toISOString().split('T')[0];
      dayMap.set(date, (dayMap.get(date) || 0) + 1);
    });

    const publishTrend = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const frequency = totalVideos > 0 ? (totalVideos / Math.max(dayMap.size, 1)) : 0;

    const dayOfWeekMap = new Map<number, number>();
    const hourMap = new Map<number, number>();
    videos.forEach((video: any) => {
      if (!video.publishedDate) return;
      const date = new Date(video.publishedDate);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      dayOfWeekMap.set(dayOfWeek, (dayOfWeekMap.get(dayOfWeek) || 0) + 1);
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    const preferredDays = Array.from(dayOfWeekMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([day]) => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day]);

    const preferredHour = Array.from(hourMap.entries())
      .sort(([, a], [, b]) => b - a)
      [0]?.[0] || 18;

    const preferredTime = `${preferredHour}:00-${preferredHour + 2}:00`;

    const playTrend = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date]) => {
        const dayVideos = videos.filter((v: any) => 
          v.publishedDate && v.publishedDate.toISOString().split('T')[0] === date
        );
        return {
          date,
          playCount: dayVideos.reduce((sum: number, v: any) => sum + (v.playCount || 0), 0)
        };
      });

    const likeRate = total_play_count > 0 ? total_like_count / total_play_count : 0;
    const favoriteRate = total_play_count > 0 ? total_favorite_count / total_play_count : 0;
    const shareRate = 0;

    const distribution = [
      { range: '10K以下', count: 0, percentage: 0 },
      { range: '10K-50K', count: 0, percentage: 0 },
      { range: '50K+', count: 0, percentage: 0 }
    ];

    videos.forEach((video: any) => {
      const playCount = video.playCount || 0;
      if (playCount < 10000) {
        distribution[0].count++;
      } else if (playCount < 50000) {
        distribution[1].count++;
      } else {
        distribution[2].count++;
      }
    });

    distribution.forEach(d => {
      d.percentage = totalVideos > 0 ? (d.count / totalVideos) * 100 : 0;
    });

    const topVideos = videos.slice(0, 10).map((video: any) =>({
      id: video.id,
      title: video.title,
      publishedDate: video.publishedDate?.toISOString().split('T')[0] || '',
      playCount: video.playCount || 0,
      likeCount: video.likeCount || 0
    }));

    sendSuccess(res, {
      uploader: {
        id: uploader.id,
        mid: uploader.mid,
        name: uploader.name,
        avatar: uploader.avatar,
        description: uploader.description,
        tags: uploader.tags ? JSON.parse(uploader.tags) : [],
        subscribedAt: uploader.created_at.toISOString().split('T')[0],
        lastSyncAt: uploader.updated_at.toISOString().split('T')[0]
      },
      stats: {
        totalVideos,
        total_play_count,
        avg_play_count,
        total_like_count,
        total_favorite_count,
        avgDuration: 0,
        newVideosThisMonth
      },
      publishPattern: {
        frequency,
        preferredDays,
        preferredTime,
        trend: publishTrend
      },
      playPerformance: {
        trend: playTrend,
        likeRate,
        favoriteRate,
        shareRate,
        distribution
      },
      topVideos
    });
  } catch (error: any) {
    logger.error('Get uploader detail error:', error);
    sendError(res, 500, '获取UP主详情失败');
  }
}

export async function exportData(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { uploaderIds, startDate, endDate, format } = req.query;

    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    if (!Array.isArray(uploaderIds) || uploaderIds.length === 0) {
      return sendError(res, 400, '请选择UP主');
    }

    const uploaders = await userPrisma.bilibiliUploader.findMany({
      where: {
        id: {
          in: uploaderIds as string[]
        }
      },
      select: {
        id: true,
        mid: true,
        name: true
      }
    });

    const uploaderMids = uploaders.map((u: any) => u.mid);

    const videos = await userPrisma.video.findMany({
      where: {
        platform: 'bilibili',
        uploaderId: {
          in: uploaderMids
        },
        publishedDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      select: {
        id: true,
        title: true,
        uploader: true,
        uploaderId: true,
        publishedDate: true,
        playCount: true,
        likeCount: true,
        favoriteCount: true
      },
      orderBy: {
        publishedDate: 'desc'
      }
    });

    if (format === 'excel' || format === 'csv') {
      const headers = ['视频ID', '标题', 'UP主', '发布日期', '播放量', '点赞数', '收藏数'];
      const rows = videos.map((v: any) => [
        v.id,
        v.title,
        v.uploader,
        v.publishedDate?.toISOString().split('T')[0] || '',
        v.playCount || 0,
        v.likeCount || 0,
        v.favoriteCount || 0
      ]);

      const csvContent = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=bilibili-analytics-${Date.now()}.csv`);
      res.send('\uFEFF' + csvContent);
    } else {
      sendError(res, 400, '不支持的导出格式');
    }
  } catch (error: any) {
    logger.error('Export data error:', error);
    sendError(res, 500, '导出数据失败');
  }
}

export async function getPublicBilibiliUploaders(req: Request, res: Response, next: NextFunction) {
  try {
    const uploaders = await userPrisma.bilibiliUploader.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        mid: true,
        name: true,
        avatar: true,
        description: true,
        videoCount: true,
        tags: true
      },
      orderBy: {
        videoCount: 'desc'
      }
    });

    const uploadersWithTags = uploaders.map((uploader: any) =>({
      id: uploader.id,
      mid: uploader.mid,
      name: uploader.name,
      avatar: uploader.avatar,
      description: uploader.description,
      videoCount: uploader.videoCount,
      tags: uploader.tags ? JSON.parse(uploader.tags) : []
    }));

    sendSuccess(res, { uploaders: uploadersWithTags });
  } catch (error: any) {
    logger.error('Get public Bilibili uploaders error:', error);
    sendError(res, 500, '获取UP主列表失败');
  }
}

export async function getPublicOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const { uploaderIds, startDate, endDate } = req.query;

    if (!Array.isArray(uploaderIds) || uploaderIds.length === 0) {
      return sendError(res, 400, '请选择UP主');
    }

    const uploaders = await userPrisma.bilibiliUploader.findMany({
      where: {
        id: {
          in: uploaderIds as string[]
        }
      },
      select: {
        id: true,
        mid: true
      }
    });

    const uploaderMids = uploaders.map((u: any) => u.mid);

    const videos = await userPrisma.video.findMany({
      where: {
        platform: 'bilibili',
        uploaderId: {
          in: uploaderMids
        },
        publishedDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      select: {
        id: true,
        playCount: true,
        publishedDate: true
      }
    });

    const totalVideos = videos.length;
    const total_play_count = videos.reduce((sum: number, v: any) => sum + (v.playCount || 0), 0);
    const avg_play_count = totalVideos > 0 ? Math.round(total_play_count / totalVideos) : 0;

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const newVideosThisMonth = videos.filter((v: any) => 
      v.publishedDate && v.publishedDate >= thisMonthStart
    ).length;

    sendSuccess(res, {
      totalUploaders: uploaders.length,
      totalVideos,
      total_play_count,
      newVideosThisMonth,
      avg_play_count,
      lastUpdatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Get public overview error:', error);
    sendError(res, 500, '获取概览数据失败');
  }
}

export async function getPublicPublishTrend(req: Request, res: Response, next: NextFunction) {
  try {
    const { uploaderIds, startDate, endDate, groupBy } = req.query;

    if (!Array.isArray(uploaderIds) || uploaderIds.length === 0) {
      return sendError(res, 400, '请选择UP主');
    }

    const uploaders = await userPrisma.bilibiliUploader.findMany({
      where: {
        id: {
          in: uploaderIds as string[]
        }
      },
      select: {
        id: true,
        mid: true,
        name: true
      }
    });

    const uploaderMids = uploaders.map((u: any) => u.mid);

    const videos = await userPrisma.video.findMany({
      where: {
        platform: 'bilibili',
        uploaderId: {
          in: uploaderMids
        },
        publishedDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      select: {
        uploaderId: true,
        uploader: true,
        publishedDate: true
      },
      orderBy: {
        publishedDate: 'asc'
      }
    });

    const uploaderMap = new Map(uploaders.map((u: any) => [u.id, u.name]));

    const periodMap = new Map<string, Map<string, number>>();

    videos.forEach((video: any) => {
      const uploader = uploaders.find((u: any) => u.mid === video.uploaderId);
      if (!uploader) return;

      let period: string;
      const date = new Date(video.publishedDate!);
      
      if (groupBy === 'day') {
        period = date.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        period = weekStart.toISOString().split('T')[0];
      }

      if (!periodMap.has(period)) {
        periodMap.set(period, new Map());
      }
      
      const uploaderPeriodMap = periodMap.get(period)!;
      const currentCount = uploaderPeriodMap.get(uploader.id) || 0;
      uploaderPeriodMap.set(uploader.id, currentCount + 1);
    });

    const data = Array.from(periodMap.entries()).flatMap(([period, uploaderMap]) =>
      Array.from(uploaderMap.entries()).map(([uploaderId, videoCount]) => ({
        period,
        uploaderId,
        uploaderName: uploaderMap.get(uploaderId) || uploaderId,
        videoCount
      }))
    );

    sendSuccess(res, { data });
  } catch (error: any) {
    logger.error('Get public publish trend error:', error);
    sendError(res, 500, '获取发布趋势失败');
  }
}

export async function getPublicPlayHeatmap(req: Request, res: Response, next: NextFunction) {
  try {
    const { uploaderIds, startDate, endDate } = req.query;

    if (!Array.isArray(uploaderIds) || uploaderIds.length === 0) {
      return sendError(res, 400, '请选择UP主');
    }

    const uploaders = await userPrisma.bilibiliUploader.findMany({
      where: {
        id: {
          in: uploaderIds as string[]
        }
      },
      select: {
        id: true,
        mid: true,
        name: true
      }
    });

    const uploaderMids = uploaders.map((u: any) =>u.mid);

    const videos = await userPrisma.video.findMany({
      where: {
        platform: 'bilibili',
        uploaderId: {
          in: uploaderMids
        },
        publishedDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      select: {
        uploaderId: true,
        playCount: true,
        publishedDate: true
      }
    });

    const uploaderMap = new Map(uploaders.map((u: any) =>[u.id, u.name]));
    const uploaderIdToMidMap = new Map(uploaders.map((u: any) =>[u.mid, u.id]));

    const monthMap = new Map<string, Map<string, number>>();

    videos.forEach((video: any) =>{
      const uploaderId = uploaderIdToMidMap.get(video.uploaderId!);
      if (!uploaderId) return;

      const date = new Date(video.publishedDate!);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(month)) {
        monthMap.set(month, new Map());
      }

      const uploaderMonthMap = monthMap.get(month)!;
      const currentCount = uploaderMonthMap.get(String(uploaderId)) || 0;
      uploaderMonthMap.set(uploaderId as string, currentCount + (video.playCount || 0));
    });

    const data = (Array.from(monthMap.entries()) as any).flatMap(([month, uploaderMap]: [string, any]) =>
      (Array.from(uploaderMap.entries()) as any).map(([uploaderId, playCount]: [string, number]) => ({
        month,
        uploaderId,
        uploaderName: String(uploaderMap.get(uploaderId) || uploaderId),
        playCount
      }))
    );

    sendSuccess(res, { data });
  } catch (error: any) {
    logger.error('Get public play heatmap error:', error);
    sendError(res, 500, '获取播放量热力图失败');
  }
}

export async function getPublicRankings(req: Request, res: Response, next: NextFunction) {
  try {
    const { uploaderIds, startDate, endDate, type } = req.query;

    if (!Array.isArray(uploaderIds) || uploaderIds.length === 0) {
      return sendError(res, 400, '请选择UP主');
    }

    const uploaders = await userPrisma.bilibiliUploader.findMany({
      where: {
        id: {
          in: uploaderIds as string[]
        }
      },
      select: {
        id: true,
        mid: true,
        name: true,
        avatar: true
      }
    });

    const uploaderMids = uploaders.map((u: any) =>u.mid);
    const uploaderIdToMidMap = new Map(uploaders.map((u: any) =>[u.mid, u.id]));

    const videos = await userPrisma.video.findMany({
      where: {
        platform: 'bilibili',
        uploaderId: {
          in: uploaderMids
        },
        publishedDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      select: {
        uploaderId: true,
        playCount: true,
        likeCount: true,
        favoriteCount: true
      }
    });

    const uploaderStats = new Map<string, {
      videoCount: number;
      total_play_count: number;
      total_like_count: number;
      total_favorite_count: number;
    }>();

    videos.forEach((video: any) =>{
      const uploaderMid = video.uploaderId;
      if (!uploaderMid) return;
      
      const uploaderId = uploaderIdToMidMap.get(String(uploaderMid)) as string;
      if (!uploaderId) return;

      const stats = (uploaderStats.get(uploaderId) as any) || {
        videoCount: 0,
        total_play_count: 0,
        total_like_count: 0,
        total_favorite_count: 0
      };

      stats.videoCount += 1;
      stats.total_play_count += video.playCount || 0;
      stats.total_like_count += video.likeCount || 0;
      stats.total_favorite_count += video.favoriteCount || 0;

      uploaderStats.set(uploaderId, stats);
    });

    const rankings = Array.from(uploaderStats.entries())
      .map(([uploaderId, stats]) => {
        const uploader = uploaders.find((u: any) =>u.id === uploaderId);
        return {
          rank: 0,
          uploaderId,
          uploaderName: uploader?.name || uploaderId,
          avatar: uploader?.avatar,
          videoCount: stats.videoCount,
          total_play_count: stats.total_play_count,
          avg_play_count: stats.videoCount > 0 ? Math.round(stats.total_play_count / stats.videoCount) : 0,
          total_like_count: stats.total_like_count,
          total_favorite_count: stats.total_favorite_count,
          growth_rate: 0
        };
      })
      .sort((a, b) => {
        switch (type) {
          case 'publishCount':
            return b.videoCount - a.videoCount;
          case 'playCount':
            return b.total_play_count - a.total_play_count;
          case 'avg_play_count':
            return b.avg_play_count - a.avg_play_count;
          case 'growth_rate':
            return b.growth_rate - a.growth_rate;
          default:
            return b.total_play_count - a.total_play_count;
        }
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    sendSuccess(res, { rankings });
  } catch (error: any) {
    logger.error('Get public rankings error:', error);
    sendError(res, 500, '获取排行榜失败');
  }
}

export async function getPublicUploaderDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { uploaderId, startDate, endDate } = req.query;

    if (!uploaderId) {
      return sendError(res, 400, '请选择UP主');
    }

    const uploader = await userPrisma.bilibiliUploader.findUnique({
      where: { id: uploaderId as string },
      select: {
        id: true,
        mid: true,
        name: true,
        avatar: true,
        description: true,
        tags: true,
        videoCount: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!uploader) {
      return sendError(res, 404, 'UP主不存在');
    }

    const videos = await userPrisma.video.findMany({
      where: {
        platform: 'bilibili',
        uploaderId: uploader.mid,
        publishedDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      select: {
        id: true,
        title: true,
        playCount: true,
        likeCount: true,
        favoriteCount: true,
        publishedDate: true
      },
      orderBy: {
        publishedDate: 'desc'
      }
    });

    const totalVideos = videos.length;
    const total_play_count = videos.reduce((sum: number, v: any) =>sum + (v.playCount || 0), 0);
    const avg_play_count = totalVideos > 0 ? Math.round(total_play_count / totalVideos) : 0;
    const total_like_count = videos.reduce((sum: number, v: any) =>sum + (v.likeCount || 0), 0);
    const total_favorite_count = videos.reduce((sum: number, v: any) =>sum + (v.favoriteCount || 0), 0);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const newVideosThisMonth = videos.filter((v: any) =>
      v.publishedDate && v.publishedDate >= thisMonthStart
    ).length;

    const dayMap = new Map<string, number>();
    videos.forEach((video: any) =>{
      if (!video.publishedDate) return;
      const date = new Date(video.publishedDate).toISOString().split('T')[0];
      dayMap.set(date, (dayMap.get(date) || 0) + 1);
    });

    const publishTrend = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const frequency = totalVideos > 0 ? (totalVideos / Math.max(dayMap.size, 1)) : 0;

    const dayOfWeekMap = new Map<number, number>();
    const hourMap = new Map<number, number>();
    videos.forEach((video: any) =>{
      if (!video.publishedDate) return;
      const date = new Date(video.publishedDate);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      dayOfWeekMap.set(dayOfWeek, (dayOfWeekMap.get(dayOfWeek) || 0) + 1);
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    const preferredDays = Array.from(dayOfWeekMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([day]) => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day]);

    const preferredHour = Array.from(hourMap.entries())
      .sort(([, a], [, b]) => b - a)
      [0]?.[0] || 18;

    const preferredTime = `${preferredHour}:00-${preferredHour + 2}:00`;

    const playTrend = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date]) => {
        const dayVideos = videos.filter((v: any) =>
          v.publishedDate && v.publishedDate.toISOString().split('T')[0] === date
        );
        return {
          date,
          playCount: dayVideos.reduce((sum: number, v: any) =>sum + (v.playCount || 0), 0)
        };
      });

    const likeRate = total_play_count > 0 ? total_like_count / total_play_count : 0;
    const favoriteRate = total_play_count > 0 ? total_favorite_count / total_play_count : 0;
    const shareRate = 0;

    const distribution = [
      { range: '10K以下', count: 0, percentage: 0 },
      { range: '10K-50K', count: 0, percentage: 0 },
      { range: '50K+', count: 0, percentage: 0 }
    ];

    videos.forEach((video: any) =>{
      const playCount = video.playCount || 0;
      if (playCount < 10000) {
        distribution[0].count++;
      } else if (playCount < 50000) {
        distribution[1].count++;
      } else {
        distribution[2].count++;
      }
    });

    distribution.forEach(d => {
      d.percentage = totalVideos > 0 ? (d.count / totalVideos) * 100 : 0;
    });

    const topVideos = videos.slice(0, 10).map((video: any) =>({
      id: video.id,
      title: video.title,
      publishedDate: video.publishedDate?.toISOString().split('T')[0] || '',
      playCount: video.playCount || 0,
      likeCount: video.likeCount || 0
    }));

    sendSuccess(res, {
      uploader: {
        id: uploader.id,
        mid: uploader.mid,
        name: uploader.name,
        avatar: uploader.avatar,
        description: uploader.description,
        tags: uploader.tags ? JSON.parse(uploader.tags) : [],
        subscribedAt: uploader.created_at.toISOString().split('T')[0],
        lastSyncAt: uploader.updated_at.toISOString().split('T')[0]
      },
      stats: {
        totalVideos,
        total_play_count,
        avg_play_count,
        total_like_count,
        total_favorite_count,
        avgDuration: 0,
        newVideosThisMonth
      },
      publishPattern: {
        frequency,
        preferredDays,
        preferredTime,
        trend: publishTrend
      },
      playPerformance: {
        trend: playTrend,
        likeRate,
        favoriteRate,
        shareRate,
        distribution
      },
      topVideos
    });
  } catch (error: any) {
    logger.error('Get public uploader detail error:', error);
    sendError(res, 500, '获取UP主详情失败');
  }
}
