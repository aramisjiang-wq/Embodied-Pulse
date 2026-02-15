/**
 * Bilibili Cookie管理服务
 * 支持多Cookie轮换和自动刷新
 */

import { logger } from '../utils/logger';

interface BilibiliCookie {
  id: string;
  name: string;
  cookie: string;
  isActive: boolean;
  lastUsed: Date;
  errorCount: number;
  lastError?: string;
  createdAt: Date;
}

interface CookiePool {
  cookies: BilibiliCookie[];
  currentIndex: number;
}

const cookiePool: CookiePool = {
  cookies: [],
  currentIndex: 0,
};

const COOKIE_CONFIG = {
  maxErrorCount: 3,
  rotationInterval: 5,
};

export class BilibiliCookieManager {
  static initialize(): void {
    const envCookie = process.env.BILIBILI_COOKIE;
    if (envCookie) {
      this.addCookie({
        id: 'env',
        name: '环境变量Cookie',
        cookie: envCookie,
        isActive: true,
        lastUsed: new Date(),
        errorCount: 0,
        createdAt: new Date(),
      });
      logger.info('已加载环境变量中的Bilibili Cookie');
    }
  }

  static addCookie(cookie: BilibiliCookie): void {
    cookiePool.cookies.push(cookie);
    logger.info(`添加Cookie: ${cookie.name} (总数: ${cookiePool.cookies.length})`);
  }

  static removeCookie(id: string): void {
    cookiePool.cookies = cookiePool.cookies.filter(c => c.id !== id);
    logger.info(`移除Cookie: ${id}`);
  }

  static getActiveCookie(): string | null {
    if (cookiePool.cookies.length === 0) {
      logger.warn('没有可用的Cookie');
      return null;
    }

    const cookie = cookiePool.cookies[cookiePool.currentIndex];
    if (!cookie.isActive) {
      logger.warn(`Cookie ${cookie.name} 已停用，尝试切换到下一个`);
      return this.rotateCookie();
    }

    if (cookie.errorCount >= COOKIE_CONFIG.maxErrorCount) {
      logger.warn(`Cookie ${cookie.name} 错误次数过多 (${cookie.errorCount})，停用并切换`);
      cookie.isActive = false;
      return this.rotateCookie();
    }

    cookie.lastUsed = new Date();
    return cookie.cookie;
  }

  static rotateCookie(): string | null {
    const activeCookies = cookiePool.cookies.filter(c => c.isActive);
    
    if (activeCookies.length === 0) {
      logger.error('所有Cookie都已失效');
      return null;
    }

    const currentCookie = cookiePool.cookies[cookiePool.currentIndex];
    if (currentCookie) {
      logger.info(`切换Cookie: ${currentCookie.name} -> 下一个`);
    }

    cookiePool.currentIndex = (cookiePool.currentIndex + 1) % activeCookies.length;
    const nextCookie = activeCookies[cookiePool.currentIndex];
    
    nextCookie.lastUsed = new Date();
    nextCookie.errorCount = 0;
    
    logger.info(`使用Cookie: ${nextCookie.name} (索引: ${cookiePool.currentIndex}/${activeCookies.length})`);
    return nextCookie.cookie;
  }

  static reportError(cookieId: string, error: string): void {
    const cookie = cookiePool.cookies.find(c => c.id === cookieId);
    if (cookie) {
      cookie.errorCount++;
      cookie.lastError = error;
      logger.warn(`Cookie ${cookie.name} 报错 (${cookie.errorCount}/${COOKIE_CONFIG.maxErrorCount}): ${error}`);
      
      if (cookie.errorCount >= COOKIE_CONFIG.maxErrorCount) {
        logger.error(`Cookie ${cookie.name} 错误次数过多，已停用`);
        cookie.isActive = false;
      }
    }
  }

  static reportSuccess(cookieId: string): void {
    const cookie = cookiePool.cookies.find(c => c.id === cookieId);
    if (cookie) {
      cookie.errorCount = 0;
      cookie.lastError = undefined;
    }
  }

  static getCookieStatus(): Array<{
    id: string;
    name: string;
    isActive: boolean;
    errorCount: number;
    lastUsed: Date;
    lastError?: string;
  }> {
    return cookiePool.cookies.map(c => ({
      id: c.id,
      name: c.name,
      isActive: c.isActive,
      errorCount: c.errorCount,
      lastUsed: c.lastUsed,
      lastError: c.lastError,
    }));
  }

  static shouldRotateCookie(requestCount: number): boolean {
    return requestCount % COOKIE_CONFIG.rotationInterval === 0;
  }

  static getActiveCount(): number {
    return cookiePool.cookies.filter(c => c.isActive).length;
  }

  static getTotalCount(): number {
    return cookiePool.cookies.length;
  }
}

BilibiliCookieManager.initialize();