/**
 * 智能风控规避策略
 * 根据请求频率、错误率、时间等因素动态调整延迟
 */

import { logger } from '../utils/logger';

interface RateLimitConfig {
  baseDelay: number;
  maxDelay: number;
  minDelay: number;
  errorThreshold: number;
  successThreshold: number;
}

interface RequestMetrics {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  recentErrors: number[];
  lastRequestTime: Date;
  lastErrorTime?: Date;
}

export class SmartRateLimiter {
  private config: RateLimitConfig;
  private metrics: RequestMetrics;
  private cookieIndex: number;
  private totalCookies: number;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      baseDelay: config.baseDelay || 5000,
      maxDelay: config.maxDelay || 120000,
      minDelay: config.minDelay || 3000,
      errorThreshold: config.errorThreshold || 3,
      successThreshold: config.successThreshold || 5,
    };

    this.metrics = {
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      recentErrors: [],
      lastRequestTime: new Date(),
    };

    this.cookieIndex = 0;
    this.totalCookies = 1;
  }

  setTotalCookies(count: number): void {
    this.totalCookies = Math.max(1, count);
    logger.info(`设置Cookie总数: ${count}`);
  }

  getNextCookieIndex(): number {
    const index = this.cookieIndex;
    this.cookieIndex = (this.cookieIndex + 1) % this.totalCookies;
    return index;
  }

  recordRequest(success: boolean): void {
    this.metrics.totalRequests++;
    this.metrics.lastRequestTime = new Date();

    if (success) {
      this.metrics.successCount++;
      this.metrics.recentErrors = [];
    } else {
      this.metrics.errorCount++;
      this.metrics.lastErrorTime = new Date();
      this.metrics.recentErrors.push(Date.now());
      
      if (this.metrics.recentErrors.length > 10) {
        this.metrics.recentErrors.shift();
      }
    }

    logger.debug(`请求统计: 总计=${this.metrics.totalRequests}, 成功=${this.metrics.successCount}, 失败=${this.metrics.errorCount}`);
  }

  calculateDelay(): number {
    const errorRate = this.metrics.errorCount / Math.max(1, this.metrics.totalRequests);
    const recentErrorCount = this.metrics.recentErrors.length;
    const timeSinceLastError = this.metrics.lastErrorTime 
      ? Date.now() - this.metrics.lastErrorTime.getTime() 
      : Infinity;

    let delay = this.config.baseDelay;

    if (recentErrorCount >= this.config.errorThreshold) {
      delay = Math.min(delay * 3, this.config.maxDelay);
      logger.warn(`检测到频繁错误 (${recentErrorCount}/${this.config.errorThreshold})，增加延迟至 ${delay}ms`);
    }

    if (errorRate > 0.5 && this.metrics.totalRequests > 5) {
      delay = Math.min(delay * 2, this.config.maxDelay);
      logger.warn(`错误率过高 (${(errorRate * 100).toFixed(1)}%)，增加延迟至 ${delay}ms`);
    }

    if (timeSinceLastError < 30000) {
      delay = Math.min(delay * 1.5, this.config.maxDelay);
      logger.debug(`最近有错误，增加延迟至 ${delay}ms`);
    }

    if (this.metrics.successCount >= this.config.successThreshold && errorRate < 0.2) {
      delay = Math.max(delay * 0.8, this.config.minDelay);
      logger.debug(`请求稳定，降低延迟至 ${delay}ms`);
    }

    delay = Math.max(delay, this.config.minDelay);
    delay = Math.min(delay, this.config.maxDelay);

    return Math.floor(delay);
  }

  async wait(): Promise<void> {
    const delay = this.calculateDelay();
    logger.debug(`等待 ${delay}ms 后继续...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  shouldBackoff(): boolean {
    const recentErrors = this.metrics.recentErrors.filter(
      timestamp => Date.now() - timestamp < 60000
    );

    if (recentErrors.length >= 5) {
      logger.warn(`检测到严重限流 (${recentErrors.length}次错误/分钟)，建议等待更长时间`);
      return true;
    }

    return false;
  }

  getMetrics(): RequestMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      recentErrors: [],
      lastRequestTime: new Date(),
    };
    logger.info('重置风控指标');
  }
}

export const globalRateLimiter = new SmartRateLimiter();