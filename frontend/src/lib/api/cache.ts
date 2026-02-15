/**
 * API 请求缓存和去重工具
 * 用于优化页面切换性能，避免重复请求
 */

interface CacheEntry {
  data: unknown;
  timestamp: number;
  promise?: Promise<unknown>;
  hitCount?: number;
}

interface CacheConfig {
  ttl: number;
  maxSize: number;
  enableStats: boolean;
}

class ApiCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly config: CacheConfig = {
    ttl: 5 * 60 * 1000,
    maxSize: 100,
    enableStats: true,
  };
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private stats: Map<string, number> = new Map();

  /**
   * 生成缓存键
   */
  private getCacheKey(url: string, params?: unknown): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${url}${paramStr}`;
  }

  /**
   * 检查缓存是否有效
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.config.ttl;
  }

  /**
   * 获取缓存数据
   */
  get(url: string, params?: unknown): unknown | null {
    const key = this.getCacheKey(url, params);
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      if (this.config.enableStats) {
        entry.hitCount = (entry.hitCount || 0) + 1;
        this.stats.set(key, entry.hitCount);
      }
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * 设置缓存数据
   */
  set(url: string, data: unknown, params?: unknown): void {
    const key = this.getCacheKey(url, params);
    
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  /**
   * 淘汰最少使用的缓存
   */
  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let minHitCount = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      const hitCount = entry.hitCount || 0;
      if (hitCount < minHitCount) {
        minHitCount = hitCount;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.stats.delete(leastUsedKey);
    }
  }

  /**
   * 检查是否有正在进行的请求（去重）
   */
  getPendingRequest(url: string, params?: unknown): Promise<unknown> | null {
    const key = this.getCacheKey(url, params);
    return this.pendingRequests.get(key) || null;
  }

  /**
   * 设置正在进行的请求
   */
  setPendingRequest(url: string, promise: Promise<unknown>, params?: unknown): void {
    const key = this.getCacheKey(url, params);
    this.pendingRequests.set(key, promise);
    
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  /**
   * 清除正在进行的请求
   */
  clearPendingRequest(url: string, params?: unknown): void {
    const key = this.getCacheKey(url, params);
    this.pendingRequests.delete(key);
  }

  /**
   * 清除缓存
   */
  clear(url?: string, params?: unknown): void {
    if (url) {
      const key = this.getCacheKey(url, params);
      this.cache.delete(key);
      this.pendingRequests.delete(key);
      this.stats.delete(key);
    } else {
      this.cache.clear();
      this.pendingRequests.clear();
      this.stats.clear();
    }
  }

  /**
   * 清除所有过期缓存
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.config.ttl) {
        this.cache.delete(key);
        this.stats.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; hits: Map<string, number> } {
    return {
      size: this.cache.size,
      hits: new Map(this.stats),
    };
  }

  /**
   * 预热缓存
   */
  async warmup(keys: Array<{ url: string; params?: unknown }>, fetchFn: (url: string, params?: unknown) => Promise<unknown>): Promise<void> {
    await Promise.all(
      keys.map(({ url, params }) => {
        const key = this.getCacheKey(url, params);
        if (!this.cache.has(key)) {
          const promise = fetchFn(url, params);
          this.setPendingRequest(url, promise, params);
          return promise.then(data => {
            this.set(url, data, params);
          });
        }
        return Promise.resolve();
      })
    );
  }
}

// 单例模式
export const apiCache = new ApiCache();

// 定期清理过期缓存（每10分钟）
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.clearExpired();
  }, 10 * 60 * 1000);
}
