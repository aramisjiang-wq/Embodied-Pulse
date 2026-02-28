/**
 * Bilibili搜索关键词同步服务
 * 根据数据库中的关键词同步Bilibili视频
 */

import { BilibiliAPI, BilibiliAPIError } from '../bilibili';
import { createVideo } from '../video.service';
import { logger } from '../../utils/logger';
import { getActiveKeywordsArray } from '../bilibili-search-keyword.service';
import { cleanVideoTitle, cleanDescription } from '../../utils/html-cleaner';
import adminPrisma, { ensureAdminDatabaseConnected } from '../../config/database.admin';

const bilibiliAPI = BilibiliAPI.fromEnv({
  timeout: 15000,
  retries: 3,
  retryDelay: 2000,
});

interface BilibiliVideo {
  aid: number;
  bvid: string;
  title: string;
  desc: string;
  pic: string;
  author: string;
  mid: number;
  duration: number;
  pubdate: number;
  view: number;
  danmaku: number;
  reply: number;
  favorite: number;
  coin: number;
  share: number;
  like: number;
  typename?: string;
  tname?: string;
  stat?: {
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    like: number;
  };
}

/**
 * 解析视频时长（秒）
 */
function parseDuration(duration: number): number {
  return duration || 0;
}

/**
 * 根据Bilibili搜索关键词同步视频
 * @param days 同步最近几天的视频
 * @param maxResultsPerKeyword 每个关键词最多同步多少个视频
 */
export async function syncVideosByKeywords(days: number = 7, maxResultsPerKeyword: number = 20) {
  try {
    logger.info(`开始根据关键词同步Bilibili视频，天数: ${days}, 每个关键词最大结果: ${maxResultsPerKeyword}`);
    
    // 获取关键词
    const keywords = await getActiveKeywordsArray();
    
    if (keywords.length === 0) {
      logger.warn('没有找到启用的关键词');
      return {
        success: true,
        synced: 0,
        errors: 0,
        keywords: 0,
      };
    }
    
    logger.info(`找到 ${keywords.length} 个关键词: ${keywords.join(', ')}`);
    
    // 计算日期范围（Bilibili API使用时间戳）
    const now = Math.floor(Date.now() / 1000);
    const startTime = now - (days * 24 * 60 * 60);
    
    let totalSynced = 0;
    let totalErrors = 0;
    
    // 逐个关键词同步
    for (const keyword of keywords) {
      try {
        logger.info(`同步关键词: ${keyword}`);
        
        // 搜索视频
        const videos = await bilibiliAPI.video.searchAllVideos(keyword, maxResultsPerKeyword);
        logger.info(`关键词 ${keyword} 获取到 ${videos.length} 个视频`);
        
        // 过滤最近几天的视频
        const recentVideos = (videos as BilibiliVideo[]).filter((video) => {
          return video.pubdate >= startTime;
        });
        
        logger.info(`关键词 ${keyword} 最近 ${days} 天内有 ${recentVideos.length} 个视频`);
        
        // 保存视频
        for (const video of recentVideos) {
          try {
            const durationSeconds = parseDuration(video.duration);
            let viewCount = video.view || video.stat?.view || 0;
            
            if (!viewCount && video.bvid) {
              try {
                const videoDetail = await bilibiliAPI.video.getVideoInfo(video.bvid);
                viewCount = videoDetail.view || videoDetail.stat?.view || 0;
              } catch (error) {
                logger.warn(`获取视频详情失败 (${video.bvid})，使用默认播放量0`);
              }
            }
            
            await createVideo({
              videoId: video.bvid,
              platform: 'bilibili',
              title: cleanVideoTitle(video.title),
              description: cleanDescription(video.desc),
              author: video.author,
              coverUrl: video.pic,
              videoUrl: `https://www.bilibili.com/video/${video.bvid}`,
              duration: durationSeconds,
              viewCount: viewCount,
              likeCount: video.like || video.stat?.like || 0,
              commentCount: video.reply || video.stat?.reply || 0,
              publishedAt: new Date(video.pubdate * 1000),
              tags: video.typename || video.tname ? JSON.stringify([video.typename || video.tname]) : null,
            } as any);
            
            totalSynced++;
          } catch (error: any) {
            if (error.message !== 'VIDEO_ALREADY_EXISTS') {
              logger.error(`保存视频失败 (${video.bvid}):`, error.message);
              totalErrors++;
            }
          }
        }
        
        logger.info(`关键词 ${keyword} 同步完成: 成功 ${recentVideos.length} 个视频`);
        
        try {
          await ensureAdminDatabaseConnected();
          const adminDb = adminPrisma as any;
          if (adminDb?.bilibili_search_keywords) {
            await adminDb.bilibili_search_keywords.updateMany({
              where: { keyword },
              data: { last_synced_at: new Date() },
            });
            logger.info(`已更新关键词 ${keyword} 的最后同步时间`);
          }
        } catch (updateError) {
          logger.warn(`更新关键词 ${keyword} 的最后同步时间失败:`, updateError);
        }
      } catch (error: any) {
        logger.error(`同步关键词 ${keyword} 失败:`, error.message);
        totalErrors++;
      }
    }
    
    logger.info(`Bilibili视频同步完成: 总共 ${keywords.length} 个关键词, 成功 ${totalSynced} 个视频, 失败 ${totalErrors} 个`);
    
    return {
      success: true,
      synced: totalSynced,
      errors: totalErrors,
      keywords: keywords.length,
    };
  } catch (error: any) {
    logger.error(`根据关键词同步Bilibili视频失败: ${error.message}`);
    throw error;
  }
}

/**
 * 同步最近一周的视频
 */
export async function syncRecentVideos(days: number = 7, maxResultsPerKeyword: number = 20) {
  return await syncVideosByKeywords(days, maxResultsPerKeyword);
}
