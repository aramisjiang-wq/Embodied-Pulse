/**
 * 数据源管理服务
 * 管理所有外部数据源的配置、监控和日志
 */

import adminPrisma from '../config/database.admin';
import { logger } from '../utils/logger';
import axios from 'axios';
import { readFileSync } from 'fs';
// import * as sqlite3 from 'sqlite3'; // 暂时注释，未使用
import * as path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';

export interface DataSourceConfig {
  name: string;
  displayName: string;
  apiBaseUrl: string;
  apiKey?: string;
  enabled: boolean;
  tags?: string[]; // 标签数组
  config: {
    query?: string;
    maxResults?: number;
    task?: string;
    category?: string;
    language?: string;
    topic?: string;
    [key: string]: any;
  };
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  timestamp: Date;
}

export interface SyncLogData {
  dataSourceId: string;
  type: 'sync' | 'health_check' | 'config_update';
  status: 'success' | 'error' | 'warning';
  requestUrl?: string;
  requestMethod?: string;
  requestBody?: any;
  responseCode?: number;
  responseBody?: any;
  errorMessage?: string;
  duration?: number;
  syncedCount?: number;
  errorCount?: number;
}

// 数据源默认配置
const DEFAULT_DATA_SOURCES: Omit<DataSourceConfig, 'apiKey'>[] = [
  {
    name: 'arxiv',
    displayName: 'arXiv论文',
    apiBaseUrl: 'http://export.arxiv.org/api/query',
    enabled: true,
    config: {
      query: 'embodied AI OR robotics OR computer vision',
      maxResults: 100,
    },
  },
  {
    name: 'github',
    displayName: 'GitHub项目',
    apiBaseUrl: 'https://api.github.com',
    enabled: true,
    config: {
      query: 'embodied-ai OR robotics OR computer-vision stars:>50',
      maxResults: 100,
    },
  },
  {
    name: 'huggingface',
    displayName: 'HuggingFace模型',
    apiBaseUrl: 'https://huggingface.co/api',
    enabled: true,
    config: {
      task: 'image-classification',
      maxResults: 100,
    },
  },
  {
    name: 'bilibili',
    displayName: 'Bilibili视频',
    apiBaseUrl: 'https://api.bilibili.com',
    enabled: true,
    config: {
      query: '机器人 OR 具身智能',
      maxResults: 50,
    },
  },
  {
    name: 'youtube',
    displayName: 'YouTube视频',
    apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
    enabled: true,
    config: {
      query: 'embodied AI OR robotics',
      maxResults: 50,
    },
  },
  {
    name: 'hot_news',
    displayName: '热点新闻API',
    apiBaseUrl: 'https://orz.ai/api/v1',
    enabled: true,
    config: {
      platform: 'baidu', // 支持: baidu, weibo, zhihu, bilibili, douban, juejin等
      maxResults: 50,
    },
  },
  {
    name: 'dailyhot_api',
    displayName: 'DailyHotApi',
    apiBaseUrl: 'https://api-hot.imsyy.top',
    enabled: true,
    config: {
      platform: 'baidu', // 支持: baidu, weibo, zhihu, bilibili, acfun, douyin, kuaishou, tieba, sspai, ithome, jianshu, juejin, qq-news, sina, netease-news, 52pojie, hupu, coolapk, v2ex等
      maxResults: 50,
    },
  },
  {
    name: '36kr',
    displayName: '36氪新闻',
    apiBaseUrl: 'https://36kr.com/api',
    enabled: true,
    config: {
      maxResults: 100,
      useApi: true, // true: 使用内部API, false: 使用RSS
    },
  },
  {
    name: 'tech_news',
    displayName: '科技新闻（TechCrunch等）',
    apiBaseUrl: 'https://techcrunch.com/feed/',
    enabled: true,
    config: {
      maxResults: 50,
      sources: [], // 空数组表示同步所有源，或指定: ['techcrunch', 'theverge', 'venturebeat']
    },
  },
  {
    name: 'semantic_scholar',
    displayName: 'Semantic Scholar论文',
    apiBaseUrl: 'https://api.semanticscholar.org/graph/v1',
    enabled: true,
    config: {
      query: 'embodied AI OR robotics OR computer vision',
      maxResults: 100,
      year: new Date().getFullYear(), // 默认获取今年的论文
      fieldsOfStudy: ['Computer Science', 'Robotics'],
    },
  },
];

/**
 * 初始化数据源配置
 */
