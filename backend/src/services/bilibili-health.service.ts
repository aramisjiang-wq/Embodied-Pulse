/**
 * Bilibili Cookie健康检查服务
 * 用于检查Cookie的有效性和可用性
 */

import { BilibiliAPI, BilibiliAPIError } from './bilibili';
import { logger } from '../utils/logger';

interface CookieHealthResult {
  valid: boolean;
  mid?: string;
  name?: string;
  error?: string;
  errorCode?: number;
}

interface CookiePoolConfig {
  id: string;
  name: string;
  cookie: string;
  priority: number;
}

export class BilibiliHealthService {
  /**
   * 检查单个Cookie的有效性
   */
  static async checkCookie(cookie: string): Promise<CookieHealthResult> {
    try {
      logger.info('开始检查Cookie有效性...');

      const api = BilibiliAPI.fromEnv({
        timeout: 10000,
        retries: 1,
      });

      api.setCredential({
        cookies: cookie,
      } as any);

      const userInfo = await api.user.getUserInfo(0);

      logger.info(`Cookie检查成功: 用户 ${userInfo.name} (mid: ${userInfo.mid})`);

      return {
        valid: true,
        mid: String(userInfo.mid),
        name: userInfo.name,
      };
    } catch (error: any) {
      logger.error('Cookie健康检查失败:', error.message);

      if (error instanceof BilibiliAPIError) {
        return {
          valid: false,
          error: error.message,
          errorCode: error.code,
        };
      }

      return {
        valid: false,
        error: error.message || '未知错误',
      };
    }
  }

  /**
   * 检查所有Cookie的有效性
   */
  static async checkAllCookies(
    cookiePool: CookiePoolConfig[]
  ): Promise<Array<{
    id: string;
    name: string;
    cookie: string;
    priority: number;
    valid: boolean;
    mid?: string;
    userName?: string;
    error?: string;
    errorCode?: number;
  }>> {
    const results = [];

    for (const cookieConfig of cookiePool) {
      if (!cookieConfig.cookie) {
        results.push({
          id: cookieConfig.id,
          name: cookieConfig.name,
          cookie: cookieConfig.cookie,
          priority: cookieConfig.priority,
          valid: false,
          error: 'Cookie未配置',
        });
        continue;
      }

      const result = await this.checkCookie(cookieConfig.cookie);
      results.push({
        id: cookieConfig.id,
        name: cookieConfig.name,
        cookie: cookieConfig.cookie,
        priority: cookieConfig.priority,
        ...result,
        userName: result.name,
      });
    }

    return results;
  }

  /**
   * 获取Cookie池配置
   */
  static getCookiePoolConfig(): CookiePoolConfig[] {
    const pool: CookiePoolConfig[] = [];

    if (process.env.BILIBILI_COOKIE) {
      pool.push({
        id: 'env-cookie-1',
        name: '环境变量Cookie',
        cookie: process.env.BILIBILI_COOKIE,
        priority: 1,
      });
    }

    if (process.env.BILIBILI_COOKIE_2) {
      pool.push({
        id: 'env-cookie-2',
        name: '备用Cookie 2',
        cookie: process.env.BILIBILI_COOKIE_2,
        priority: 2,
      });
    }

    if (process.env.BILIBILI_COOKIE_3) {
      pool.push({
        id: 'env-cookie-3',
        name: '备用Cookie 3',
        cookie: process.env.BILIBILI_COOKIE_3,
        priority: 3,
      });
    }

    return pool;
  }

  /**
   * 获取Cookie健康摘要
   */
  static async getHealthSummary(): Promise<{
    total: number;
    valid: number;
    invalid: number;
    unconfigured: number;
    details: any[];
  }> {
    const cookiePool = this.getCookiePoolConfig();
    const results = await this.checkAllCookies(cookiePool);

    const summary = {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid && r.cookie).length,
      unconfigured: results.filter(r => !r.cookie).length,
      details: results,
    };

    logger.info('Cookie健康摘要:', summary);
    return summary;
  }

  /**
   * 发送Cookie失效告警
   */
  static async sendAlert(cookie: {
    id: string;
    name: string;
    error?: string;
  }): Promise<void> {
    logger.error(`Cookie告警: ${cookie.name} (ID: ${cookie.id}) 失效 - ${cookie.error}`);

    // TODO: 实现实际的告警通知（邮件、钉钉、企业微信等）
    // 这里可以集成邮件服务、钉钉机器人、企业微信机器人等
  }

  /**
   * 定期检查Cookie健康状态
   */
  static startHealthCheck(intervalMs: number = 24 * 60 * 60 * 1000): void {
    logger.info(`启动Cookie健康检查，间隔: ${intervalMs}ms`);

    setInterval(async () => {
      try {
        logger.info('开始定期Cookie健康检查...');
        const summary = await this.getHealthSummary();

        if (summary.invalid > 0) {
          logger.error(`发现 ${summary.invalid} 个失效Cookie`);

          for (const detail of summary.details) {
            if (!detail.valid && detail.cookie) {
              await this.sendAlert(detail);
            }
          }
        }

        logger.info('定期Cookie健康检查完成');
      } catch (error: any) {
        logger.error('定期Cookie健康检查失败:', error.message);
      }
    }, intervalMs);
  }
}
