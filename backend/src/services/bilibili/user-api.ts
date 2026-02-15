import { BilibiliRequestClient } from './request-client';
import {
  BilibiliUserInfo,
  BilibiliUserStat,
  BilibiliSpaceVideos,
  BilibiliUploaderVideo,
} from './types';
import { logger } from '../../utils/logger';

export class UserAPI {
  private client: BilibiliRequestClient;

  constructor(client: BilibiliRequestClient) {
    this.client = client;
  }

  async getUserInfo(mid: number): Promise<BilibiliUserInfo> {
    try {
      logger.info(`获取UP主信息: ${mid}`);
      
      let data;
      try {
        data = await this.client.get<BilibiliUserInfo>('/x/space/acc/info', {
          mid,
        });
      } catch (error: any) {
        if (error.statusCode === 412 || error.code === -412) {
          logger.warn(`旧API端点失败，尝试WBI端点: ${mid}`);
          data = await this.client.get<BilibiliUserInfo>('/x/space/wbi/info', {
            mid,
          });
        } else {
          throw error;
        }
      }

      return data;
    } catch (error: any) {
      logger.error(`获取UP主信息失败 (${mid}):`, error.message);
      throw error;
    }
  }

  async getUserStat(mid: number): Promise<BilibiliUserStat> {
    try {
      logger.info(`获取UP主统计: ${mid}`);
      const data = await this.client.get<BilibiliUserStat>('/x/space/upstat', {
        mid,
      });
      return data;
    } catch (error: any) {
      logger.error(`获取UP主统计失败 (${mid}):`, error.message);
      throw error;
    }
  }

  async getUserVideos(
    mid: number,
    page: number = 1,
    pageSize: number = 30
  ): Promise<BilibiliSpaceVideos> {
    try {
      logger.info(`获取UP主视频列表: ${mid}, 页码: ${page}`);
      const data = await this.client.get<BilibiliSpaceVideos>(
        '/x/space/arc/search',
        {
          mid,
          ps: pageSize,
          pn: page,
          order: 'pubdate',
        }
      );
      return data;
    } catch (error: any) {
      logger.error(`获取UP主视频列表失败 (${mid}):`, error.message);
      throw error;
    }
  }

  async getAllUserVideos(
    mid: number,
    maxResults: number = 100
  ): Promise<BilibiliUploaderVideo[]> {
    try {
      logger.info(`获取UP主所有视频: ${mid}, maxResults=${maxResults}`);
      
      const allVideos: BilibiliUploaderVideo[] = [];
      const pageSize = 30;
      const pages = Math.ceil(maxResults / pageSize);

      for (let page = 1; page <= pages; page++) {
        try {
          const result = await this.getUserVideos(mid, page, pageSize);
          
          if (result.list?.vlist && result.list.vlist.length > 0) {
            allVideos.push(...result.list.vlist);
            logger.info(`UP主 ${mid} 第 ${page} 页: 获取 ${result.list.vlist.length} 个视频`);
          } else {
            logger.info(`UP主 ${mid} 第 ${page} 页: 无数据，停止获取`);
            break;
          }

          if (allVideos.length >= maxResults) {
            break;
          }

          await this.delay(1000);
        } catch (error: any) {
          if (error.name === 'BilibiliRateLimitError') {
            logger.warn(`UP主 ${mid} 第 ${page} 页遇到限流，跳过`);
            await this.delay(2000);
            continue;
          }
          logger.error(`UP主 ${mid} 第 ${page} 页获取失败:`, error.message);
          break;
        }
      }

      return allVideos.slice(0, maxResults);
    } catch (error: any) {
      logger.error(`获取UP主所有视频失败 (${mid}):`, error.message);
      throw error;
    }
  }

  async getUserFullInfo(mid: number): Promise<{
    info: BilibiliUserInfo;
    stat: BilibiliUserStat;
  }> {
    try {
      logger.info(`获取UP主完整信息: ${mid}`);
      
      const [info, stat] = await Promise.all([
        this.getUserInfo(mid),
        this.getUserStat(mid),
      ]);

      return { info, stat };
    } catch (error: any) {
      logger.error(`获取UP主完整信息失败 (${mid}):`, error.message);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