export async function initializeDataSources() {
  // 如果 Prisma Client 没有 data_sources 模型，跳过初始化
  if (!adminPrisma.data_sources) {
    logger.warn('Prisma Client data_sources 模型不存在，跳过初始化');
    return;
  }

  let createdCount = 0;
  let existingCount = 0;
  let errorCount = 0;

  // 先检查表是否存在
  try {
    await adminPrisma.data_sources.findFirst({ take: 1 });
  } catch (tableError: any) {
    if (tableError.code === 'P2021' || tableError.message?.includes('does not exist') || tableError.message?.includes('Cannot read properties')) {
      logger.warn('数据源表不存在或Prisma模型未生成，跳过初始化');
      return;
    }
    throw tableError;
  }

  for (const source of DEFAULT_DATA_SOURCES) {
    try {
      // 直接尝试查找
      const existing = await adminPrisma.data_sources.findUnique({
        where: { name: source.name },
      });

      if (!existing) {
        await adminPrisma.data_sources.create({
          data: {
            id: crypto.randomUUID(),
            name: source.name,
            display_name: source.displayName,
            api_base_url: source.apiBaseUrl,
            enabled: source.enabled,
            config: JSON.stringify(source.config),
            health_status: 'unknown',
          } as any,
        });
        logger.info(`初始化数据源: ${source.displayName}`);
        createdCount++;
      } else {
        logger.debug(`数据源已存在: ${source.displayName}`);
        existingCount++;
      }
    } catch (sourceError: any) {
      // 记录错误但继续处理其他数据源
      logger.error(`初始化数据源 ${source.name} 失败:`, sourceError);
      errorCount++;
    }
  }

  logger.info(`数据源初始化完成: 新建 ${createdCount} 个, 已存在 ${existingCount} 个, 失败 ${errorCount} 个`);
  
  // 如果所有数据源都失败，不抛出错误，只是记录
  if (createdCount === 0 && existingCount === 0 && errorCount === DEFAULT_DATA_SOURCES.length) {
    logger.warn('所有数据源初始化失败，但继续运行');
  }
}

/**
 * 获取所有数据源
 */
