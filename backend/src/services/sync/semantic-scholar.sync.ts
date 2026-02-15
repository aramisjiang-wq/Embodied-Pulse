/**
 * Semantic Scholar API 同步服务
 * 文档: https://api.semanticscholar.org/api-docs/
 * 
 * Semantic Scholar API 特点：
 * - 覆盖范围更广（不仅限于arXiv，还包括其他学术平台）
 * - 提供准确的引用数据
 * - 提供论文推荐功能
 * - 支持批量查询（最多500篇）
 * - 免费使用，基础限制：100请求/5分钟（可申请API key提升限制）
 * 
 * 限流策略：
 * - 自动检测限流并等待重试
 * - 请求频率控制（避免触发限流）
 * - 如果持续限流，降低同步频率或跳过本次同步
 */

import axios from 'axios';
import { createPaper } from '../paper.service';
import { logger } from '../../utils/logger';

const SEMANTIC_SCHOLAR_API_BASE = 'https://api.semanticscholar.org/graph/v1';

// 限流控制：免费版限制为100请求/5分钟，即每3秒一个请求
const RATE_LIMIT_DELAY = 3500; // 3.5秒，稍微保守一点
let lastRequestTime = 0;

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract?: string;
  authors?: Array<{
    authorId?: string;
    name: string;
  }>;
  year?: number;
  venue?: string;
  citationCount?: number;
  referenceCount?: number;
  influentialCitationCount?: number;
  isOpenAccess?: boolean;
  openAccessPdf?: {
    url: string;
  };
  url?: string;
  externalIds?: {
    ArXiv?: string;
    DOI?: string;
    ACL?: string;
    PubMed?: string;
    CorpusId?: number;
  };
  fieldsOfStudy?: string[];
  publicationTypes?: string[];
  publicationDate?: string;
}

interface SemanticScholarSearchResponse {
  total: number;
  offset: number;
  data: SemanticScholarPaper[];
  next?: number;
}

/**
 * 等待以避免触发限流
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    logger.debug(`等待 ${waitTime}ms 以避免触发限流...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

/**
 * 带重试的API请求
 */
