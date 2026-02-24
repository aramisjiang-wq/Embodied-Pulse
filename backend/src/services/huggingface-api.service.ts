/**
 * HuggingFace API 服务
 * 用于获取模型和数据集信息
 * 文档: https://huggingface.co/docs/huggingface_hub/en/guides/huggingface_hub_quickstart
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const HUGGINGFACE_API_BASE = 'https://huggingface.co/api';

const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN || '';

const hfClient = axios.create({
  baseURL: HUGGINGFACE_API_BASE,
  headers: {
    'Content-Type': 'application/json',
    ...(HUGGINGFACE_TOKEN && { 'Authorization': `Bearer ${HUGGINGFACE_TOKEN}` }),
  },
  timeout: 60000,
});

export interface HFModel {
  id: string;
  modelId: string;
  author: string;
  name: string;
  fullName: string;
  description?: string;
  license?: string;
  tags?: string[];
  pipeline_tag?: string;
  downloads: number;
  likes: number;
  lastModified: string;
  private: boolean;
  library_name?: string;
}

export interface HFModelInfo {
  modelId: string;
  id: string;
  author: string;
  downloads: number;
  likes: number;
  lastModified: string;
  tags: string[];
  pipeline_tag?: string;
  private: boolean;
  cardData?: {
    description?: string;
    license?: string;
    tags?: string[];
  };
}

/**
 * 获取所有模型
 */
export async function listModels(params?: {
  filter?: string;
  author?: string;
  search?: string;
  limit?: number;
  full?: boolean;
}): Promise<HFModel[]> {
  try {
    logger.info(`获取HuggingFace模型列表，参数:`, params);

    const requestParams: any = {
      limit: params?.limit || 100,
      sort: 'downloads',
      direction: -1,
    };

    if (params?.filter) {
      requestParams.filter = params.filter;
    }

    if (params?.author) {
      requestParams.author = params.author;
    }

    if (params?.search) {
      requestParams.search = params.search;
    }

    const response = await hfClient.get('/models', {
      params: requestParams,
    });

    const models: HFModel[] = response.data || [];
    logger.info(`获取到 ${models.length} 个模型`);

    return models;
  } catch (error: any) {
    logger.error('获取HuggingFace模型列表失败:', error.message);
    throw error;
  }
}

/**
 * 获取特定作者的模型
 */