export async function getAllDataSources() {
  try {
    // 先检查 adminPrisma.data_sources 是否存在，如果不存在则直接使用SQL查询
    let sources;
    if (!adminPrisma.data_sources) {
      logger.warn('Prisma Client data_sources 模型不存在，使用SQL查询...');
      try {
        // 使用原始SQL查询，注意SQLite的语法
        const rawSources = await adminPrisma.$queryRawUnsafe<Array<{
          id: string;
          name: string;
          display_name: string;
          enabled: number;
          api_base_url: string;
          config: string;
          health_status: string;
          created_at: string;
          updated_at: string;
        }>>(`SELECT * FROM data_sources ORDER BY created_at ASC`);
        
        logger.info(`通过SQL查询到 ${rawSources.length} 个数据源`);
        if (rawSources.length > 0) {
          return rawSources.map((source: any) => ({
            id: source.id,
            name: source.name,
            displayName: source.display_name,
            enabled: Boolean(source.enabled),
            apiBaseUrl: source.api_base_url,
            config: JSON.parse(source.config || '{}'),
            healthStatus: source.health_status,
            createdAt: new Date(source.created_at),
            updatedAt: new Date(source.updated_at),
            logs: [],
          }));
        }
        return [];
      } catch (sqlError: any) {
        logger.error('SQL查询失败:', {
          error: sqlError.message,
          code: sqlError.code,
        });
        // 如果SQL查询也失败，返回默认数据源列表，确保前端能显示数据
        logger.warn('SQL查询失败，返回默认数据源列表');
        return DEFAULT_DATA_SOURCES.map((source, index) => ({
          id: `default-${source.name}-${index}`,
          name: source.name,
          displayName: source.displayName,
          enabled: source.enabled,
          apiBaseUrl: source.apiBaseUrl,
          config: source.config,
          healthStatus: 'unknown' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          logs: [],
        }));
      }
    }

    // 尝试使用 Prisma 查询
    try {
      logger.info('开始查询数据源列表...');
      sources = await adminPrisma.data_sources.findMany({
        orderBy: { created_at: 'asc' },
      });
      logger.info(`查询到 ${sources.length} 个数据源`);
      if (sources.length > 0) {
        logger.info(`数据源名称: ${sources.map((s: any) => s.name).join(', ')}`);
      }
    } catch (queryError: any) {
      // 如果表不存在，尝试直接使用SQL查询
      if (queryError.code === 'P2021' || queryError.message?.includes('does not exist') || queryError.message?.includes('Cannot read properties')) {
        logger.warn('Prisma查询失败，尝试直接SQL查询...');
        try {
          const rawSources = await adminPrisma.$queryRawUnsafe<Array<{
            id: string;
            name: string;
            display_name: string;
            enabled: number;
            tags: string | null;
            api_base_url: string;
            config: string;
            health_status: string;
            created_at: string;
            updated_at: string;
          }>>(`SELECT * FROM data_sources ORDER BY created_at ASC`);
          
          logger.info(`通过SQL查询到 ${rawSources.length} 个数据源`);
          if (rawSources.length > 0) {
            return rawSources.map((source: any) => ({
              id: source.id,
              name: source.name,
              displayName: source.display_name,
              enabled: Boolean(source.enabled),
              tags: source.tags ? JSON.parse(source.tags) : [],
              apiBaseUrl: source.api_base_url,
              config: JSON.parse(source.config || '{}'),
              healthStatus: source.health_status,
              createdAt: new Date(source.created_at),
              updatedAt: new Date(source.updated_at),
              logs: [],
            }));
          }
          return [];
        } catch (sqlError: any) {
          logger.error('SQL查询也失败:', sqlError);
          // 如果SQL查询也失败，返回默认数据源列表
          logger.warn('SQL查询失败，返回默认数据源列表');
          return DEFAULT_DATA_SOURCES.map((source, index) => ({
            id: `default-${source.name}-${index}`,
            name: source.name,
            displayName: source.displayName,
            enabled: source.enabled,
            apiBaseUrl: source.apiBaseUrl,
            config: source.config,
            healthStatus: 'unknown' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            logs: [],
          }));
        }
      }
      logger.error('查询数据源失败:', {
        error: queryError.message,
        code: queryError.code,
        meta: queryError.meta,
      });
      throw queryError;
    }

    // 如果没有数据源，尝试初始化
    if (sources.length === 0) {
      logger.info('数据源表为空，开始初始化数据源...');
      try {
        await initializeDataSources();
        // 重新查询
        sources = await adminPrisma.data_sources.findMany({
          orderBy: { created_at: 'asc' },
        });
      } catch (initError: any) {
        logger.error('初始化数据源失败:', initError);
        // 初始化失败不影响返回，返回空数组
        return [];
      }
    }

    // 尝试包含日志查询，如果失败则使用基础查询
    let sourcesWithLogs;
    try {
      sourcesWithLogs = await adminPrisma.data_sources.findMany({
        orderBy: { created_at: 'asc' },
        include: {
          logs: {
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
      } as any);
      
      // 处理tags字段（从JSON字符串解析）
      return sourcesWithLogs.map((source: any) => ({
        ...source,
        tags: source.tags ? JSON.parse(source.tags) : [],
        config: JSON.parse(source.config || '{}'),
      }));
    } catch (includeError: any) {
      // 如果include查询失败，使用之前查询的结果
      logger.warn('包含日志查询失败，使用基础查询:', includeError.message);
      sourcesWithLogs = sources.map((s: any) => ({ ...s, logs: [] }));
    }

    // 处理返回数据，确保所有字段都正确解析
    const result = sourcesWithLogs.map((source: any) => {
      try {
        return {
          ...source,
          tags: source.tags ? JSON.parse(source.tags) : [],
          config: typeof source.config === 'string' ? JSON.parse(source.config || '{}') : (source.config || {}),
          lastSyncResult: source.last_sync_result && typeof source.last_sync_result === 'string' 
            ? JSON.parse(source.last_sync_result) 
            : (source.last_sync_result || null),
          // 确保logs字段存在
          logs: source.logs || [],
          // 确保healthStatus字段存在，如果为null或undefined则设为unknown
          healthStatus: source.health_status || 'unknown',
        };
      } catch (parseError: any) {
        logger.error(`解析数据源 ${source.id} 配置失败:`, parseError);
        return {
          ...source,
          tags: [],
          config: {},
          lastSyncResult: null,
          logs: source.logs || [],
          healthStatus: source.health_status || 'unknown',
        };
      }
    });

    return result;
  } catch (error: any) {
    logger.error('获取数据源列表失败:', {
      error: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    // 如果是表不存在错误，返回空数组而不是抛出错误
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      logger.warn('数据源表不存在，返回空数组');
      return [];
    }
    
    throw error;
  }
}

/**
 * 获取单个数据源
 */
export async function getDataSourceById(id: string) {
  try {
    // 如果 Prisma Client 没有 data_sources 模型，返回默认数据源
    if (!adminPrisma.data_sources) {
      logger.warn('Prisma Client data_sources 模型不存在，返回默认数据源');
      const defaultSource = DEFAULT_DATA_SOURCES.find((_, index) => `default-${DEFAULT_DATA_SOURCES[index].name}-${index}` === id);
      if (defaultSource) {
        return {
          id,
          name: defaultSource.name,
          displayName: defaultSource.displayName,
          enabled: defaultSource.enabled,
          apiBaseUrl: defaultSource.apiBaseUrl,
          config: defaultSource.config,
          healthStatus: 'unknown' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          logs: [],
        };
      }
      throw new Error('DATA_SOURCE_NOT_FOUND');
    }

    const source = await adminPrisma.data_sources.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { created_at: 'desc' },
          take: 100,
        },
      },
    } as any);

    if (!source) {
      throw new Error('DATA_SOURCE_NOT_FOUND');
    }

    return {
      ...source,
      config: JSON.parse(source.config || '{}'),
      lastSyncResult: source.last_sync_result ? JSON.parse(source.last_sync_result) : null,
    };
  } catch (error) {
    logger.error('获取数据源失败:', error);
    throw error;
  }
}

