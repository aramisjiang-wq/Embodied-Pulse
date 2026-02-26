/**
 * Bilibili Cookie管理服务
 * 支持多Cookie轮换、自动刷新和数据库持久化
 */

import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';
import crypto from 'crypto';

interface BilibiliCookie {
  id: string;
  name: string;
  cookie: string;
  isActive: boolean;
  lastUsed: Date;
  errorCount: number;
  lastError?: string;
  createdAt: Date;
  priority?: number;
  lastCheckAt?: Date;
  checkResult?: string;
  userMid?: string;
  userName?: string;
  source?: string;
}

interface CookieSettings {
  autoRotateEnabled: boolean;
  healthCheckInterval: number;
  maxErrorCount: number;
  alertEnabled: boolean;
}

interface CookiePool {
  cookies: BilibiliCookie[];
  currentIndex: number;
  initialized: boolean;
}

const cookiePool: CookiePool = {
  cookies: [],
  currentIndex: 0,
  initialized: false,
};

const DEFAULT_SETTINGS: CookieSettings = {
  autoRotateEnabled: false,
  healthCheckInterval: 60,
  maxErrorCount: 3,
  alertEnabled: true,
};

export class BilibiliCookieManager {
  /**
   * 初始化：从数据库加载Cookie和设置
   */
  static async initialize(): Promise<void> {
    if (cookiePool.initialized) {
      return;
    }

    try {
      const dbCookies = await userPrisma.bilibili_cookies.findMany({
        orderBy: { priority: 'asc' },
      });

      cookiePool.cookies = dbCookies.map((c: any) => ({
        id: c.id,
        name: c.name,
        cookie: c.cookie,
        isActive: c.is_active,
        lastUsed: c.last_used_at || new Date(),
        errorCount: c.error_count,
        lastError: c.last_error || undefined,
        createdAt: c.created_at,
        priority: c.priority,
        lastCheckAt: c.last_check_at || undefined,
        checkResult: c.check_result || undefined,
        userMid: c.user_mid || undefined,
        userName: c.user_name || undefined,
        source: c.source || undefined,
      }));

      const envCookie = process.env.BILIBILI_COOKIE;
      if (envCookie) {
        const existingEnvCookie = cookiePool.cookies.find(c => c.source === 'env');
        if (!existingEnvCookie) {
          const envCookieData: BilibiliCookie = {
            id: 'env',
            name: '环境变量Cookie',
            cookie: envCookie,
            isActive: true,
            lastUsed: new Date(),
            errorCount: 0,
            createdAt: new Date(),
            source: 'env',
          };
          cookiePool.cookies.unshift(envCookieData);
        }
      }

      cookiePool.initialized = true;
      logger.info(`Cookie管理器初始化完成，共 ${cookiePool.cookies.length} 个Cookie`);
    } catch (error: any) {
      logger.error('Cookie管理器初始化失败:', error.message);
      cookiePool.initialized = true;
    }
  }

  /**
   * 同步初始化版本（向后兼容）
   */
  static initializeSync(): void {
    this.initialize().catch(err => {
      logger.error('Cookie管理器异步初始化失败:', err.message);
    });
  }

  /**
   * 添加Cookie到内存和数据库
   */
  static async addCookie(cookie: BilibiliCookie): Promise<BilibiliCookie> {
    if (cookie.id !== 'env') {
      try {
        const dbCookie = await userPrisma.bilibili_cookies.create({
          data: {
            id: cookie.id,
            name: cookie.name,
            cookie: cookie.cookie,
            priority: cookie.priority || cookiePool.cookies.length,
            is_active: cookie.isActive,
            error_count: cookie.errorCount,
            last_error: cookie.lastError,
            last_used_at: cookie.lastUsed,
            source: cookie.source || 'manual',
            updated_at: new Date(),
          },
        });
        cookie.id = dbCookie.id;
      } catch (error: any) {
        logger.error('添加Cookie到数据库失败:', error.message);
      }
    }

    cookiePool.cookies.push(cookie);
    logger.info(`添加Cookie: ${cookie.name} (总数: ${cookiePool.cookies.length})`);
    return cookie;
  }

  /**
   * 同步添加版本（向后兼容）
   */
  static addCookieSync(cookie: BilibiliCookie): void {
    this.addCookie(cookie).catch(err => {
      logger.error('异步添加Cookie失败:', err.message);
    });
  }

  /**
   * 从内存和数据库删除Cookie
   */
  static async removeCookie(id: string): Promise<void> {
    if (id !== 'env') {
      try {
        await userPrisma.bilibili_cookies.delete({
          where: { id },
        });
      } catch (error: any) {
        if (!error.message.includes('No record found')) {
          logger.error('从数据库删除Cookie失败:', error.message);
        }
      }
    }

    cookiePool.cookies = cookiePool.cookies.filter(c => c.id !== id);
    logger.info(`移除Cookie: ${id}`);
  }