export async function listModelsByAuthor(author: string, limit: number = 100): Promise<HFModel[]> {
  try {
    logger.info(`获取作者 ${author} 的模型列表，limit: ${limit}`);

    const response = await hfClient.get('/models', {
      params: {
        author,
        limit,
        sort: 'downloads',
        direction: -1,
      },
      timeout: 60000, // 60秒超时
    });

    if (!response.data) {
      logger.warn(`API返回数据为空，作者: ${author}`);
      return [];
    }

    const rawModels = Array.isArray(response.data) ? response.data : [];
    logger.info(`API返回 ${rawModels.length} 个原始模型数据，作者: ${author}`);

    // 转换数据格式，确保字段匹配
    const models: HFModel[] = rawModels.map((item: any) => ({
      id: item.id || item.modelId || '',
      modelId: item.id || item.modelId || '',
      author: item.author || (item.id ? item.id.split('/')[0] : ''),
      name: item.name || (item.id ? item.id.split('/').slice(1).join('/') : ''),
      fullName: item.id || item.modelId || '',
      description: item.description || '',
      license: item.license || item.cardData?.license || '',
      tags: item.tags || item.cardData?.tags || [],
      pipeline_tag: item.pipeline_tag || item.pipelineTag || '',
      downloads: item.downloads || 0,
      likes: item.likes || 0,
      lastModified: item.lastModified || item.last_modified || new Date().toISOString(),
      private: item.private || false,
      library_name: item.library_name || item.libraryName || '',
    }));

    logger.info(`转换后获取到 ${models.length} 个模型，作者: ${author}`);

    // 记录前几个模型的ID用于调试
    if (models.length > 0) {
      logger.debug(`前3个模型ID: ${models.slice(0, 3).map(m => m.id || 'N/A').join(', ')}`);
    } else {
      logger.warn(`作者 ${author} 没有找到任何模型，可能的原因：1) 作者名不正确 2) 作者没有公开模型 3) API限制`);
    }

    return models;
  } catch (error: any) {
    logger.error(`获取作者 ${author} 的模型列表失败:`, {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    throw error;
  }
}

/**
 * 获取单个模型详情
 */
export async function getModelInfo(modelId: string): Promise<HFModelInfo> {
  try {
    logger.info(`获取模型详情: ${modelId}`);

    const response = await hfClient.get(`/models/${modelId}`);

    const modelInfo: HFModelInfo = response.data;
    logger.info(`获取模型详情成功: ${modelId}`);

    return modelInfo;
  } catch (error: any) {
    logger.error(`获取模型详情失败 (${modelId}):`, error.message);

    if (error.response?.status === 404) {
      throw new Error('模型不存在');
    } else if (error.response?.status === 403) {
      throw new Error('API访问受限，请检查HuggingFace Token配置');
    } else {
      throw new Error('获取模型详情失败');
    }
  }
}

/**
 * 获取数据集列表
 */
export async function listDatasets(params?: {
  filter?: string;
  author?: string;
  search?: string;
  limit?: number;
}): Promise<any[]> {
  try {
    logger.info(`获取HuggingFace数据集列表，参数:`, params);

    const requestParams: any = {
      limit: params?.limit || 100,
      sort: 'downloads',
      direction: -1,
    };

    if (params?.filter) {
      requestParams.filter = params.filter;
    }

    if (params?.author) {
      requestParams.author = params.author;
    }

    if (params?.search) {
      requestParams.search = params.search;
    }

    const response = await hfClient.get('/datasets', {
      params: requestParams,
    });

    const datasets: any[] = response.data || [];
    logger.info(`获取到 ${datasets.length} 个数据集`);

    return datasets;
  } catch (error: any) {
    logger.error('获取HuggingFace数据集列表失败:', error.message);
    throw error;
  }
}

/**
 * 测试API连接
 */
export async function testConnection(): Promise<boolean> {
  try {
    logger.info('测试HuggingFace API连接');

    // 如果配置了 Token，优先使用 /whoami-v2 端点（更快且更可靠）
    const token = process.env.HUGGINGFACE_TOKEN || '';
    if (token) {
      try {
        const response = await hfClient.get('/whoami-v2', {
          timeout: 15000,
        });
        logger.info('HuggingFace API连接成功（使用Token）:', response.data?.name || response.data?.type);
        return true;
      } catch (whoamiError: any) {
        logger.warn('whoami-v2 端点失败，尝试 models 端点:', whoamiError.message);
        // 如果 whoami-v2 失败，回退到 models 端点
      }
    }

    // 使用 /models 端点进行测试
    const response = await hfClient.get('/models', {
      params: {
        limit: 1,
      },
      timeout: 15000,
    });

    logger.info('HuggingFace API连接成功');
    return true;
  } catch (error: any) {
    logger.error('HuggingFace API连接失败:', error.message);
    return false;
  }
}

/**
 * 从HuggingFace URL解析模型/数据集ID
 * 支持的URL格式:
 * - https://huggingface.co/author/model-name
 * - https://huggingface.co/datasets/author/dataset-name
 * - https://huggingface.co/spaces/author/space-name
 * - https://huggingface.co/author/model-name/tree/main
 * - author/model-name
 */
export function parseHuggingFaceUrl(url: string): { author: string; model: string; contentType?: 'model' | 'dataset' | 'space' } | null {
  if (!url) return null;

  // 匹配 datasets/author/name 格式
  const datasetPattern = /^https?:\/\/huggingface\.co\/datasets\/([^\/]+)\/([^\/\?#]+)/i;
  const datasetMatch = url.match(datasetPattern);
  if (datasetMatch) {
    return {
      author: datasetMatch[1],
      model: datasetMatch[2],
      contentType: 'dataset',
    };
  }

  // 匹配 spaces/author/name 格式
  const spacePattern = /^https?:\/\/huggingface\.co\/spaces\/([^\/]+)\/([^\/\?#]+)/i;
  const spaceMatch = url.match(spacePattern);
  if (spaceMatch) {
    return {
      author: spaceMatch[1],
      model: spaceMatch[2],
      contentType: 'space',
    };
  }

  // 匹配普通 author/model-name 格式（默认是model）
  const patterns = [
    /^https?:\/\/huggingface\.co\/([^\/]+)\/([^\/\?#]+)/i,
    /^([^\/]+)\/([^\/\?#]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        author: match[1],
        model: match[2],
        contentType: 'model',
      };
    }
  }

  return null;
}

/**
 * 获取数据集信息
 */
export async function getDatasetInfo(datasetId: string): Promise<any> {
  try {
    logger.info(`获取数据集详情: ${datasetId}`);

    const response = await hfClient.get(`/datasets/${datasetId}`);

    const datasetInfo: any = response.data;
    logger.info(`获取数据集详情成功: ${datasetId}`);

    return datasetInfo;
  } catch (error: any) {
    logger.error(`获取数据集详情失败 (${datasetId}):`, error.message);

    if (error.response?.status === 404) {
      throw new Error('数据集不存在');
    } else if (error.response?.status === 403) {
      throw new Error('API访问受限，请检查HuggingFace Token配置');
    } else {
      throw new Error('获取数据集详情失败');
    }
  }
}

/**
 * 从URL获取模型/数据集信息
 */
export async function getModelFromUrl(url: string): Promise<HFModelInfo & { contentType?: 'model' | 'dataset' | 'space' }> {
  const parsed = parseHuggingFaceUrl(url);

  if (!parsed) {
    throw new Error('无效的HuggingFace URL');
  }

  const itemId = `${parsed.author}/${parsed.model}`;
  const contentType = parsed.contentType || 'model';

  if (contentType === 'dataset') {
    try {
      const datasetInfo = await getDatasetInfo(itemId);
      // 转换数据集信息为统一格式
      return {
        id: datasetInfo.id || itemId,
        modelId: datasetInfo.id || itemId,
        author: parsed.author,
        downloads: datasetInfo.downloads || 0,
        likes: datasetInfo.likes || 0,
        lastModified: datasetInfo.lastModified || datasetInfo.last_modified || new Date().toISOString(),
        tags: datasetInfo.tags || [],
        pipeline_tag: '',
        private: datasetInfo.private || false,
        cardData: {
          description: datasetInfo.description || '',
          license: datasetInfo.license || '',
          tags: datasetInfo.tags || [],
        },
        contentType: 'dataset',
      } as any;
    } catch (error: any) {
      // 如果获取数据集失败，返回基础信息
      logger.warn(`获取数据集信息失败，返回基础信息: ${error.message}`);
      return {
        id: itemId,
        modelId: itemId,
        author: parsed.author,
        downloads: 0,
        likes: 0,
        lastModified: new Date().toISOString(),
        tags: [],
        pipeline_tag: '',
        private: false,
        cardData: {
          description: '',
          license: '',
          tags: [],
        },
        contentType: 'dataset',
      } as any;
    }
  }

  const modelInfo = await getModelInfo(itemId);
  return { ...modelInfo, contentType: parsed.contentType || 'model' };
}
