/**
 * 新闻关键词过滤服务
 * 管理新闻内容的关键词过滤规则
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

interface NewsItem {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  platform: string;
  published_date?: Date | null;
  view_count?: number;
  favorite_count?: number;
  share_count?: number;
  score?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface KeywordFilterRule {
  id: string;
  name: string;
  description?: string;
  keywords: string[];
  exclude_keywords: string[];
  match_type: 'all' | 'any';
  case_sensitive: boolean;
  is_active: boolean;
  priority: number;
  apply_to_platform?: string;
}

export interface FilterResult {
  matched: boolean;
  filterId?: string;
  filterName?: string;
  reason?: string;
}

/**
 * 新闻关键词过滤服务
 */
export class NewsKeywordFilterService {
  private cache: Map<string, KeywordFilterRule[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 60000; // 1分钟缓存

  /**
   * 获取所有启用的过滤规则
   */
  async getActiveFilters(): Promise<KeywordFilterRule[]> {
    const cacheKey = 'active_filters';
    const now = Date.now();

    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const filters = await userPrisma.news_keyword_filters.findMany({
        where: { is_active: true },
        orderBy: { priority: 'desc' },
      });

      const parsedFilters: KeywordFilterRule[] = filters.map((filter: any) => ({
        id: filter.id,
        name: filter.name,
        description: filter.description || undefined,
        keywords: filter.keywords ? JSON.parse(filter.keywords) : [],
        exclude_keywords: filter.exclude_keywords ? JSON.parse(filter.exclude_keywords) : [],
        match_type: filter.match_type as 'all' | 'any',
        case_sensitive: filter.case_sensitive,
        is_active: filter.is_active,
        priority: filter.priority,
        apply_to_platform: filter.apply_to_platform || undefined,
      }));

      this.cache.set(cacheKey, parsedFilters);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);

      return parsedFilters;
    } catch (error: any) {
      logger.error(`[NewsKeywordFilter] Error fetching filters: ${error.message}`);
      return [];
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * 应用过滤规则到新闻项
   */
  async filterNews(newsItem: NewsItem): Promise<FilterResult> {
    const filters = await this.getActiveFilters();

    for (const filter of filters) {
      // 检查平台匹配
      if (filter.apply_to_platform && filter.apply_to_platform !== 'all' && filter.apply_to_platform !== newsItem.platform) {
        continue;
      }

      // 检查包含关键词
      const includeMatched = this.checkKeywords(
        newsItem.title,
        newsItem.description || '',
        filter.keywords,
        filter.match_type,
        filter.case_sensitive
      );

      // 检查排除关键词
      const excludeMatched = this.checkKeywords(
        newsItem.title,
        newsItem.description || '',
        filter.exclude_keywords,
        'any',
        filter.case_sensitive
      );

      // 如果包含关键词匹配，且排除关键词不匹配，则过滤
      if (includeMatched && !excludeMatched) {
        return {
          matched: true,
          filterId: filter.id,
          filterName: filter.name,
          reason: `匹配过滤规则: ${filter.name}`,
        };
      }
    }

    return { matched: false };
  }

  /**
   * 批量过滤新闻
   */
  async filterNewsBatch(newsItems: NewsItem[]): Promise<{ item: NewsItem; result: FilterResult }[]> {
    const results: { item: NewsItem; result: FilterResult }[] = [];

    for (const item of newsItems) {
      const result = await this.filterNews(item);
      results.push({ item, result });
    }

    return results;
  }

  /**
   * 检查关键词匹配
   */
  private checkKeywords(
    title: string,
    description: string,
    keywords: string[],
    match_type: 'all' | 'any',
    case_sensitive: boolean
  ): boolean {
    if (!keywords || keywords.length === 0) {
      return false;
    }

    const text = `${title} ${description}`;
    const searchText = case_sensitive ? text : text.toLowerCase();

    const matchedKeywords = keywords.filter(keyword => {
      const searchKeyword = case_sensitive ? keyword : keyword.toLowerCase();
      return searchText.includes(searchKeyword);
    });

    if (match_type === 'all') {
      return matchedKeywords.length === keywords.length;
    } else {
      return matchedKeywords.length > 0;
    }
  }

  /**
   * 创建过滤规则
   */
  async createFilter(data: {
    name: string;
    description?: string;
    keywords: string[];
    exclude_keywords?: string[];
    match_type?: 'all' | 'any';
    case_sensitive?: boolean;
    priority?: number;
    apply_to_platform?: string;
  }): Promise<KeywordFilterRule> {
    try {
      const filter = await userPrisma.news_keyword_filters.create({
        data: {
          name: data.name,
          description: data.description,
          keywords: JSON.stringify(data.keywords),
          exclude_keywords: data.exclude_keywords ? JSON.stringify(data.exclude_keywords) : null,
          match_type: data.match_type || 'all',
          case_sensitive: data.case_sensitive || false,
          priority: data.priority || 0,
          apply_to_platform: data.apply_to_platform || null,
        } as any,
      });

      this.clearCache();

      logger.info(`[NewsKeywordFilter] Created filter: ${filter.name}`);
      
      return {
        id: filter.id,
        name: filter.name,
        description: filter.description || undefined,
        keywords: data.keywords,
        exclude_keywords: data.exclude_keywords || [],
        match_type: (filter.match_type || 'all') as 'all' | 'any',
        case_sensitive: filter.case_sensitive || false,
        is_active: filter.is_active,
        priority: filter.priority || 0,
        apply_to_platform: filter.apply_to_platform || undefined,
      };
    } catch (error: any) {
      logger.error(`[NewsKeywordFilter] Error creating filter: ${error.message}`);
      throw new Error(`Failed to create filter: ${error.message}`);
    }
  }

  /**
   * 更新过滤规则
   */
  async updateFilter(
    id: string,
    data: Partial<{
      name: string;
      description?: string;
      keywords: string[];
      exclude_keywords?: string[];
      match_type: 'all' | 'any';
      case_sensitive: boolean;
      is_active: boolean;
      priority: number;
      apply_to_platform?: string;
    }>
  ): Promise<KeywordFilterRule> {
    try {
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.keywords !== undefined) updateData.keywords = JSON.stringify(data.keywords);
      if (data.exclude_keywords !== undefined) updateData.exclude_keywords = JSON.stringify(data.exclude_keywords);
      if (data.match_type !== undefined) updateData.match_type = data.match_type;
      if (data.case_sensitive !== undefined) updateData.case_sensitive = data.case_sensitive;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.apply_to_platform !== undefined) updateData.apply_to_platform = data.apply_to_platform;

      const filter = await userPrisma.news_keyword_filters.update({
        where: { id },
        data: updateData,
      });

      this.clearCache();

      logger.info(`[NewsKeywordFilter] Updated filter: ${filter.name}`);
      
      return {
        id: filter.id,
        name: filter.name,
        description: filter.description || undefined,
        keywords: filter.keywords ? JSON.parse(filter.keywords) : [],
        exclude_keywords: filter.exclude_keywords ? JSON.parse(filter.exclude_keywords) : [],
        match_type: filter.match_type as 'all' | 'any',
        case_sensitive: filter.case_sensitive,
        is_active: filter.is_active,
        priority: filter.priority,
        apply_to_platform: filter.apply_to_platform || undefined,
      };
    } catch (error: any) {
      logger.error(`[NewsKeywordFilter] Error updating filter: ${error.message}`);
      throw new Error(`Failed to update filter: ${error.message}`);
    }
  }

  /**
   * 删除过滤规则
   */
  async deleteFilter(id: string): Promise<void> {
    try {
      await userPrisma.news_keyword_filters.delete({
        where: { id },
      });

      this.clearCache();

      logger.info(`[NewsKeywordFilter] Deleted filter: ${id}`);
    } catch (error: any) {
      logger.error(`[NewsKeywordFilter] Error deleting filter: ${error.message}`);
      throw new Error(`Failed to delete filter: ${error.message}`);
    }
  }

  /**
   * 获取所有过滤规则
   */
  async getAllFilters(): Promise<KeywordFilterRule[]> {
    try {
      const filters = await userPrisma.news_keyword_filters.findMany({
        orderBy: { priority: 'desc' },
      });

      return filters.map((filter: any) => ({
        id: filter.id,
        name: filter.name,
        description: filter.description || undefined,
        keywords: filter.keywords ? JSON.parse(filter.keywords) : [],
        exclude_keywords: filter.exclude_keywords ? JSON.parse(filter.exclude_keywords) : [],
        match_type: filter.match_type as 'all' | 'any',
        case_sensitive: filter.case_sensitive,
        is_active: filter.is_active,
        priority: filter.priority,
        apply_to_platform: filter.apply_to_platform || undefined,
      }));
    } catch (error: any) {
      logger.error(`[NewsKeywordFilter] Error fetching all filters: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取单个过滤规则
   */
  async getFilterById(id: string): Promise<KeywordFilterRule | null> {
    try {
      const filter = await userPrisma.news_keyword_filters.findUnique({
        where: { id },
      });

      if (!filter) {
        return null;
      }

      return {
        id: filter.id,
        name: filter.name,
        description: filter.description || undefined,
        keywords: filter.keywords ? JSON.parse(filter.keywords) : [],
        exclude_keywords: filter.exclude_keywords ? JSON.parse(filter.exclude_keywords) : [],
        match_type: filter.match_type as 'all' | 'any',
        case_sensitive: filter.case_sensitive,
        is_active: filter.is_active,
        priority: filter.priority,
        apply_to_platform: filter.apply_to_platform || undefined,
      };
    } catch (error: any) {
      logger.error(`[NewsKeywordFilter] Error fetching filter: ${error.message}`);
      return null;
    }
  }
}

// 导出单例实例
export const news_keyword_filtersService = new NewsKeywordFilterService();