async function makeRequestWithRetry<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 60000, // 默认60秒
  skipOnRateLimit: boolean = false
): Promise<T> {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 等待以避免限流
      await waitForRateLimit();
      
      const result = await requestFn();
      
      // 检查响应状态码（axios不会自动抛出429错误，需要手动检查）
      if ((result as any).status === 429) {
        throw { response: { status: 429, headers: { 'retry-after': '60' } } };
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // 检查响应中的429状态码
      const isRateLimit = error.response?.status === 429 || (error as any).status === 429;
      
      // 如果是限流错误（429），等待后重试
      if (isRateLimit) {
        const retryAfter = error.response?.headers?.['retry-after'] 
          ? parseInt(error.response.headers['retry-after']) * 1000 
          : (error.response?.headers?.['Retry-After']
            ? parseInt(error.response.headers['Retry-After']) * 1000
            : retryDelay);
        
        if (skipOnRateLimit && attempt === 1) {
          // 如果设置了skipOnRateLimit且是第一次尝试，直接跳过
          logger.warn(`Semantic Scholar API限流，skipOnRateLimit=true，跳过本次同步`);
          throw new Error(`API限流，已跳过（skipOnRateLimit=true）`);
        }
        
        if (attempt < maxRetries) {
          logger.warn(`Semantic Scholar API限流，等待 ${retryAfter / 1000} 秒后重试 (${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          continue;
        } else {
          logger.error(`Semantic Scholar API限流，已重试 ${maxRetries} 次，放弃本次同步`);
          throw new Error(`API限流，已重试 ${maxRetries} 次仍失败`);
        }
      }
      
      // 其他错误直接抛出
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * 同步Semantic Scholar论文
 * @param query 搜索关键词（例如："embodied AI", "robotics"）
 * @param maxResults 最大结果数（最多100，如需更多需使用分页）
 * @param year 年份筛选（可选）
 * @param fieldsOfStudy 研究领域筛选（可选，例如：["Computer Science", "Robotics"]）
 * @param skipOnRateLimit 如果遇到限流是否跳过（默认false，会重试）
 */
export async function syncSemanticScholarPapers(
  query: string = 'embodied AI OR robotics',
  maxResults: number = 100,
  year?: number,
  fieldsOfStudy?: string[],
  skipOnRateLimit: boolean = false
): Promise<{
  success: boolean;
  synced: number;
  errors: number;
  total: number;
  message?: string;
}> {
  try {
    logger.info(`开始同步Semantic Scholar论文，关键词: ${query}, 最大数量: ${maxResults}`);

    // 构建查询参数
    const params: any = {
      query,
      limit: Math.min(maxResults, 100), // API限制单次最多100
      fields: 'paperId,title,abstract,authors,year,venue,citationCount,referenceCount,influentialCitationCount,isOpenAccess,openAccessPdf,url,externalIds,fieldsOfStudy,publicationTypes,publicationDate',
      sort: 'relevance', // 或 'citationCount', 'year'
    };

    // 添加年份筛选
    if (year) {
      params.year = year;
    }

    // 添加研究领域筛选
    if (fieldsOfStudy && fieldsOfStudy.length > 0) {
      params.fieldsOfStudy = fieldsOfStudy.join(',');
    }

    // 如果有API key，添加到请求头
    const headers: any = {
      'User-Agent': 'Embodied-Pulse-Bot/1.0',
    };
    if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
      headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
      // 如果有API key，可以稍微提高请求频率
      logger.debug('使用API key，请求频率限制已提升');
    }

    // 使用带重试的请求
    const response = await makeRequestWithRetry(async () => {
      return await axios.get<SemanticScholarSearchResponse>(
        `${SEMANTIC_SCHOLAR_API_BASE}/paper/search`,
        {
          params,
          headers,
          timeout: 60000,
          validateStatus: (status) => status < 500, // 接受429（限流）和400（错误），但不接受500
        }
      );
    }, skipOnRateLimit ? 1 : 3, 60000, skipOnRateLimit); // 如果skipOnRateLimit=true，只尝试1次并跳过

    // 处理限流（如果重试后仍然限流，makeRequestWithRetry会抛出错误）
    // 这里检查响应状态码
    if (response.status === 429) {
      const retryAfter = response.headers['retry-after'] || response.headers['Retry-After'] || '60';
      const errorMessage = `Semantic Scholar API限流，请在${retryAfter}秒后重试。建议申请API key以提升限制。`;
      logger.warn(errorMessage);
      
      if (skipOnRateLimit) {
        logger.info('skipOnRateLimit=true，跳过本次同步');
        return {
          success: false,
          synced: 0,
          errors: 0,
          total: 0,
          message: `跳过同步：${errorMessage}`,
        };
      }
      
      return {
        success: false,
        synced: 0,
        errors: 0,
        total: 0,
        message: errorMessage,
      };
    }

    // 处理其他错误
    if (response.status !== 200) {
      const errorMessage = `Semantic Scholar API返回错误: ${response.status} ${response.statusText}`;
      logger.error(errorMessage);
      return {
        success: false,
        synced: 0,
        errors: 0,
        total: 0,
        message: errorMessage,
      };
    }

    const papers = response.data.data || [];
    logger.info(`获取到 ${papers.length} 篇论文（总计: ${response.data.total || 0}）`);

    let syncedCount = 0;
    let errorCount = 0;

    // 处理每篇论文（批量处理，每10篇等待一次以避免限流）
    const BATCH_SIZE = 10;
    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i];
      
      try {
        if (!paper.title || !paper.paperId) {
          logger.warn(`跳过无效论文: paperId=${paper.paperId}, title=${paper.title}`);
          errorCount++;
          continue;
        }

        // 提取作者
        const authors = paper.authors?.map(a => a.name) || [];
        
        // 提取arXiv ID（如果有）
        const arxivId = paper.externalIds?.ArXiv?.replace('arXiv:', '') || null;
        
        // 提取PDF URL（优先使用openAccessPdf，否则使用url）
        const pdfUrl = paper.openAccessPdf?.url || paper.url || null;
        
        // 提取分类（fieldsOfStudy）
        const categories = paper.fieldsOfStudy || [];
        
        // 解析发布日期
        let publishedDate: Date | undefined = undefined;
        if (paper.publicationDate) {
          try {
            publishedDate = new Date(paper.publicationDate);
            if (isNaN(publishedDate.getTime())) {
              publishedDate = undefined;
            }
          } catch (e) {
            // 如果解析失败，尝试使用year
            if (paper.year) {
              publishedDate = new Date(paper.year, 0, 1);
            }
          }
        } else if (paper.year) {
          publishedDate = new Date(paper.year, 0, 1);
        }

        // 使用createPaper（已支持upsert，基于arxivId去重）
        // 如果没有arxivId，使用paperId作为唯一标识（格式：semantic-{paperId}）
        const uniqueArxivId = arxivId || `semantic-${paper.paperId}`;
        await createPaper({
          arxivId: uniqueArxivId,
          title: paper.title,
          abstract: paper.abstract || null,
          authors: JSON.stringify(authors),
          categories: categories.length > 0 ? JSON.stringify(categories) : null,
          pdfUrl: pdfUrl || null,
          publishedDate: publishedDate || null,
          citationCount: paper.citationCount || 0,
          venue: paper.venue || null,
        });

        syncedCount++;
        
        // 每处理BATCH_SIZE篇论文，等待一下以避免数据库操作过快
        if ((i + 1) % BATCH_SIZE === 0 && i < papers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms延迟
        }
      } catch (error: any) {
        errorCount++;
        logger.error(`处理论文失败 (${paper.title || paper.paperId}):`, error.message);
      }
    }

    logger.info(`Semantic Scholar同步完成: 成功 ${syncedCount} 篇, 失败 ${errorCount} 篇`);

    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: papers.length,
    };
  } catch (error: any) {
    logger.error(`Semantic Scholar同步失败: ${error.message}`);
    
    // 如果是限流错误（已经重试过）
    if (error.message?.includes('限流') || error.message?.includes('已重试')) {
      return {
        success: false,
        synced: 0,
        errors: 0,
        total: 0,
        message: `Semantic Scholar API限流，已尝试重试但仍失败。建议：\n` +
          `1. 申请API key以提升限制（https://www.semanticscholar.org/product/api）\n` +
          `2. 配置环境变量 SEMANTIC_SCHOLAR_API_KEY\n` +
          `3. 稍后重试（建议等待5分钟）`,
      };
    }
    
    // 如果是网络错误，返回友好的错误信息
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        synced: 0,
        errors: 0,
        total: 0,
        message: `Semantic Scholar API请求超时。可能的原因：\n` +
          `1. 网络连接问题\n` +
          `2. API响应较慢\n\n` +
          `建议：\n` +
          `- 检查网络连接\n` +
          `- 稍后重试\n` +
          `- 减少maxResults数量`,
      };
    }

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || '60';
      return {
        success: false,
        synced: 0,
        errors: 0,
        total: 0,
        message: `Semantic Scholar API限流，请在${retryAfter}秒后重试。建议申请API key以提升限制。`,
      };
    }

    return {
      success: false,
      synced: 0,
      errors: 0,
      total: 0,
      message: `Semantic Scholar同步失败: ${error.message}`,
    };
  }
}