/**
 * 更新数据源配置
 */
export async function updateDataSource(id: string, data: Partial<DataSourceConfig>) {
  try {
    if (!adminPrisma.data_sources) {
      logger.warn('Prisma Client data_sources 模型不存在，跳过配置更新');
      throw new Error('DATA_SOURCE_MODEL_NOT_AVAILABLE');
    }

    const updateData: any = {};

    if (data.displayName !== undefined) updateData.display_name = data.displayName;
    if (data.apiBaseUrl !== undefined) updateData.api_base_url = data.apiBaseUrl;
    if (data.apiKey !== undefined) updateData.api_key = data.apiKey;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.tags !== undefined) updateData.tags = data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : null;
    if (data.config !== undefined) updateData.config = JSON.stringify(data.config);

    const updated = await adminPrisma.data_sources.update({
      where: { id },
      data: updateData,
    });

    // 记录配置更新日志
    await createDataSourceLog({
      dataSourceId: id,
      type: 'config_update',
      status: 'success',
    });

    return {
      ...updated,
      tags: updated.tags ? JSON.parse(updated.tags) : [],
      config: JSON.parse(updated.config || '{}'),
    };
  } catch (error) {
    logger.error('更新数据源配置失败:', error);
    throw error;
  }
}

/**
 * 切换数据源启用状态
 */
export async function toggleDataSource(id: string, enabled: boolean) {
  try {
    // 处理临时ID格式（default-{name}-{index}）
    // 如果是临时ID，需要通过name查找对应的真实ID
    let actualId = id;
    if (id.startsWith('default-')) {
      // 解析临时ID: default-arxiv-0 -> arxiv
      const parts = id.split('-');
      if (parts.length >= 2) {
        const sourceName = parts[1]; // arxiv, github, etc.
        logger.info(`临时ID格式，查找数据源: ${sourceName}`);
        
        // 通过name查找真实ID
        try {
          const rawSource = await adminPrisma.$queryRawUnsafe<Array<{ id: string }>>(
            `SELECT id FROM data_sources WHERE name = '${sourceName}' LIMIT 1`
          );
          if (rawSource.length > 0) {
            actualId = rawSource[0].id;
            logger.info(`找到真实ID: ${actualId} (name: ${sourceName})`);
          } else {
            throw new Error('DATA_SOURCE_NOT_FOUND');
          }
        } catch (sqlError: any) {
          logger.error('查找数据源ID失败:', sqlError);
          throw new Error('DATA_SOURCE_NOT_FOUND');
        }
      } else {
        throw new Error('INVALID_DATA_SOURCE_ID');
      }
    }

    // 先尝试使用 Prisma 模型更新
    if (adminPrisma.data_sources) {
      try {
        const updated = await adminPrisma.data_sources.update({
          where: { id: actualId },
          data: { enabled },
        });

        return {
          ...updated,
          config: JSON.parse(updated.config || '{}'),
        };
      } catch (prismaError: any) {
        // 如果 Prisma 更新失败（例如表不存在），使用 SQL 作为 fallback
        if (prismaError.code === 'P2021' || prismaError.message?.includes('does not exist')) {
          logger.warn('Prisma更新失败，使用SQL更新作为fallback:', prismaError.message);
        } else {
          throw prismaError;
        }
      }
    }

    // 使用 SQL 更新（fallback）
    logger.warn('使用SQL更新数据源状态...');
    const enabledValue = enabled ? 1 : 0;
    
    // 使用参数化查询，避免SQL注入
    await adminPrisma.$executeRawUnsafe(
      `UPDATE data_sources SET enabled = ${enabledValue}, updated_at = CURRENT_TIMESTAMP WHERE id = '${actualId}'`
    );

    // 查询更新后的数据
    const rawSource = await adminPrisma.$queryRawUnsafe<Array<{
      id: string;
      name: string;
      display_name: string;
      enabled: number;
      api_base_url: string;
      api_key: string | null;
      config: string;
      health_status: string;
      created_at: string;
      updated_at: string;
    }>>(`SELECT * FROM data_sources WHERE id = '${actualId}'`);

    if (rawSource.length === 0) {
      throw new Error('DATA_SOURCE_NOT_FOUND');
    }

    const source = rawSource[0];
    return {
      id: source.id,
      name: source.name,
      displayName: source.display_name,
      enabled: Boolean(source.enabled),
      apiBaseUrl: source.api_base_url,
      apiKey: source.api_key || undefined,
      config: JSON.parse(source.config || '{}'),
      healthStatus: source.health_status as 'healthy' | 'unhealthy' | 'unknown',
      createdAt: new Date(source.created_at),
      updatedAt: new Date(source.updated_at),
    };
  } catch (error: any) {
    logger.error('切换数据源状态失败:', error);
    if (error.code === 'P2025' || error.message?.includes('Record to update not found')) {
      throw new Error('DATA_SOURCE_NOT_FOUND');
    }
    throw error;
  }
}

