/**
 * YouTube API 数据同步服务
 * 文档: https://developers.google.com/youtube/v3/docs
 */

import axios from 'axios';
import { createVideo } from '../video.service';
import { logger } from '../../utils/logger';
import { getYouTubeKeywords } from '../../config/video-keywords';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high: { url: string };
    };
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    tags?: string[];
    categoryId: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  contentDetails?: {
    duration: string; // ISO 8601格式，如 PT15M33S
  };
}

/**
 * 同步YouTube视频数据
 * @param query 搜索关键词（如果不提供，使用扩展关键词库）
 * @param maxResults 最大结果数
 */
export async function syncYouTubeVideos(query?: string, maxResults: number = 50) {
  // 如果没有提供关键词，使用扩展关键词库
  const searchQuery = query || getYouTubeKeywords(true);
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY未配置，请在.env文件中添加');
    }

    logger.info(`开始同步YouTube视频，关键词: ${searchQuery}, 最大数量: ${maxResults}`);
    
    // 搜索视频
    const searchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        maxResults: Math.min(maxResults, 50),
        order: 'relevance',
        videoDefinition: 'high',
        key: YOUTUBE_API_KEY,
      },
      timeout: 10000,
    });

    const videos: YouTubeVideo[] = searchResponse.data.items || [];
    logger.info(`搜索到 ${videos.length} 个视频`);

    // 获取视频详细信息（包含统计数据和时长）
    const videoIds = videos.map(v => v.id.videoId).join(',');
    const detailsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: videoIds,
        key: YOUTUBE_API_KEY,
      },
      timeout: 10000,
    });

    const detailedVideos: YouTubeVideo[] = detailsResponse.data.items || [];
    logger.info(`获取到 ${detailedVideos.length} 个视频详情`);

    let syncedCount = 0;
    let errorCount = 0;

    // 处理每个视频
    for (const video of detailedVideos) {
      try {
        const videoId = typeof video.id === 'string' ? video.id : (video.id as any).videoId;
        const duration = parseDuration(video.contentDetails?.duration || 'PT0S');

        await createVideo({
          platform: 'youtube',
          platformId: videoId,
          title: video.snippet.title,
          description: video.snippet.description || '',
          thumbnailUrl: video.snippet.thumbnails.high.url,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          duration: duration,
          uploader: video.snippet.channelTitle,
          uploaderId: video.snippet.channelId,
          viewCount: parseInt(video.statistics?.viewCount || '0'),
          likeCount: parseInt(video.statistics?.likeCount || '0'),
          commentCount: parseInt(video.statistics?.commentCount || '0'),
          publishedDate: new Date(video.snippet.publishedAt),
          tags: video.snippet.tags || [],
          category: 'technology',
        });

        syncedCount++;
      } catch (error: any) {
        errorCount++;
        const videoId = typeof video.id === 'string' ? video.id : (video.id as any).videoId;
        logger.error(`处理视频失败 (${videoId}): ${error.message}`);
      }
    }

    logger.info(`YouTube同步完成: 成功 ${syncedCount} 个, 失败 ${errorCount} 个`);
    
    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: detailedVideos.length,
    };
  } catch (error: any) {
    logger.error(`YouTube同步失败: ${error.message}`);
    throw error;
  }
}

/**
 * 同步YouTube热门视频
 */
export async function syncYouTubePopularVideos(maxResults: number = 50) {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY未配置');
    }

    logger.info(`开始同步YouTube热门视频，数量: ${maxResults}`);
    
    const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular',
        regionCode: 'US',
        videoCategoryId: '28', // 28=科技
        maxResults: Math.min(maxResults, 50),
        key: YOUTUBE_API_KEY,
      },
      timeout: 10000,
    });

    const videos: YouTubeVideo[] = response.data.items || [];
    logger.info(`获取到 ${videos.length} 个热门视频`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const video of videos) {
      try {
        const videoId = typeof video.id === 'string' ? video.id : (video.id as any).videoId;
        const duration = parseDuration(video.contentDetails?.duration || 'PT0S');

        await createVideo({
          platform: 'youtube',
          platformId: videoId,
          title: video.snippet.title,
          description: video.snippet.description || '',
          thumbnailUrl: video.snippet.thumbnails.high.url,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          duration: duration,
          uploader: video.snippet.channelTitle,
          uploaderId: video.snippet.channelId,
          viewCount: parseInt(video.statistics?.viewCount || '0'),
          likeCount: parseInt(video.statistics?.likeCount || '0'),
          commentCount: parseInt(video.statistics?.commentCount || '0'),
          publishedDate: new Date(video.snippet.publishedAt),
          tags: video.snippet.tags || [],
          category: 'popular',
        });

        syncedCount++;
      } catch (error: any) {
        errorCount++;
        logger.error(`处理热门视频失败: ${error.message}`);
      }
    }

    logger.info(`YouTube热门视频同步完成: 成功 ${syncedCount} 个, 失败 ${errorCount} 个`);
    
    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: videos.length,
    };
  } catch (error: any) {
    logger.error(`YouTube热门视频同步失败: ${error.message}`);
    throw error;
  }
}

/**
 * 解析ISO 8601时长格式
 * PT15M33S -> 933秒
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}
