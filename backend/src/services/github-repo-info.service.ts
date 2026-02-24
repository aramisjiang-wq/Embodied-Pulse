/**
 * GitHub仓库信息获取服务
 * 用于管理端自动识别仓库信息
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const GITHUB_API_BASE = 'https://api.github.com';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const githubClient = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` }),
  },
  timeout: 30000,
});

export interface GitHubRepoInfo {
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

export interface ParsedGitHubRepo {
  repoId: bigint;
  fullName: string;
  name: string;
  owner: string;
  description: string;
  language: string;
  starsCount: number;
  forksCount: number;
  issuesCount: number;
  topics: string[];
  createdDate: Date;
  updatedDate: Date;
}

/**
 * 从GitHub URL解析仓库信息
 * 支持的URL格式:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - owner/repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  if (!url) return null;

  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/\.]+)/i,
    /^([^\/]+)\/([^\/\.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
      };
    }
  }

  return null;
}

/**
 * 获取单个GitHub仓库的详细信息
 */
export async function getGitHubRepoInfo(owner: string, repo: string): Promise<GitHubRepoInfo> {
  try {
    logger.info(`获取GitHub仓库信息: ${owner}/${repo}`);
    
    const response = await githubClient.get(`/repos/${owner}/${repo}`);
    return response.data;
  } catch (error: any) {
    logger.error(`获取GitHub仓库信息失败 (${owner}/${repo}):`, error.message);
    
    if (error.response?.status === 404) {
      throw new Error('仓库不存在');
    } else if (error.response?.status === 403) {
      throw new Error('API访问受限，请检查GitHub Token配置');
    } else {
      throw new Error('获取仓库信息失败');
    }
  }
}

/**
 * 从GitHub URL获取仓库信息（自动解析）
 */
export async function getGitHubRepoFromUrl(url: string): Promise<ParsedGitHubRepo> {
  const parsed = parseGitHubUrl(url);
  
  if (!parsed) {
    throw new Error('无效的GitHub仓库URL');
  }

  const repoInfo = await getGitHubRepoInfo(parsed.owner, parsed.repo);

  return {
    repoId: BigInt(repoInfo.id),
    fullName: repoInfo.full_name,
    name: repoInfo.name,
    owner: repoInfo.owner.login,
    description: repoInfo.description || '',
    language: repoInfo.language || 'Unknown',
    starsCount: repoInfo.stargazers_count,
    forksCount: repoInfo.forks_count,
    issuesCount: repoInfo.open_issues_count,
    topics: repoInfo.topics || [],
    createdDate: new Date(repoInfo.created_at),
    updatedDate: new Date(repoInfo.updated_at),
  };
}

/**
 * 验证GitHub仓库是否存在
 */
export async function validateGitHubRepo(url: string): Promise<boolean> {
  try {
    const parsed = parseGitHubUrl(url);
    if (!parsed) return false;

    await getGitHubRepoInfo(parsed.owner, parsed.repo);
    return true;
  } catch {
    return false;
  }
}
