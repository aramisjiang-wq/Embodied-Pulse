import { BilibiliRequestClient } from './request-client';
import {
  BilibiliVideo,
  BilibiliSearchResult,
  BilibiliRankingResponse,
  BilibiliRankingVideo,
} from './types';
import { logger } from '../../utils/logger';

export class VideoAPI {
  private client: BilibiliRequestClient;

  constructor(client: BilibiliRequestClient) {
    this.client = client;
  }

  async getVideoInfo(bvid: string): Promise<BilibiliVideo> {
    try {
      logger.info(`获取视频详情: ${bvid}`);
      const data = await this.client.get<BilibiliVideo>('/x/web-interface/view', {
        bvid,
      });
      
      const normalizedData: BilibiliVideo = {
        ...data,
        author: data.author || data.owner?.name,
        mid: data.mid || data.owner?.mid,
        view: data.view || data.stat?.view,
        danmaku: data.danmaku || data.stat?.danmaku,
        reply: data.reply || data.stat?.reply,
        favorite: data.favorite || data.stat?.favorite,
        coin: data.coin || data.stat?.coin,
        share: data.share || data.stat?.share,
        like: data.like || data.stat?.like,
      };
      
      return normalizedData;
    } catch (error: any) {
      logger.error(`获取视频详情失败 (${bvid}):`, error.message);
      throw error;
    }
  }

  async searchVideos(
    keyword: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<BilibiliSearchResult> {
    try {
      logger.info(`搜索视频: ${keyword}, 页码: ${page}, 每页: ${pageSize}`);
      const data = await this.client.get<BilibiliSearchResult>(
        '/x/web-interface/search/type',
        {
          search_type: 'video',
          keyword,
          page,
          pagesize: pageSize,
          order: 'totalrank',
          duration: 0,
          tids_1: 0,
        }
      );
      return data;
    } catch (error: any) {
      logger.error(`搜索视频失败 (${keyword}):`, error.message);
      throw error;
    }
  }

  async getRanking(
    rid: number = 0,
    type: string = 'all'
  ): Promise<BilibiliRankingResponse> {
    try {
      logger.info(`获取排行榜: rid=${rid}, type=${type}`);
      const data = await this.client.get<BilibiliRankingResponse>(
        '/x/web-interface/ranking/v2',
        {
          rid,
          type,
        }
      );
      return data;
    } catch (error: any) {
      logger.error(`获取排行榜失败:`, error.message);
      throw error;
    }
  }

  async getRegionRanking(rid: number = 188, day: number = 3): Promise<BilibiliRankingVideo[]> {
    try {
      logger.info(`获取分区排行榜: rid=${rid}, day=${day}`);
      const data = await this.client.get<BilibiliRankingVideo[]>(
        '/x/web-interface/ranking/region',
        {
          rid,
          day,
        }
      );
      return data;
    } catch (error: any) {
      logger.error(`获取分区排行榜失败:`, error.message);
      throw error;
    }
  }

  async getHotVideos(rid: number = 0): Promise<BilibiliRankingVideo[]> {
    try {
      logger.info(`获取热门视频: rid=${rid}`);
      const ranking = await this.getRanking(rid, 'all');
      return ranking.list || [];
    } catch (error: any) {
      logger.error(`获取热门视频失败:`, error.message);
      throw error;
    }
  }

  async getTechVideos(maxResults: number = 50): Promise<BilibiliRankingVideo[]> {
    try {
      logger.info(`获取科技区视频: maxResults=${maxResults}`);
      const videos = await this.getRegionRanking(188, 3);
      return videos.slice(0, maxResults);
    } catch (error: any) {
      logger.error(`获取科技区视频失败:`, error.message);
      throw error;
    }
  }

  async searchAllVideos(
    keyword: string,
    maxResults: number = 100
  ): Promise<BilibiliVideo[]> {
    try {
      logger.info(`搜索所有视频: ${keyword}, maxResults=${maxResults}`);
      
      const allVideos: BilibiliVideo[] = [];
      const pageSize = 50;
      const pages = Math.ceil(maxResults / pageSize);

      for (let page = 1; page <= pages; page++) {
        try {
          const result = await this.searchVideos(keyword, page, pageSize);
          
          if (result.result && result.result.length > 0) {
            allVideos.push(...result.result);
            logger.info(`第 ${page} 页: 获取 ${result.result.length} 个视频`);
          } else {
            logger.info(`第 ${page} 页: 无数据，停止搜索`);
            break;
          }

          if (allVideos.length >= maxResults) {
            break;
          }

          await this.delay(1500);
        } catch (error: any) {
          if (error.name === 'BilibiliRateLimitError') {
            logger.warn(`第 ${page} 页遇到限流，跳过`);
            await this.delay(3000);
            continue;
          }
          logger.error(`第 ${page} 页搜索失败:`, error.message);
          break;
        }
      }

      return allVideos.slice(0, maxResults);
    } catch (error: any) {
      logger.error(`搜索所有视频失败 (${keyword}):`, error.message);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
