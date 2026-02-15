/**
 * 智能限流策略
 * 基于响应状态动态调整请求间隔，避免触发B站风控
 */

import { logger } from '../utils/logger';

interface RateLimiterConfig {
  baseDelay: number;
  minDelay: number;
  maxDelay: number;
  successThreshold: number;
  failureThreshold: number;
  delayMultiplier: number;
  delayDivider: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  baseDelay: 2000,
  minDelay: 1000,
  maxDelay: 30000,
  successThreshold: 5,
  failureThreshold: 2,
  delayMultiplier: 1.5,
  delayDivider: 0.8,
};

export class RateLimiter {
  protected config: RateLimiterConfig;
  protected currentDelay: number;
  protected successCount: number;
  protected failureCount: number;
  protected requestCount: number;
  protected lastRequestTime: number;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentDelay = this.config.baseDelay;
    this.successCount = 0;
    this.failureCount = 0;
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const remainingDelay = Math.max(0, this.currentDelay - elapsed);

    if (remainingDelay > 0) {
      logger.debug(`限流等待: ${remainingDelay}ms`);
      await this.sleep(remainingDelay);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  recordSuccess(): void {
    this.successCount++;
    this.failureCount = 0;

    if (this.successCount >= this.config.successThreshold) {
      const oldDelay = this.currentDelay;
      this.currentDelay = Math.max(
        this.config.minDelay,
        Math.floor(this.currentDelay * this.config.delayDivider)
      );
      
      if (oldDelay !== this.currentDelay) {
        logger.info(`限流延迟降低: ${oldDelay}ms -> ${this.currentDelay}ms`);
      }
      
      this.successCount = 0;
    }
  }

  recordFailure(error?: any): void {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.config.failureThreshold) {
      const oldDelay = this.currentDelay;
      this.currentDelay = Math.min(
        this.config.maxDelay,
        Math.floor(this.currentDelay * this.config.delayMultiplier)
      );
      
      if (oldDelay !== this.currentDelay) {
        logger.warn(`限流延迟增加: ${oldDelay}ms -> ${this.currentDelay}ms`);
      }
      
      this.failureCount = 0;
    }

    if (error) {
      logger.warn(`请求失败: ${error.message || 'Unknown error'}`);
    }
  }

  getCurrentDelay(): number {
    return this.currentDelay;
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  getSuccessCount(): number {
    return this.successCount;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  reset(): void {
    this.currentDelay = this.config.baseDelay;
    this.successCount = 0;
    this.failureCount = 0;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    logger.info('限流器已重置');
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class BilibiliRateLimiter extends RateLimiter {
  constructor() {
    super({
      baseDelay: 2000,
      minDelay: 1500,
      maxDelay: 30000,
      successThreshold: 5,
      failureThreshold: 2,
      delayMultiplier: 1.5,
      delayDivider: 0.85,
    });
  }

  async waitWithJitter(): Promise<void> {
    const jitter = Math.random() * 500 - 250;
    const adjustedDelay = Math.max(0, this.getCurrentDelay() + jitter);
    
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const remainingDelay = Math.max(0, adjustedDelay - elapsed);

    if (remainingDelay > 0) {
      logger.debug(`Bilibili限流等待: ${Math.floor(remainingDelay)}ms (抖动: ${Math.floor(jitter)}ms)`);
      await this.sleep(remainingDelay);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  recordRateLimit(): void {
    const oldDelay = this.currentDelay;
    this.currentDelay = Math.min(
      this.config.maxDelay,
      Math.floor(this.currentDelay * 2)
    );
    
    logger.error(`触发限流，延迟加倍: ${oldDelay}ms -> ${this.currentDelay}ms`);
    
    this.failureCount = this.config.failureThreshold;
    this.successCount = 0;
  }
}

let globalRateLimiter: BilibiliRateLimiter | null = null;

export function getBilibiliRateLimiter(): BilibiliRateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new BilibiliRateLimiter();
    logger.info('创建全局Bilibili限流器');
  }
  return globalRateLimiter;
}

export function resetBilibiliRateLimiter(): void {
  if (globalRateLimiter) {
    globalRateLimiter.reset();
  }
}