export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'local' | 'cache' | 'fallback';
  priority: number;
  available: boolean;
  lastSync?: Date;
  error?: string;
}

export interface FetchResult<T> {
  data: T | null;
  source: DataSource;
  timestamp: Date;
  cached: boolean;
  error?: string;
}

export interface DataProviderConfig {
  maxRetries: number;
  cacheTimeout: number;
  fallbackEnabled: boolean;
  gracefulDegradation: boolean;
}

const DEFAULT_CONFIG: DataProviderConfig = {
  maxRetries: 3,
  cacheTimeout: 5 * 60 * 1000,
  fallbackEnabled: true,
  gracefulDegradation: true,
};

export abstract class DataProvider<T> {
  protected config: DataProviderConfig;
  protected cache: Map<string, { data: T; timestamp: number }> = new Map();
  protected sources: DataSource[] = [];

  constructor(config: Partial<DataProviderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  abstract registerSources(): void;

  abstract fetchFromSource(source: DataSource, params?: unknown): Promise<T>;

  async get(params?: unknown): Promise<FetchResult<T>> {
    const sortedSources = [...this.sources].sort((a, b) => a.priority - b.priority);
    const triedSources: DataSource[] = [];

    for (const source of sortedSources) {
      if (!source.available) {
        console.warn(`[DataProvider] Source ${source.name} is not available, skipping`);
        continue;
      }

      triedSources.push(source);

      try {
        const result = await this.fetchFromSource(source, params);
        
        if (result !== null && result !== undefined) {
          this.cache.set(this.getCacheKey(params), {
            data: result,
            timestamp: Date.now(),
          });

          return {
            data: result,
            source,
            timestamp: new Date(),
            cached: false,
          };
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[DataProvider] Failed to fetch from ${source.name}:`, errorMessage);
        source.error = errorMessage;
        source.available = false;
      }
    }

    const cachedResult = this.getCached(params);
    if (cachedResult) {
      return {
        data: cachedResult.data,
        source: {
          id: 'cache',
          name: 'Local Cache',
          type: 'cache',
          priority: 0,
          available: true,
        },
        timestamp: new Date(cachedResult.timestamp),
        cached: true,
      };
    }

    if (this.config.gracefulDegradation) {
      return this.getGracefulDegradationResult(triedSources);
    }

    return {
      data: null,
      source: {
        id: 'error',
        name: 'No Available Source',
        type: 'fallback',
        priority: 999,
        available: false,
        error: 'All data sources failed',
      },
      timestamp: new Date(),
      cached: false,
      error: 'All data sources failed',
    };
  }

  protected getCacheKey(params?: unknown): string {
    if (!params) return 'default';
    return JSON.stringify(params);
  }

  protected getCached(params?: unknown): { data: T; timestamp: number } | null {
    const key = this.getCacheKey(params);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.config.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }

  protected abstract getGracefulDegradationResult(triedSources: DataSource[]): FetchResult<T>;

  invalidateCache(params?: unknown): void {
    const key = this.getCacheKey(params);
    this.cache.delete(key);
  }

  clearCache(): void {
    this.cache.clear();
  }

  updateSourceStatus(sourceId: string, available: boolean): void {
    const source = this.sources.find(s => s.id === sourceId);
    if (source) {
      source.available = available;
    }
  }

  getSourcesStatus(): DataSource[] {
    return this.sources;
  }
}

export class ApiDataProvider<T> extends DataProvider<T> {
  private fetcher: (params?: unknown) => Promise<T>;

  constructor(
    fetcher: (params?: unknown) => Promise<T>,
    config?: Partial<DataProviderConfig>
  ) {
    super(config);
    this.fetcher = fetcher;
    this.registerSources();
  }

  registerSources(): void {
    this.sources = [
      {
        id: 'primary-api',
        name: 'Primary API',
        type: 'api',
        priority: 1,
        available: true,
      },
      {
        id: 'fallback-api',
        name: 'Fallback API',
        type: 'api',
        priority: 2,
        available: true,
      },
      {
        id: 'local-storage',
        name: 'Local Storage',
        type: 'local',
        priority: 3,
        available: typeof window !== 'undefined',
      },
    ];
  }

  async fetchFromSource(source: DataSource, params?: unknown): Promise<T> {
    if (source.type === 'api') {
      return this.fetcher(params);
    }
    
    if (source.type === 'local' && typeof window !== 'undefined') {
      const key = `data_provider_${source.id}_${this.getCacheKey(params)}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored) as T;
        } catch {
          return null as T;
        }
      }
    }
    
    return null as T;
  }

  protected getGracefulDegradationResult(triedSources: DataSource[]): FetchResult<T> {
    const attempted = triedSources.length;
    return {
      data: null,
      source: {
        id: 'degraded',
        name: 'Graceful Degradation',
        type: 'fallback',
        priority: 100,
        available: true,
        lastSync: new Date(),
      },
      timestamp: new Date(),
      cached: false,
      error: attempted > 0 ? `Service temporarily unavailable after ${attempted} sources` : 'Service temporarily unavailable',
    };
  }
}