  /**
   * 同步删除版本（向后兼容）
   */
  static removeCookieSync(id: string): void {
    this.removeCookie(id).catch(err => {
      logger.error('异步删除Cookie失败:', err.message);
    });
  }

  /**
   * 更新Cookie状态到数据库
   */
  static async updateCookieStatus(
    id: string,
    data: {
      isActive?: boolean;
      errorCount?: number;
      lastError?: string;
      lastUsed?: Date;
      lastCheckAt?: Date;
      checkResult?: string;
      userMid?: string;
      userName?: string;
    }
  ): Promise<void> {
    const cookie = cookiePool.cookies.find(c => c.id === id);
    if (cookie) {
      if (data.isActive !== undefined) cookie.isActive = data.isActive;
      if (data.errorCount !== undefined) cookie.errorCount = data.errorCount;
      if (data.lastError !== undefined) cookie.lastError = data.lastError;
      if (data.lastUsed !== undefined) cookie.lastUsed = data.lastUsed;
      if (data.lastCheckAt !== undefined) cookie.lastCheckAt = data.lastCheckAt;
      if (data.checkResult !== undefined) cookie.checkResult = data.checkResult;
      if (data.userMid !== undefined) cookie.userMid = data.userMid;
      if (data.userName !== undefined) cookie.userName = data.userName;
    }

    if (id !== 'env') {
      try {
        await userPrisma.bilibili_cookies.update({
          where: { id },
          data: {
            is_active: data.isActive,
            error_count: data.errorCount,
            last_error: data.lastError,
            last_used_at: data.lastUsed,
            last_check_at: data.lastCheckAt,
            check_result: data.checkResult,
            user_mid: data.userMid,
            user_name: data.userName,
            updated_at: new Date(),
          },
        });
      } catch (error: any) {
        logger.error('更新Cookie状态失败:', error.message);
      }
    }
  }

  /**
   * 获取活跃Cookie
   */
  static async getActiveCookie(): Promise<string | null> {
    await this.initialize();

    if (cookiePool.cookies.length === 0) {
      logger.warn('没有可用的Cookie');
      return null;
    }

    const settings = await this.getSettings();
    const cookie = cookiePool.cookies[cookiePool.currentIndex];

    if (!cookie.isActive) {
      logger.warn(`Cookie ${cookie.name} 已停用，尝试切换到下一个`);
      return this.rotateCookie();
    }

    if (cookie.errorCount >= settings.maxErrorCount) {
      logger.warn(`Cookie ${cookie.name} 错误次数过多 (${cookie.errorCount})，停用并切换`);
      await this.updateCookieStatus(cookie.id, { isActive: false });
      cookie.isActive = false;
      return this.rotateCookie();
    }

    await this.updateCookieStatus(cookie.id, { lastUsed: new Date() });
    return cookie.cookie;
  }

  /**
   * 同步获取版本（向后兼容）
   */
  static getActiveCookieSync(): string | null {
    if (cookiePool.cookies.length === 0) {
      return null;
    }

    const cookie = cookiePool.cookies[cookiePool.currentIndex];
    if (!cookie.isActive || cookie.errorCount >= DEFAULT_SETTINGS.maxErrorCount) {
      return this.rotateCookieSync();
    }

    cookie.lastUsed = new Date();
    return cookie.cookie;
  }

  /**
   * 轮换Cookie
   */
  static async rotateCookie(): Promise<string | null> {
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

    await this.updateCookieStatus(nextCookie.id, {
      lastUsed: new Date(),
      errorCount: 0,
    });
    nextCookie.errorCount = 0;

    logger.info(`使用Cookie: ${nextCookie.name} (索引: ${cookiePool.currentIndex}/${activeCookies.length})`);
    return nextCookie.cookie;
  }

  /**
   * 同步轮换版本（向后兼容）
   */
  static rotateCookieSync(): string | null {
    const activeCookies = cookiePool.cookies.filter(c => c.isActive);

    if (activeCookies.length === 0) {
      return null;
    }

    cookiePool.currentIndex = (cookiePool.currentIndex + 1) % activeCookies.length;
    const nextCookie = activeCookies[cookiePool.currentIndex];
    nextCookie.lastUsed = new Date();
    nextCookie.errorCount = 0;

    return nextCookie.cookie;
  }

  /**
   * 报告Cookie错误
   */
  static async reportError(cookieId: string, error: string): Promise<void> {
    const cookie = cookiePool.cookies.find(c => c.id === cookieId);
    if (cookie) {
      cookie.errorCount++;
      cookie.lastError = error;
      logger.warn(`Cookie ${cookie.name} 报错 (${cookie.errorCount}): ${error}`);

      const settings = await this.getSettings();
      if (cookie.errorCount >= settings.maxErrorCount) {
        logger.error(`Cookie ${cookie.name} 错误次数过多，已停用`);
        cookie.isActive = false;
      }

      await this.updateCookieStatus(cookieId, {
        errorCount: cookie.errorCount,
        lastError: error,
        isActive: cookie.isActive,
      });
    }
  }