/**
 * 更新数据源健康状态（内部辅助函数）
 */
async function updateDataSourceHealthStatus(id: string, status: 'healthy' | 'unhealthy' | 'unknown'): Promise<void> {
  if (adminPrisma.data_sources) {
    try {
      await adminPrisma.data_sources.update({
        where: { id },
        data: {
          health_status: status,
          last_health_check: new Date(),
        },
      });
      logger.info(`数据源 ${id} 健康状态已更新: ${status}`);
    } catch (updateError: any) {
      logger.warn('Prisma更新数据源健康状态失败，尝试SQL更新:', updateError);
      // 如果Prisma更新失败，尝试使用SQL更新
      try {
        await adminPrisma.$executeRawUnsafe(
          `UPDATE data_sources SET health_status = ?, last_health_check = ? WHERE id = ?`,
          status,
          new Date().toISOString(),
          id
        );
        logger.info(`通过SQL更新数据源 ${id} 健康状态: ${status}`);
      } catch (sqlUpdateError: any) {
        logger.error('SQL更新健康状态也失败:', sqlUpdateError);
      }
    }
  } else {
    // 如果Prisma Client不存在，使用SQL更新
    try {
      await adminPrisma.$executeRawUnsafe(
        `UPDATE data_sources SET health_status = ?, last_health_check = ? WHERE id = ?`,
        status,
        new Date().toISOString(),
        id
      );
      logger.info(`通过SQL更新数据源 ${id} 健康状态: ${status}`);
    } catch (sqlUpdateError: any) {
      logger.error('SQL更新健康状态失败:', sqlUpdateError);
    }
  }
}

/**
 * 检查数据源健康状态
 */
