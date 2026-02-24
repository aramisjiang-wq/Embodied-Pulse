/**
 * GitHub API 数据同步服务
 * 文档: https://docs.github.com/en/rest
 */

import axios from 'axios';
import { createRepo } from '../repo.service';
import { logger } from '../../utils/logger';
import dns from 'dns';

// 强制使用Google DNS（解决VPN环境DNS解析问题）
dns.setServers(['8.8.8.8', '8.8.4.4']);

const GITHUB_API_BASE = 'https://api.github.com';

const githubClient = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    'Accept': 'application/vnd.github.v3+json',
  },
  timeout: 30000,
});

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

/**
 * 同步GitHub项目数据
 * @param query 搜索关键词
 * @param maxResults 最大结果数
 */
export async function syncGithubRepos(query: string = 'embodied-ai OR robotics', maxResults: number = 100) {
  try {
    logger.info(`开始同步GitHub项目，关键词: ${query}, 最大数量: ${maxResults}`);
    
    // 搜索仓库
    const response = await githubClient.get('/search/repositories', {
      params: {
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: Math.min(maxResults, 100), // GitHub API限制
      },
    });

    const repos: GitHubRepo[] = response.data.items || [];
    logger.info(`获取到 ${repos.length} 个项目`);

    let syncedCount = 0;
    let errorCount = 0;

    // 处理每个项目
    for (const repo of repos) {
      try {
        await createRepo({
          repoId: String(repo.id), // 使用repoId（String类型）
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || '',
          starsCount: repo.stargazers_count,
          forksCount: repo.forks_count,
          issuesCount: repo.open_issues_count,
          language: repo.language || 'Unknown',
          topics: JSON.stringify(repo.topics || []), // 转换为JSON字符串
          owner: repo.owner.login,
          htmlUrl: repo.html_url, // 添加htmlUrl字段
          createdDate: new Date(repo.created_at),
          updatedDate: new Date(repo.updated_at),
        });

        syncedCount++;
      } catch (error: any) {
        errorCount++;
        logger.error(`处理项目失败 (${repo.full_name}): ${error.message}`);
      }
    }

    logger.info(`GitHub同步完成: 成功 ${syncedCount} 个, 失败 ${errorCount} 个`);
    
    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: repos.length,
    };
  } catch (error: any) {
    logger.error(`GitHub同步失败: ${error.message}`);
    throw error;
  }
}

/**
 * 同步特定语言的项目
 */
export async function syncGithubByLanguage(language: string, topic: string = 'robotics', maxResults: number = 50) {
  const query = `language:${language} topic:${topic} stars:>100`;
  logger.info(`同步GitHub项目: ${language}, ${topic}`);
  
  return await syncGithubRepos(query, maxResults);
}

/**
 * 更新项目的star和fork数
 */
export async function updateRepoStats(fullName: string) {
  try {
    const response = await githubClient.get(`/repos/${fullName}`);
    const repo: GitHubRepo = response.data;

    // 这里需要调用updateRepo service来更新数据库
    logger.info(`更新项目统计: ${fullName}, stars: ${repo.stargazers_count}`);
    
    return {
      starsCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      issuesCount: repo.open_issues_count,
    };
  } catch (error: any) {
    logger.error(`更新项目统计失败 (${fullName}): ${error.message}`);
    throw error;
  }
}