export class CompositeDataProvider<T> extends DataProvider<T> {
  private providers: DataProvider<unknown>[] = [];

  addProvider(provider: DataProvider<unknown>): void {
    this.providers.push(provider);
  }

  registerSources(): void {
    this.providers.forEach(p => {
      const providerSources = p.getSourcesStatus();
      this.sources.push(...providerSources);
    });
  }

  async fetchFromSource(source: DataSource, params?: unknown): Promise<T> {
    const provider = this.providers.find(p => 
      p.getSourcesStatus().some(s => s.id === source.id)
    );
    
    if (provider) {
      const result = await provider.get(params);
      return result.data as T;
    }
    
    return null as T;
  }

  protected getGracefulDegradationResult(triedSources: DataSource[]): FetchResult<T> {
    const attempted = triedSources.length;
    return {
      data: null,
      source: {
        id: 'composite-fallback',
        name: 'Composite Fallback',
        type: 'fallback',
        priority: 100,
        available: true,
      },
      timestamp: new Date(),
      cached: false,
      error: attempted > 0 ? `No data available from ${attempted} sources` : 'No data available from any provider',
    };
  }
}

export class OfflineDataManager {
  private static instance: OfflineDataManager;
  private storageKey = 'offline_data_cache';
  private syncQueue: Array<{ key: string; data: unknown; timestamp: number }> = [];
  private isOnline = true;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      this.loadSyncQueue();
    }
  }

  static getInstance(): OfflineDataManager {
    if (!OfflineDataManager.instance) {
      OfflineDataManager.instance = new OfflineDataManager();
    }
    return OfflineDataManager.instance;
  }

  private handleOnline(): void {
    console.log('[OfflineDataManager] Back online, syncing pending data...');
    this.isOnline = true;
    this.syncPending();
  }

  private handleOffline(): void {
    console.log('[OfflineDataManager] Gone offline, queueing requests...');
    this.isOnline = false;
  }

  isCurrentlyOnline(): boolean {
    return this.isOnline;
  }

  private getCache(): Record<string, { data: unknown; timestamp: number }> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      console.warn('[OfflineDataManager] Failed to parse cache from localStorage');
    }
    return {};
  }

  cacheData(key: string, data: unknown): void {
    const cache = this.getCache();
    cache[key] = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(this.storageKey, JSON.stringify(cache));
  }

  getCachedData<T>(key: string, maxAge?: number): T | null {
    const cache = this.getCache();
    const cached = cache[key];
    
    if (!cached) return null;
    
    if (maxAge && Date.now() - cached.timestamp > maxAge) {
      delete cache[key];
      localStorage.setItem(this.storageKey, JSON.stringify(cache));
      return null;
    }
    
    return cached.data as T;
  }

  invalidateCache(key: string): void {
    const cache = this.getCache();
    delete cache[key];
    localStorage.setItem(this.storageKey, JSON.stringify(cache));
  }

  clearCache(): void {
    localStorage.removeItem(this.storageKey);
    this.syncQueue = [];
  }

  queueForSync(key: string, data: unknown): void {
    this.syncQueue.push({
      key,
      data,
      timestamp: Date.now(),
    });
  }

  private loadSyncQueue(): void {
    try {
      const stored = localStorage.getItem('sync_queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch {
      this.syncQueue = [];
    }
  }

  private saveSyncQueue(): void {
    localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
  }

  private async syncPending(): Promise<void> {
    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift();
      if (item) {
        try {
          console.log(`[OfflineDataManager] Syncing: ${item.key}`);
          await this.syncItem(item);
        } catch (error: unknown) {
          console.error(`[OfflineDataManager] Sync failed for ${item.key}:`, error);
          this.syncQueue.unshift(item);
          break;
        }
      }
    }
    this.saveSyncQueue();
  }

  private async syncItem(_item: { key: string; data: unknown; timestamp: number }): Promise<void> {
    void _item;
    return Promise.resolve();
  }

  getCacheSize(): number {
    const cache = this.getCache();
    return Object.keys(cache).length;
  }

  getSyncQueueSize(): number {
    return this.syncQueue.length;
  }
}

export function createOfflineFirstProvider<T>(
  fetcher: (params?: unknown) => Promise<T>,
  cacheKey: string,
  config?: Partial<DataProviderConfig>
): ApiDataProvider<T> {
  return new ApiDataProvider<T>(
    async (params?: unknown) => {
      const offlineManager = OfflineDataManager.getInstance();
      
      if (!offlineManager.isCurrentlyOnline()) {
        const cached = offlineManager.getCachedData<T>(cacheKey);
        if (cached) {
          console.log(`[OfflineFirst] Serving from cache: ${cacheKey}`);
          return cached;
        }
      }
      
      const result = await fetcher(params);
      offlineManager.cacheData(cacheKey, result);
      return result;
    },
    config
  );
}