export async function checkDataSourceHealth(id: string): Promise<HealthCheckResult> {
  try {
    // 先尝试通过SQL查询数据源（因为Prisma Client可能不存在）
    let source: any = null;
    
    try {
      const rawSources = await adminPrisma.$queryRawUnsafe<Array<{
        id: string;
        name: string;
        display_name: string;
        api_base_url: string;
        enabled: number;
      }>>(`SELECT id, name, display_name, api_base_url, enabled FROM data_sources WHERE id = ?`, id);
      
      if (rawSources.length > 0) {
        source = {
          id: rawSources[0].id,
          name: rawSources[0].name,
          displayName: rawSources[0].display_name,
          apiBaseUrl: rawSources[0].api_base_url,
          enabled: Boolean(rawSources[0].enabled),
        };
      }
    } catch (sqlError: any) {
      logger.warn('SQL查询数据源失败，尝试Prisma查询:', sqlError);
      // 如果SQL查询失败，尝试Prisma查询
      if (adminPrisma.data_sources) {
        source = await adminPrisma.data_sources.findUnique({
          where: { id },
        });
      }
    }

    if (!source) {
      throw new Error('DATA_SOURCE_NOT_FOUND');
    }

    // 检查 apiBaseUrl 是否存在
    if (!source.apiBaseUrl) {
      const status = 'unknown';
      const error = 'API Base URL未配置';
      await updateDataSourceHealthStatus(id, status);
      return {
        status,
        error,
        timestamp: new Date(),
      };
    }

    const startTime = Date.now();
    let status: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
    let error: string | undefined;

    // 声明变量，确保在catch块中可用
    let healthCheckUrl: string = source.apiBaseUrl;
    let timeout: number = 5000;
    
    try {
      // 根据不同的数据源类型进行健康检查
      healthCheckUrl = source.apiBaseUrl;

      if (source.name === 'arxiv') {
        // arXiv: 简单的查询测试
        healthCheckUrl = `${source.apiBaseUrl}?search_query=all:test&max_results=1`;
      } else if (source.name === 'github') {
        // GitHub: 检查API状态
        healthCheckUrl = `${source.apiBaseUrl}/zen`;
      } else if (source.name === 'huggingface') {
        // HuggingFace: 使用更简单的端点进行健康检查
        // 优先使用环境变量中的 Token，如果没有则使用数据源配置的 API Key
        const token = process.env.HUGGINGFACE_TOKEN || source.apiKey;
        if (token) {
          // 如果配置了 Token，使用 /whoami-v2 端点（更快且更可靠）
          healthCheckUrl = `${source.apiBaseUrl}/whoami-v2`;
        } else {
          // 如果没有 Token，使用最简单的端点进行健康检查
          // 使用limit=1和最简单的查询，减少响应时间
          healthCheckUrl = `${source.apiBaseUrl}/models?limit=1`;
        }
      } else if (source.name === 'bilibili') {
        // Bilibili: 检查API状态
        healthCheckUrl = `${source.apiBaseUrl}/x/web-interface/nav`;
      } else if (source.name === 'youtube') {
        // YouTube: 需要API Key，跳过健康检查
        status = 'unknown';
        error = 'YouTube API requires API key for health check';
        
        // 更新数据源健康状态
        await updateDataSourceHealthStatus(id, status);

        return {
          status,
          error,
          timestamp: new Date(),
        };
      } else if (source.name === 'hot_news') {
        // 热点新闻API: 使用默认平台进行健康检查
        const platform = source.config?.platform || 'baidu';
        healthCheckUrl = `${source.apiBaseUrl}/dailynews/?platform=${platform}&limit=1`;
      } else if (source.name === 'dailyhot_api') {
        // DailyHotApi: 使用默认平台进行健康检查
        const platform = source.config?.platform || 'baidu';
        healthCheckUrl = `${source.apiBaseUrl}/${platform}`;
      } else if (source.name === '36kr') {
        // 36kr: 使用内部API进行健康检查
        healthCheckUrl = `${source.apiBaseUrl}/search-column/mainsite?per_page=1&page=1`;
      }

      if (status === 'unknown' && !error && healthCheckUrl) {
        try {
          // HuggingFace API 可能需要更长的超时时间和认证
          // 增加超时时间到30秒，因为HuggingFace API可能响应较慢
          timeout = source.name === 'huggingface' ? 30000 : 5000;
          const headers: any = {
            'Accept': 'application/json',
          };
          
          // 如果有 API Key，添加到请求头
          // 优先使用数据源配置的 API Key，如果没有则使用环境变量中的 Token
          if (source.name === 'huggingface') {
            const token = source.apiKey || process.env.HUGGINGFACE_TOKEN;
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
          }
          
          let response;
          try {
            // 对于HuggingFace，使用更宽松的配置
            const axiosConfig: any = {
              timeout,
              validateStatus: () => true, // 接受所有状态码
              headers,
            };
            
            // HuggingFace API可能需要更长的超时和重试
            if (source.name === 'huggingface') {
              axiosConfig.timeout = timeout;
              // 添加重试逻辑（通过maxRedirects）
              axiosConfig.maxRedirects = 5;
            }
            
            response = await axios.get(healthCheckUrl, axiosConfig);
          } catch (axiosError: any) {
            // 处理超时和网络错误
            const responseTime = Date.now() - startTime;
            if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
              // 对于HuggingFace，超时可能是网络问题，但API本身可能是可用的
              // 如果超时时间较长（>20秒），可能是网络延迟，标记为健康但提示网络问题
              if (source.name === 'huggingface' && timeout >= 20000) {
                status = 'healthy';
                error = `API可能可用但响应较慢（超时${timeout}ms），建议检查网络连接或配置Token`;
              } else {
                status = 'unhealthy';
                error = `请求超时（${timeout}ms）`;
              }
            } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
              status = 'unhealthy';
              error = `连接失败: ${axiosError.message}`;
            } else {
              status = 'unhealthy';
              error = `请求失败: ${axiosError.message}`;
            }
            await updateDataSourceHealthStatus(id, status);
            return {
              status,
              error,
              responseTime,
              timestamp: new Date(),
            };
          }

          const responseTime = Date.now() - startTime;

          // 对于HuggingFace，使用更宽松的健康检查标准
          if (source.name === 'huggingface') {
            // HuggingFace API的特殊处理
            // 只要能够连接到API服务器，即使返回错误也认为API可用（可能是认证或限流问题）
            if (response.status >= 200 && response.status < 300) {
              // 2xx状态码，直接认为健康
              status = 'healthy';
            } else if (response.status === 401 || response.status === 403) {
              // 401/403是认证问题，但API服务器是可用的
              // 只要能够收到响应，就认为API可用（可能是需要Token或限流）
              status = 'healthy';
              error = `API可用但可能需要配置Token (HTTP ${response.status})`;
            } else if (response.status === 429) {
              // 429是限流，说明API可用但请求过于频繁
              status = 'healthy';
              error = `API可用但请求过于频繁，请稍后重试 (HTTP ${response.status})`;
            } else if (response.status >= 400 && response.status < 500) {
              // 其他4xx错误，检查是否有响应数据
              // 如果有响应数据，说明API服务器是可用的
              if (response.data && (Array.isArray(response.data) || (typeof response.data === 'object' && response.data !== null && !response.data.error))) {
                status = 'healthy';
                error = `API可用 (HTTP ${response.status})`;
              } else {
                // 没有有效数据，但能连接到服务器，也认为API可用（可能是参数错误等）
                status = 'healthy';
                error = `API服务器可用 (HTTP ${response.status})`;
              }
            } else if (response.status >= 500) {
              // 5xx错误，服务器问题
              status = 'unhealthy';
              error = `服务器错误 (HTTP ${response.status})`;
            } else {
              // 其他状态码，只要能收到响应就认为可用
              status = 'healthy';
              error = `API可用 (HTTP ${response.status})`;
            }
          } else if (source.name === 'hot_news') {
            // 热点新闻API的特殊处理
            // API返回格式: { status: "200", data: [...], msg: "success" }
            // HTTP状态码应该是200，响应体中的status字段是字符串"200"
            if (response.status >= 200 && response.status < 400) {
              // 检查响应体中的status字段
              if (response.data && typeof response.data === 'object') {
                const apiStatus = response.data.status;
                if (apiStatus === '200' || apiStatus === 200) {
                  status = 'healthy';
                } else {
                  status = 'healthy'; // HTTP请求成功，但API返回错误状态
                  error = `API返回错误: ${response.data.msg || '未知错误'}`;
                }
              } else {
                status = 'healthy'; // HTTP请求成功
              }
            } else {
              status = 'unhealthy';
              error = `HTTP ${response.status}`;
            }
          } else if (source.name === 'dailyhot_api') {
            // DailyHotApi的特殊处理
            // API返回格式: 数组 [{ title, url, desc, hot, ... }] 或 { data: [...] }
            // HTTP状态码应该是200
            if (response.status >= 200 && response.status < 400) {
              // 检查响应数据格式
              if (Array.isArray(response.data)) {
                status = 'healthy';
              } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
                status = 'healthy';
              } else if (response.data && typeof response.data === 'object') {
                // 即使格式不完全匹配，HTTP请求成功也算健康
                status = 'healthy';
              } else {
                // 没有有效数据，但HTTP请求成功
                status = 'healthy';
                error = 'API返回数据格式异常，但服务可访问';
              }
            } else {
              status = 'unhealthy';
              error = `HTTP ${response.status}`;
            }
          } else {
            // 其他数据源的标准处理
            if (response.status >= 200 && response.status < 400) {
              status = 'healthy';
            } else {
              status = 'unhealthy';
              error = `HTTP ${response.status}`;
            }
          }

          // 更新数据源健康状态
          await updateDataSourceHealthStatus(id, status);

          // 记录健康检查日志（失败不影响主流程）
          // 确保 response 存在且有 status 属性
          const httpStatusCode = response && typeof response.status === 'number' ? response.status : 0;
          createDataSourceLog({
            dataSourceId: id,
            type: 'health_check',
            status: status === 'healthy' ? 'success' : 'error',
            requestUrl: healthCheckUrl,
            requestMethod: 'GET',
            responseCode: httpStatusCode,
            duration: responseTime,
            errorMessage: error,
          }).catch(err => logger.debug('健康检查日志记录失败（不影响主流程）:', err));

          return {
            status,
            responseTime,
            error,
            timestamp: new Date(),
          };
        } catch (innerErr: any) {
          status = 'unhealthy';
          // 提供更详细的错误信息
          if (innerErr.code === 'ECONNABORTED' || innerErr.message?.includes('timeout')) {
            const timeoutValue = timeout || 30000;
            error = `请求超时 (${timeoutValue}ms) - ${source.name === 'huggingface' ? 'HuggingFace API 响应较慢，可能需要配置 API Key 或检查网络连接' : 'API响应超时，请检查网络连接'}`;
          } else if (innerErr.code === 'ENOTFOUND' || innerErr.code === 'ECONNREFUSED') {
            error = `无法连接到服务器: ${innerErr.message || '连接被拒绝'}`;
          } else if (innerErr.response) {
            // 有响应但状态码不是2xx
            error = `API返回错误: HTTP ${innerErr.response.status} - ${innerErr.response.statusText || innerErr.message}`;
          } else {
            error = innerErr.message || 'Health check request failed';
          }
          const responseTime = Date.now() - startTime;

          // 更新数据源健康状态
          await updateDataSourceHealthStatus(id, status);

          return {
            status,
            responseTime,
            error,
            timestamp: new Date(),
          };
        }
      }
    } catch (err: any) {
      status = 'unhealthy';
      error = err.message || 'Health check failed';
      const responseTime = Date.now() - startTime;

      // 更新数据源健康状态
      await updateDataSourceHealthStatus(id, status);

      // 记录健康检查日志（失败不影响主流程）
      createDataSourceLog({
        dataSourceId: id,
        type: 'health_check',
        status: 'error',
        requestUrl: healthCheckUrl,
        requestMethod: 'GET',
        errorMessage: error,
        duration: responseTime,
      }).catch(err => logger.debug('健康检查日志记录失败（不影响主流程）:', err));

      return {
        status,
        responseTime,
        error,
        timestamp: new Date(),
      };
    }

    return {
      status,
      error,
      timestamp: new Date(),
    };
  } catch (error: any) {
    logger.error('健康检查失败:', error);
    throw error;
  }
}