  /**
   * 同步报告错误版本（向后兼容）
   */
  static reportErrorSync(cookieId: string, error: string): void {
    const cookie = cookiePool.cookies.find(c => c.id === cookieId);
    if (cookie) {
      cookie.errorCount++;
      cookie.lastError = error;
      if (cookie.errorCount >= DEFAULT_SETTINGS.maxErrorCount) {
        cookie.isActive = false;
      }
    }
  }

  /**
   * 报告Cookie成功
   */
  static async reportSuccess(cookieId: string): Promise<void> {
    const cookie = cookiePool.cookies.find(c => c.id === cookieId);
    if (cookie) {
      cookie.errorCount = 0;
      cookie.lastError = undefined;
    }

    if (cookieId !== 'env') {
      await this.updateCookieStatus(cookieId, {
        errorCount: 0,
        lastError: undefined,
      });
    }
  }

  /**
   * 同步报告成功版本（向后兼容）
   */
  static reportSuccessSync(cookieId: string): void {
    const cookie = cookiePool.cookies.find(c => c.id === cookieId);
    if (cookie) {
      cookie.errorCount = 0;
      cookie.lastError = undefined;
    }
  }

  /**
   * 获取Cookie状态列表
   */
  static async getCookieStatus(): Promise<Array<{
    id: string;
    name: string;
    cookie: string;
    isActive: boolean;
    errorCount: number;
    lastUsed: Date;
    lastError?: string;
    lastCheckAt?: Date;
    checkResult?: string;
    userMid?: string;
    userName?: string;
    source?: string;
    createdAt: Date;
  }>> {
    await this.initialize();
    return cookiePool.cookies.map(c => ({
      id: c.id,
      name: c.name,
      cookie: c.cookie,
      isActive: c.isActive,
      errorCount: c.errorCount,
      lastUsed: c.lastUsed,
      lastError: c.lastError,
      lastCheckAt: c.lastCheckAt,
      checkResult: c.checkResult,
      userMid: c.userMid,
      userName: c.userName,
      source: c.source,
      createdAt: c.createdAt,
    }));
  }

  /**
   * 同步获取状态版本（向后兼容）
   */
  static getCookieStatusSync(): Array<{
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

  /**
   * 获取设置
   */
  static async getSettings(): Promise<CookieSettings> {
    try {
      const dbSettings = await userPrisma.bilibili_cookie_settings.findFirst();
      if (dbSettings) {
        return {
          autoRotateEnabled: dbSettings.auto_rotate_enabled,
          healthCheckInterval: dbSettings.health_check_interval,
          maxErrorCount: dbSettings.max_error_count,
          alertEnabled: dbSettings.alert_enabled,
        };
      }
    } catch (error: any) {
      logger.error('获取Cookie设置失败:', error.message);
    }
    return DEFAULT_SETTINGS;
  }

  static async updateSettings(settings: Partial<CookieSettings>): Promise<CookieSettings> {
    try {
      const existing = await userPrisma.bilibili_cookie_settings.findFirst();

      if (existing) {
        await userPrisma.bilibili_cookie_settings.update({
          where: { id: existing.id },
          data: {
            auto_rotate_enabled: settings.autoRotateEnabled,
            health_check_interval: settings.healthCheckInterval,
            max_error_count: settings.maxErrorCount,
            alert_enabled: settings.alertEnabled,
          },
        });
      } else {
        await userPrisma.bilibili_cookie_settings.create({
          data: {
            id: crypto.randomUUID(),
            auto_rotate_enabled: settings.autoRotateEnabled ?? DEFAULT_SETTINGS.autoRotateEnabled,
            health_check_interval: settings.healthCheckInterval ?? DEFAULT_SETTINGS.healthCheckInterval,
            max_error_count: settings.maxErrorCount ?? DEFAULT_SETTINGS.maxErrorCount,
            alert_enabled: settings.alertEnabled ?? DEFAULT_SETTINGS.alertEnabled,
            updated_at: new Date(),
          },
        });
      }

      return this.getSettings();
    } catch (error: any) {
      logger.error('更新Cookie设置失败:', error.message);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * 是否应该轮换Cookie
   */
  static shouldRotateCookie(requestCount: number): boolean {
    return requestCount % 5 === 0;
  }

  /**
   * 获取活跃Cookie数量
   */
  static async getActiveCount(): Promise<number> {
    await this.initialize();
    return cookiePool.cookies.filter(c => c.isActive).length;
  }

  /**
   * 获取总Cookie数量
   */
  static async getTotalCount(): Promise<number> {
    await this.initialize();
    return cookiePool.cookies.length;
  }

  /**
   * 同步版本（向后兼容）
   */
  static getActiveCountSync(): number {
    return cookiePool.cookies.filter(c => c.isActive).length;
  }

  static getTotalCountSync(): number {
    return cookiePool.cookies.length;
  }
}

BilibiliCookieManager.initializeSync();