/**
 * 批量获取论文详情（使用paper/batch端点）
 * @param paperIds 论文ID数组（最多500个）
 */
export async function getSemanticScholarPapersBatch(
  paperIds: string[]
): Promise<SemanticScholarPaper[]> {
  try {
    if (paperIds.length === 0) {
      return [];
    }

    if (paperIds.length > 500) {
      logger.warn(`批量查询限制为500篇，将只查询前500篇`);
      paperIds = paperIds.slice(0, 500);
    }

    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'Embodied-Pulse-Bot/1.0',
    };
    if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
      headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
    }

    const response = await axios.post<{ [paperId: string]: SemanticScholarPaper }>(
      `${SEMANTIC_SCHOLAR_API_BASE}/paper/batch`,
      {
        ids: paperIds,
      },
      {
        params: {
          fields: 'paperId,title,abstract,authors,year,venue,citationCount,referenceCount,influentialCitationCount,isOpenAccess,openAccessPdf,url,externalIds,fieldsOfStudy,publicationTypes,publicationDate',
        },
        headers,
        timeout: 120000, // 批量查询可能需要更长时间
      }
    );

    // 将对象转换为数组
    return Object.values(response.data);
  } catch (error: any) {
    logger.error(`批量获取Semantic Scholar论文失败: ${error.message}`);
    throw error;
  }
}

/**
 * 根据arXiv ID获取Semantic Scholar论文详情
 * @param arxivId arXiv ID（例如："2301.12345"）
 */
export async function getSemanticScholarPaperByArxivId(
  arxivId: string
): Promise<SemanticScholarPaper | null> {
  try {
    const headers: any = {
      'User-Agent': 'Embodied-Pulse-Bot/1.0',
    };
    if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
      headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
    }

    const response = await axios.get<SemanticScholarPaper>(
      `${SEMANTIC_SCHOLAR_API_BASE}/paper/arXiv:${arxivId}`,
      {
        params: {
          fields: 'paperId,title,abstract,authors,year,venue,citationCount,referenceCount,influentialCitationCount,isOpenAccess,openAccessPdf,url,externalIds,fieldsOfStudy,publicationTypes,publicationDate',
        },
        headers,
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      logger.debug(`Semantic Scholar中未找到arXiv ID: ${arxivId}`);
      return null;
    }
    logger.error(`获取Semantic Scholar论文失败 (arXiv:${arxivId}): ${error.message}`);
    throw error;
  }
}