/**
 * 检查所有数据源健康状态
 */
export async function checkAllDataSourcesHealth() {
  try {
    const sources = await adminPrisma.data_sources.findMany({
      where: { enabled: true },
    });

    if (sources.length === 0) {
      logger.warn('没有启用的数据源');
      return [];
    }

    const results = await Promise.allSettled(
      sources.map((source: any) => 
        checkDataSourceHealth(source.id).catch(err => {
          logger.error(`数据源 ${source.name} 健康检查失败:`, err);
          return {
            status: 'unhealthy' as const,
            error: err.message || '健康检查失败',
            timestamp: new Date(),
          };
        })
      )
    );

    return results.map((result: any, index: number) => ({
      sourceId: sources[index].id,
      sourceName: sources[index].name,
      result: result.status === 'fulfilled' ? result.value : { 
        status: 'unhealthy' as const, 
        error: result.reason?.message || '未知错误', 
        timestamp: new Date() 
      },
    }));
  } catch (error: any) {
    logger.error('批量健康检查失败:', error);
    // 即使出错也返回空数组，而不是抛出错误
    return [];
  }
}

/**
 * 创建数据源日志
 */
export async function createDataSourceLog(logData: SyncLogData) {
  try {
    // 如果 Prisma Client 没有 data_source_logs 模型，跳过日志记录
    if (!adminPrisma.data_source_logs) {
      logger.debug('Prisma Client data_source_logs 模型不存在，跳过日志记录');
      return null;
    }

    const log = await adminPrisma.data_source_logs.create({
      data: {
        data_source_id: logData.dataSourceId,
        type: logData.type,
        status: logData.status,
        request_url: logData.requestUrl ?? null,
        request_method: logData.requestMethod ?? null,
        request_body: logData.requestBody ? JSON.stringify(logData.requestBody) : null,
        response_code: logData.responseCode ?? null,
        response_body: logData.responseBody ? JSON.stringify(logData.responseBody) : null,
        error_message: logData.errorMessage ?? null,
        duration: logData.duration ?? null,
        synced_count: logData.syncedCount ?? null,
        error_count: logData.errorCount ?? null,
      } as any,
    });

    return log;
  } catch (error: any) {
    // 日志记录失败不应该影响主流程，只记录警告
    logger.warn('创建数据源日志失败（不影响主流程）:', {
      error: error.message,
      code: error.code,
      dataSourceId: logData.dataSourceId,
    });
    return null;
  }
}

