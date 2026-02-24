/**
 * HuggingFace API 数据同步服务
 * 文档: https://huggingface.co/docs/hub/api
 */

import axios from 'axios';
import { createHuggingFaceModel } from '../huggingface.service';
import { logger } from '../../utils/logger';
import dns from 'dns';

// 强制使用Google DNS（解决VPN环境DNS解析问题）
dns.setServers(['8.8.8.8', '8.8.4.4']);

const HUGGINGFACE_API_BASE = 'https://huggingface.co/api';
const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN || '';

interface HFModel {
  id: string;
  author: string;
  modelId: string;
  sha: string;
  lastModified: string;
  tags: string[];
  pipeline_tag?: string;
  downloads: number;
  likes: number;
  library_name?: string;
  private: boolean;
}

/**
 * 同步HuggingFace模型数据
 * @param task 任务类型 (如: "text-classification", "object-detection")
 * @param maxResults 最大结果数
 */
export async function syncHuggingFaceModels(task?: string, maxResults: number = 100) {
  const maxRetries = 3;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        logger.info(`HuggingFace同步重试 (${attempt}/${maxRetries})...`);
        // 指数退避：2秒、4秒、8秒
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 2)));
      }
      
      logger.info(`开始同步HuggingFace模型${task ? `, 任务: ${task}` : ''}, 最大数量: ${maxResults} (尝试 ${attempt}/${maxRetries})`);
      
      // 构建API请求
      // HuggingFace API文档: https://huggingface.co/docs/hub/api
      const params: any = {
        limit: Math.min(maxResults, 500), // HF API限制
        sort: 'downloads',
        direction: -1,
      };

      // 如果指定了task，使用pipeline_tag过滤
      if (task) {
        // HuggingFace API使用pipeline_tag参数而不是filter
        params.pipeline_tag = task;
      }

      logger.debug(`HuggingFace API请求参数:`, params);

      // 配置代理（如果环境变量中有设置）
      const proxyConfig = process.env.HTTP_PROXY && process.env.PROXY_HOST && process.env.PROXY_PORT
        ? {
            host: process.env.PROXY_HOST,
            port: parseInt(process.env.PROXY_PORT),
            auth: process.env.PROXY_AUTH ? {
              username: process.env.PROXY_AUTH.split(':')[0],
              password: process.env.PROXY_AUTH.split(':')[1],
            } : undefined,
          }
        : undefined;

      if (proxyConfig) {
        logger.info('使用代理访问HuggingFace API:', { host: proxyConfig.host, port: proxyConfig.port });
      }

      // 构建请求头，如果配置了Token则添加Authorization
      const headers: any = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      };
      
      if (HUGGINGFACE_TOKEN) {
        headers['Authorization'] = `Bearer ${HUGGINGFACE_TOKEN}`;
        logger.debug('使用HuggingFace Token进行认证');
      } else {
        logger.warn('未配置HUGGINGFACE_TOKEN，使用匿名访问（可能受到限流）');
      }

      const response = await axios.get(`${HUGGINGFACE_API_BASE}/models`, {
        params,
        timeout: 120000, // 120秒超时，如果超时则重试
        headers,
        validateStatus: (status) => status < 500, // 接受4xx错误以便处理
        maxRedirects: 5,
        proxy: proxyConfig, // 使用代理配置
      });

    // 检查响应状态
    if (response.status === 429) {
      logger.error(`HuggingFace API限流 (429)`);
      const retryAfter = response.headers['retry-after'] || '60';
      return {
        success: false,
        synced: 0,
        errors: 0,
        total: 0,
        message: `HuggingFace API限流，请在${retryAfter}秒后重试。\n\n` +
          '建议：\n' +
          '- 配置HUGGINGFACE_TOKEN以提升限制\n' +
          '- 减少每次同步的数量\n' +
          '- 稍后重试',
      };
    }
    
      if (response.status !== 200) {
        logger.error(`HuggingFace API返回错误状态: ${response.status}`);
        logger.error(`响应数据:`, response.data);
        
        // 对于401/403错误，提示配置Token
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            synced: 0,
            errors: 0,
            total: 0,
            message: `HuggingFace API认证失败 (HTTP ${response.status})。\n\n` +
              '建议：\n' +
              '- 检查HUGGINGFACE_TOKEN是否正确配置\n' +
              '- Token获取地址: https://huggingface.co/settings/tokens\n' +
              '- 确保Token有读取权限',
          };
        }
        
        throw new Error(`HuggingFace API错误: HTTP ${response.status}`);
      }

      // 检查响应数据格式
      if (!response.data) {
        logger.error('HuggingFace API返回数据为空');
        throw new Error('HuggingFace API返回数据为空');
      }

      // 处理数组响应
      let models: HFModel[] = [];
      
      if (Array.isArray(response.data)) {
        models = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // 检查是否是分页响应格式
        if (Array.isArray((response.data as any).items)) {
          models = (response.data as any).items;
        } else if (Array.isArray((response.data as any).data)) {
          models = (response.data as any).data;
        } else {
          logger.warn('HuggingFace API返回未知数据格式');
          logger.debug('响应数据:', JSON.stringify(response.data).substring(0, 500));
        }
      }
      
      if (models.length === 0) {
        logger.warn('HuggingFace API返回0个模型');
        logger.debug('响应数据:', JSON.stringify(response.data).substring(0, 500));
        // 返回友好的错误响应，而不是抛出异常
        return {
          success: false,
          synced: 0,
          errors: 0,
          total: 0,
          message: 'HuggingFace API返回0个模型。可能的原因：\n' +
            '1. 筛选条件太严格，没有匹配的模型\n' +
            '2. API返回数据格式异常\n' +
            '3. API限制或限流\n\n' +
            '建议：\n' +
            '- 尝试不同的任务类型\n' +
            '- 增加同步数量\n' +
            '- 稍后重试',
        };
      }
      
      logger.info(`获取到 ${models.length} 个模型`);

      let syncedCount = 0;
      let errorCount = 0;

      // 处理每个模型
      for (const model of models) {
      try {
        // 只同步公开模型
        if (model.private) {
          logger.debug(`跳过私有模型: ${model.id}`);
          continue;
        }

        // 验证必要字段
        if (!model.id) {
          logger.warn(`跳过无效模型（缺少id）:`, model);
          errorCount++;
          continue;
        }

        // 提取作者和模型名
        const [author, ...nameParts] = model.id.split('/');
        const name = nameParts.join('/');

        // 处理日期字段
        let lastModified: Date;
        try {
          lastModified = model.lastModified ? new Date(model.lastModified) : new Date();
          if (isNaN(lastModified.getTime())) {
            lastModified = new Date();
          }
        } catch (e) {
          lastModified = new Date();
        }

        await createHuggingFaceModel({
          fullName: model.id,
          name: model.modelId || model.id.split('/').pop() || 'unknown',
          author: model.author || 'unknown',
          hfId: model.id,
          license: (model as any).license || null,
          tags: (model as any).tags ? JSON.stringify((model as any).tags) : null,
          description: (model as any).description || '',
          task: model.pipeline_tag || 'unknown',
          downloads: model.downloads || 0,
          likes: model.likes || 0,
          lastModified: lastModified,
          isPinned: false,
          pinnedAt: null,
          contentType: 'model',
          category: null,
        });

        syncedCount++;
        
        // 每10个模型记录一次进度
        if (syncedCount % 10 === 0) {
          logger.info(`已同步 ${syncedCount}/${models.length} 个模型`);
        }
      } catch (error: any) {
        errorCount++;
        // 如果是唯一约束错误，说明模型已存在，不算错误
        if (error.code === 'P2002' || error.message?.includes('unique constraint')) {
          logger.debug(`模型已存在，跳过: ${model.id}`);
          syncedCount++; // 已存在也算成功
          errorCount--; // 不算错误
        } else {
          logger.error(`处理模型失败 (${model.id || '未知'}):`, {
            message: error.message,
            code: error.code,
            stack: error.stack?.substring(0, 200),
          });
        }
      }
    }

      logger.info(`HuggingFace同步完成: 成功 ${syncedCount} 个, 失败 ${errorCount} 个`);
      
      return {
        success: true,
        synced: syncedCount,
        errors: errorCount,
        total: models.length,
      };
    } catch (error: any) {
      lastError = error;
      
      // 如果是超时错误且还有重试机会，继续重试
      if ((error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.code === 'ETIMEDOUT') && attempt < maxRetries) {
        logger.warn(`HuggingFace API请求超时 (尝试 ${attempt}/${maxRetries})，将重试...`);
        continue; // 继续下一次重试
      }
      
      // 如果是网络错误且还有重试机会，继续重试
      if ((error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') && attempt < maxRetries) {
        logger.warn(`HuggingFace API网络错误 (尝试 ${attempt}/${maxRetries})，将重试...`);
        continue; // 继续下一次重试
      }
      
      // 如果已经重试了所有次数，或者不是可重试的错误，跳出循环
      break;
    }
  }
  
  // 如果所有重试都失败了，处理最后的错误
  const error = lastError;
  
  if (!error) {
    // 理论上不应该到这里
    return {
      success: false,
      synced: 0,
      errors: 0,
      total: 0,
      message: 'HuggingFace同步失败: 未知错误',
    };
  }
  
  // 处理超时错误（已重试多次仍失败）
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      logger.error(`HuggingFace API请求超时（已重试${maxRetries}次）:`, {
        message: error.message,
        code: error.code,
        timeout: 60000,
      });
      // 返回友好的错误响应，而不是抛出异常
      return {
        success: false,
        synced: 0,
        errors: 0,
        total: 0,
        message: `HuggingFace API请求超时（已重试${maxRetries}次）。可能的原因：\n` +
          '1. 网络连接较慢或不稳定\n' +
          '2. HuggingFace API响应较慢\n' +
          '3. 服务器网络配置问题\n' +
          '4. 可能需要使用代理或VPN（如果在中国大陆）\n\n' +
          '建议：\n' +
          '- 检查网络连接\n' +
          '- 配置HTTP代理（设置HTTP_PROXY, PROXY_HOST, PROXY_PORT环境变量）\n' +
          '- 使用VPN（如果在中国大陆）\n' +
          '- 稍后重试\n' +
          '- 减少每次同步的数量',
      };
    }

    // 处理网络错误（已重试多次仍失败）
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      logger.error(`HuggingFace API网络错误（已重试${maxRetries}次）:`, {
        message: error.message,
        code: error.code,
      });
      // 返回友好的错误响应，而不是抛出异常
      return {
        success: false,
        synced: 0,
        errors: 0,
        total: 0,
        message: `无法连接到HuggingFace API（已重试${maxRetries}次）。可能的原因：\n` +
          '1. 网络连接失败\n' +
          '2. HuggingFace服务器不可访问（可能需要代理）\n' +
          '3. 防火墙或代理设置问题\n' +
          '4. DNS解析失败\n\n' +
          '建议：\n' +
          '- 检查网络连接\n' +
          '- 配置HTTP代理（设置HTTP_PROXY, PROXY_HOST, PROXY_PORT环境变量）\n' +
          '- 使用VPN（如果在中国大陆）\n' +
          '- 检查防火墙设置\n' +
          '- 稍后重试',
      };
    }

    logger.error(`HuggingFace同步失败:`, {
      message: error.message,
      code: error.code,
      response: error.response?.data ? JSON.stringify(error.response.data).substring(0, 500) : undefined,
      status: error.response?.status,
      stack: error.stack?.substring(0, 300),
    });
    
  // 对于其他错误，也返回友好的错误响应
  return {
    success: false,
    synced: 0,
    errors: 0,
    total: 0,
    message: `HuggingFace同步失败: ${error.message || '未知错误'}\n\n` +
      '建议：\n' +
      '- 检查网络连接\n' +
      '- 查看后端日志获取详细信息\n' +
      '- 稍后重试',
  };
}

/**
 * 同步特定任务的模型
 */
export async function syncHuggingFaceByTask(task: string, maxResults: number = 50) {
  const taskMap: Record<string, string> = {
    'vision': 'image-classification',
    'nlp': 'text-classification',
    'robotics': 'reinforcement-learning',
    'multimodal': 'visual-question-answering',
  };

  const actualTask = taskMap[task] || task;
  logger.info(`同步HuggingFace任务: ${actualTask}`);
  
  return await syncHuggingFaceModels(actualTask, maxResults);
}

/**
 * 获取模型详情（包含README和更多信息）
 */
export async function fetchModelDetails(modelId: string) {
  try {
    const response = await axios.get(`${HUGGINGFACE_API_BASE}/models/${modelId}`, {
      timeout: 30000,
    });

    return response.data;
  } catch (error: any) {
    logger.error(`获取模型详情失败 (${modelId}): ${error.message}`);
    throw error;
  }
}
