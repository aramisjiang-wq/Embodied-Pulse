/**
 * Bilibili API 数据同步服务
 * 使用 bilibili-api-wrapper 封装
 * 参考: https://github.com/nemo2011/bilibili-api
 */

import axios from 'axios';
import { BilibiliAPI, BilibiliAPIError } from '../bilibili';
import { createVideo } from '../video.service';
import { logger } from '../../utils/logger';
import { getBilibiliKeywords } from '../../config/video-keywords';
import { getActiveKeywordsString } from '../bilibili-search-keyword.service';
import { cleanVideoTitle, cleanDescription } from '../../utils/html-cleaner';

const BILIBILI_API_BASE = 'https://api.bilibili.com';

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
}

/**
 * 同步Bilibili视频数据
 * @param keyword 搜索关键词（如果不提供，使用扩展关键词库）
 * @param maxResults 最大结果数
 */
export async function syncBilibiliVideos(keyword?: string, maxResults: number = 100) {
  // 如果没有提供关键词，优先从数据库读取，否则使用配置文件
  let searchKeyword: string;
  if (keyword) {
    searchKeyword = keyword;
  } else {
    try {
      // 尝试从数据库读取启用的关键词
      searchKeyword = await getActiveKeywordsString();
      logger.info('使用数据库中的关键词进行搜索');
    } catch (error) {
      // 如果数据库读取失败，使用配置文件中的关键词
      logger.warn('从数据库读取关键词失败，使用配置文件中的关键词', error);
      searchKeyword = getBilibiliKeywords(true);
    }
  }
  try {
    logger.info(`开始同步Bilibili视频，关键词: ${searchKeyword}, 最大数量: ${maxResults}`);
    
    const videos = await bilibiliAPI.video.searchAllVideos(searchKeyword, maxResults);
    logger.info(`总共获取到 ${videos.length} 个视频`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const video of videos) {
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
          platform: 'bilibili',
          videoId: video.bvid,
          bvid: video.bvid,
          title: cleanVideoTitle(video.title),
          description: cleanDescription(video.desc || ''),
          coverUrl: video.pic,
          duration: durationSeconds,
          uploader: video.author,
          uploaderId: String(video.mid),
          publishedDate: new Date(video.pubdate * 1000),
          playCount: viewCount,
          viewCount: viewCount,
          likeCount: video.like || video.stat?.like || 0,
          tags: video.typename ? JSON.stringify([video.typename]) : undefined,
        });

        syncedCount++;
      } catch (error: any) {
        errorCount++;
        logger.error(`处理视频失败 (${video.bvid}): ${error.message}`);
      }
    }

    logger.info(`Bilibili同步完成: 成功 ${syncedCount} 个, 失败 ${errorCount} 个`);
    
    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: videos.length,
    };
  } catch (error: any) {
    if (error instanceof BilibiliAPIError) {
      logger.error(`Bilibili同步失败 (API错误): ${error.message}, code: ${error.code}`);
    } else {
      logger.error(`Bilibili同步失败: ${error.message}`);
    }
    throw error;
  }
}

function parseDuration(durationStr: string | number): number | null {
  if (!durationStr) return null;
  
  if (typeof durationStr === 'number') {
    return durationStr;
  }
  
  const parts = String(durationStr).split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    return mins * 60 + secs;
  } else if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseInt(parts[2], 10);
    return hours * 3600 + mins * 60 + secs;
  }
  
  return null;
}

/**
 * 同步热门视频（综合排行榜）
 */
export async function syncBilibiliHotVideos(maxResults: number = 50) {
  try {
    logger.info(`开始同步Bilibili热门视频，数量: ${maxResults}`);
    
    const videos = await bilibiliAPI.video.getHotVideos(0);
    const limitedVideos = videos.slice(0, maxResults);

    logger.info(`获取到 ${limitedVideos.length} 个热门视频`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const video of limitedVideos) {
      try {
        await createVideo({
          platform: 'bilibili',
          videoId: video.bvid,
          title: cleanVideoTitle(video.title),
          description: '',
          coverUrl: video.pic,
          duration: video.duration,
          uploader: video.author,
          uploaderId: String(video.mid),
          publishedDate: new Date(video.pubdate * 1000),
          playCount: video.view || 0,
          viewCount: video.view || 0,
        });

        syncedCount++;
      } catch (error: any) {
        errorCount++;
        logger.error(`处理热门视频失败 (${video.bvid}): ${error.message}`);
      }
    }

    logger.info(`Bilibili热门视频同步完成: 成功 ${syncedCount} 个, 失败 ${errorCount} 个`);
    
    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: limitedVideos.length,
    };
  } catch (error: any) {
    if (error instanceof BilibiliAPIError) {
      logger.error(`Bilibili热门视频同步失败 (API错误): ${error.message}, code: ${error.code}`);
    } else {
      logger.error(`Bilibili热门视频同步失败: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 同步科技区视频
 */
export async function syncBilibiliTechVideos(maxResults: number = 50) {
  try {
    logger.info(`开始同步Bilibili科技区视频，数量: ${maxResults}`);
    
    const response = await axios.get(`${BILIBILI_API_BASE}/x/web-interface/ranking/region`, {
      params: {
        rid: 188, // 188=科技区
        day: 3, // 3日榜
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 10000,
    });

    if (response.data?.code !== 0) {
      throw new Error(`Bilibili API错误: ${response.data?.message}`);
    }

    const videos: BilibiliVideo[] = response.data.data || [];
    const limitedVideos = videos.slice(0, maxResults);

    logger.info(`获取到 ${limitedVideos.length} 个科技区视频`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const video of limitedVideos) {
      try {
        await createVideo({
          platform: 'bilibili',
          platformId: video.bvid,
          title: cleanVideoTitle(video.title),
          description: cleanDescription(video.desc || ''),
          thumbnailUrl: video.pic,
          videoUrl: `https://www.bilibili.com/video/${video.bvid}`,
          duration: video.duration,
          uploader: video.author,
          uploaderId: String(video.mid),
          viewCount: video.view || 0,
          likeCount: video.like || 0,
          commentCount: video.reply || 0,
          publishedDate: new Date(video.pubdate * 1000),
          tags: ['科技'],
          category: 'technology',
        });

        syncedCount++;
      } catch (error: any) {
        errorCount++;
        logger.error(`处理科技区视频失败 (${video.bvid}): ${error.message}`);
      }
    }

    logger.info(`Bilibili科技区视频同步完成: 成功 ${syncedCount} 个, 失败 ${errorCount} 个`);
    
    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: limitedVideos.length,
    };
  } catch (error: any) {
    logger.error(`Bilibili科技区视频同步失败: ${error.message}`);
    throw error;
  }
}

/**
 * 辅助函数：延迟
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