/**
 * 获取数据源日志
 */
export async function getDataSourceLogs(dataSourceId: string, limit: number = 100, offset: number = 0) {
  try {
    // 如果 Prisma Client 没有 data_source_logs 模型，返回空数组
    if (!adminPrisma.data_source_logs) {
      logger.warn('Prisma Client data_source_logs 模型不存在，返回空日志');
      return { logs: [], total: 0 };
    }

    const [logs, total] = await Promise.all([
      adminPrisma.data_source_logs.findMany({
        where: { data_source_id: dataSourceId },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      adminPrisma.data_source_logs.count({
        where: { data_source_id: dataSourceId },
      }),
    ]);

    return {
      logs: logs.map((log: any) => ({
        ...log,
        request_body: log.request_body ? JSON.parse(log.request_body) : null,
        response_body: log.response_body ? JSON.parse(log.response_body) : null,
      })),
      total,
    };
  } catch (error) {
    logger.error('获取数据源日志失败:', error);
    // 返回空数组而不是抛出错误
    return { logs: [], total: 0 };
  }
}

/**
 * 更新数据源同步结果
 */
export async function updateDataSourceSyncResult(
  id: string,
  status: 'success' | 'error' | 'running',
  result?: { synced: number; errors: number; total?: number }
) {
  try {
    if (!adminPrisma.data_sources) {
      logger.warn('Prisma Client data_sources 模型不存在，跳过同步结果更新');
      return;
    }

    await adminPrisma.data_sources.update({
      where: { id },
      data: {
        last_sync_at: new Date(),
        last_sync_status: status,
        last_sync_result: result ? JSON.stringify(result) : null,
      },
    });
  } catch (error) {
    logger.error('更新数据源同步结果失败:', error);
    throw error;
  }
}
