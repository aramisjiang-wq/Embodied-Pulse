/**
 * 求职岗位同步服务
 * 从GitHub StarCycle/Awesome-Embodied-AI-Job抓取岗位
 * 仓库地址: https://github.com/StarCycle/Awesome-Embodied-AI-Job
 */

import axios from 'axios';
import { logger } from '../../utils/logger';
import userPrisma from '../../config/database.user';

const prisma = userPrisma;

// GitHub岗位仓库
const GITHUB_REPO_OWNER = 'StarCycle';
const GITHUB_REPO_NAME = 'Awesome-Embodied-AI-Job';
const GITHUB_REPO_BRANCH = 'main';
const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_REPO_BRANCH}/README.md`;
// 也可以使用GitHub API（需要token，但更稳定）
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/README.md`;

export interface SyncJobsParams {
  maxResults?: number;
}

export interface SyncJobsResult {
  success: boolean;
  synced: number;
  errors: number;
  total: number;
  message?: string;
}

/**
 * 从GitHub抓取岗位信息
 */
export async function syncJobsFromGithub(params: SyncJobsParams = {}): Promise<SyncJobsResult> {
  try {
    logger.info('开始同步GitHub岗位...');
    
    // 获取README内容（优先使用raw URL，如果失败则使用GitHub API）
    let readme: string;
    try {
      const response = await axios.get(GITHUB_RAW_URL, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Embodied-Pulse-Bot/1.0',
          'Accept': 'text/plain',
        },
      });
      readme = response.data;
    } catch (error: any) {
      logger.warn('使用raw URL失败，尝试GitHub API:', error.message);
      try {
        // 如果raw URL失败，尝试使用GitHub API
        const apiResponse = await axios.get(GITHUB_API_URL, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Embodied-Pulse-Bot/1.0',
            'Accept': 'application/vnd.github.v3+json',
            // 如果有GitHub token，可以添加以提高速率限制
            ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}),
          },
        });
        // GitHub API返回的是base64编码的内容
        readme = Buffer.from(apiResponse.data.content, 'base64').toString('utf-8');
      } catch (apiError: any) {
        logger.error('GitHub API也失败:', {
          message: apiError.message,
          status: apiError.response?.status,
          code: apiError.code,
        });
        throw new Error(`无法获取GitHub仓库内容: ${error.message || apiError.message}`);
      }
    }
    
    const jobs = parseJobsFromMarkdown(readme);
    
    logger.info(`解析到${jobs.length}个岗位`);
    
    // 限制数量
    const limitedJobs = params.maxResults 
      ? jobs.slice(0, params.maxResults) 
      : jobs;
    
    // 存储到数据库
    let successCount = 0;
    for (const job of limitedJobs) {
      try {
        // 检查是否已存在（基于title+company，在最近7天内）
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const existing = await prisma.job.findFirst({
          where: {
            title: job.title,
            company: job.company,
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        });
        
        if (existing) {
          // 更新现有记录
          await prisma.job.update({
            where: { id: existing.id },
            data: {
              title: job.title,
              company: job.company,
              location: job.location,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              description: job.description,
              requirements: job.requirements,
              status: 'open',
              updatedAt: new Date(),
            },
          });
        } else {
          // 创建新记录
          await prisma.job.create({
            data: {
              title: job.title,
              company: job.company,
              location: job.location || '不限',
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              description: job.description || '详见职位链接',
              requirements: job.requirements || '见职位描述',
              status: 'open',
              viewCount: 0,
              favoriteCount: 0,
              createdAt: job.publishDate || new Date(),
            },
          });
        }
        successCount++;
      } catch (error: any) {
        logger.error(`岗位入库失败: ${job.title}`, {
          message: error.message,
          code: error.code,
          stack: error.stack?.substring(0, 200),
        });
      }
    }
    
    logger.info(`GitHub岗位同步完成: 成功${successCount}/${limitedJobs.length}`);
    return { 
      success: true,
      synced: successCount, 
      errors: limitedJobs.length - successCount,
      total: limitedJobs.length 
    };
    
  } catch (error: any) {
    logger.error('GitHub岗位同步失败:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    // 返回友好的错误响应
    return {
      success: false,
      synced: 0,
      errors: 0,
      total: 0,
      message: `GitHub岗位同步失败: ${error.message || '未知错误'}\n\n` +
        '可能的原因：\n' +
        '1. 网络连接问题\n' +
        '2. GitHub仓库不可访问\n' +
        '3. 仓库格式发生变化\n\n' +
        '建议：\n' +
        '- 检查网络连接\n' +
        '- 查看后端日志获取详细信息\n' +
        '- 稍后重试',
    };
  }
}

/**
 * 从Markdown解析岗位信息
 * 格式: **\[日期\] 公司名 - 岗位描述**
 * 例如: **\[2025.3.10\] 星尘智能 - 2025校招/社招/实习集中招聘**
 */
function parseJobsFromMarkdown(markdown: string) {
  const jobs: any[] = [];
  
  // 查找"Rolling Recruitment | 滚动招聘"部分
  const rollingRecruitmentMatch = markdown.match(/##\s*Rolling\s+Recruitment\s*\|?\s*滚动招聘[\s\S]*?(?=##|$)/i);
  if (!rollingRecruitmentMatch) {
    logger.warn('未找到"Rolling Recruitment | 滚动招聘"部分');
    // 如果找不到，尝试解析整个文档
    return parseAllJobs(markdown);
  }
  
  const rollingSection = rollingRecruitmentMatch[0];
  const lines = rollingSection.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 匹配格式: **\[日期\] 公司名 - 岗位描述**
    // 例如: **\[2025.3.10\] 星尘智能 - 2025校招/社招/实习集中招聘**
    const jobMatch = line.match(/\*\*\[(\d{4}\.\d{1,2}\.\d{1,2})\]\s*(.+?)\s*-\s*(.+?)\*\*/);
    if (jobMatch) {
      const [, dateStr, company, title] = jobMatch;
      
      // 解析日期
      const [year, month, day] = dateStr.split('.').map(Number);
      const publishDate = new Date(year, month - 1, day);
      
      // 提取链接（可能在当前行或后续行）
      let applyUrl = '';
      let location = '';
      let description = '';
      
      // 在当前行和后续几行中查找链接和详细信息
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        const nextLine = lines[j].trim();
        
        // 查找链接
        const urlMatch = nextLine.match(/https?:\/\/[^\s\)]+/);
        if (urlMatch && !applyUrl) {
          applyUrl = urlMatch[0];
        }
        
        // 查找地点信息（可能在括号中或单独行）
        const locationMatch = nextLine.match(/[（(]([^）)]+)[）)]/);
        if (locationMatch && !location) {
          const loc = locationMatch[1];
          // 如果包含常见城市名，认为是地点
          if (loc.match(/北京|上海|深圳|杭州|广州|成都|南京|武汉|西安|海外|美国|英国|德国|新加坡|香港|台湾/i)) {
            location = loc;
          }
        }
        
        // 累积描述（非标题行）
        if (nextLine && !nextLine.match(/^\*\*\[/) && !nextLine.startsWith('#')) {
          const cleanLine = nextLine.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1').trim();
          if (cleanLine && cleanLine.length > 5) {
            if (description) {
              description += '\n' + cleanLine;
            } else {
              description = cleanLine;
            }
          }
        }
      }
      
      // 解析岗位类型（添加到description中）
      const jobTypes: string[] = [];
      if (title.includes('实习') || title.includes('Intern')) {
        jobTypes.push('实习');
      }
      if (title.includes('校招') || title.includes('应届')) {
        jobTypes.push('校招');
      }
      if (title.includes('社招') || title.includes('全职')) {
        jobTypes.push('全职');
      }
      if (title.includes('PhD') || title.includes('博士')) {
        jobTypes.push('PhD');
      }
      if (title.includes('PostDoc') || title.includes('博士后')) {
        jobTypes.push('博士后');
      }
      
      // 构建完整描述（包含类型、链接等信息）
      let fullDescription = description || '';
      if (jobTypes.length > 0) {
        fullDescription = `岗位类型: ${jobTypes.join('、')}\n\n${fullDescription}`;
      }
      if (applyUrl) {
        fullDescription += (fullDescription ? '\n\n' : '') + `申请链接: ${applyUrl}`;
      } else {
        fullDescription += (fullDescription ? '\n\n' : '') + `来源: https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;
      }
      
      const job = {
        title: title.trim(),
        company: company.trim(),
        location: location || '不限',
        salaryMin: null,
        salaryMax: null,
        description: fullDescription || `来自${company}的${title}，详见职位链接`,
        requirements: description || '见职位描述',
        publishDate,
        applyUrl: applyUrl || '', // 添加applyUrl字段
      };
      
      jobs.push(job);
    }
  }
  
  logger.info(`从"Rolling Recruitment"部分解析到${jobs.length}个岗位`);
  
  // 如果解析失败，尝试解析整个文档
  if (jobs.length === 0) {
    logger.warn('从"Rolling Recruitment"部分解析失败，尝试解析整个文档');
    return parseAllJobs(markdown);
  }
  
  return jobs;
}

/**
 * 解析整个文档中的岗位（备用方案）
 */
function parseAllJobs(markdown: string) {
  const jobs: any[] = [];
  const lines = markdown.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 匹配格式: **\[日期\] 公司名 - 岗位描述**
    const jobMatch = line.match(/\*\*\[(\d{4}\.\d{1,2}\.\d{1,2})\]\s*(.+?)\s*-\s*(.+?)\*\*/);
    if (jobMatch) {
      const [, dateStr, company, title] = jobMatch;
      
      const [year, month, day] = dateStr.split('.').map(Number);
      const publishDate = new Date(year, month - 1, day);
      
      // 查找链接
      let applyUrl = '';
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        const urlMatch = lines[j].match(/https?:\/\/[^\s\)]+/);
        if (urlMatch) {
          applyUrl = urlMatch[0];
          break;
        }
      }
      
      // 解析岗位类型
      const jobTypes: string[] = [];
      if (title.includes('实习') || title.includes('Intern')) jobTypes.push('实习');
      if (title.includes('校招')) jobTypes.push('校招');
      if (title.includes('社招') || title.includes('全职')) jobTypes.push('全职');
      if (title.includes('PhD') || title.includes('博士')) jobTypes.push('PhD');
      if (title.includes('PostDoc') || title.includes('博士后')) jobTypes.push('博士后');
      
      let fullDescription = `来自${company}的${title}`;
      if (jobTypes.length > 0) {
        fullDescription = `岗位类型: ${jobTypes.join('、')}\n\n${fullDescription}`;
      }
      if (applyUrl) {
        fullDescription += `\n\n申请链接: ${applyUrl}`;
      } else {
        fullDescription += `\n\n来源: https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;
      }
      
      jobs.push({
        title: title.trim(),
        company: company.trim(),
        location: '不限',
        salaryMin: null,
        salaryMax: null,
        description: fullDescription,
        requirements: '见职位描述',
        publishDate,
        applyUrl: applyUrl || '', // 添加applyUrl字段
      });
    }
  }
  
  return jobs;
}

/**
 * 生成模拟岗位数据（用于测试）
 */
function generateMockJobs() {
  return [
    {
      externalId: 'mock-job-1',
      title: '具身智能算法工程师',
      company: 'OpenAI',
      location: '旧金山',
      salaryMin: 150,
      salaryMax: 250,
      description: '负责具身智能算法研发，包括视觉感知、运动规划等',
      requirements: '硕士及以上学历，3年以上相关经验',
      applyUrl: 'https://openai.com/careers',
      tags: JSON.stringify(['具身智能', '深度学习', 'RL']),
    },
    {
      externalId: 'mock-job-2',
      title: '机器人软件工程师',
      company: 'Boston Dynamics',
      location: '波士顿',
      salaryMin: 120,
      salaryMax: 180,
      description: '开发机器人控制系统，优化运动性能',
      requirements: '本科及以上，熟悉ROS',
      applyUrl: 'https://bostondynamics.com/careers',
      tags: JSON.stringify(['机器人', 'ROS', 'C++']),
    },
    {
      externalId: 'mock-job-3',
      title: 'AI研究员（具身智能方向）',
      company: 'Google DeepMind',
      location: '伦敦',
      salaryMin: 180,
      salaryMax: 300,
      description: '从事具身智能前沿研究，发表顶会论文',
      requirements: '博士学历，有ICRA/IROS论文',
      applyUrl: 'https://deepmind.google/careers',
      tags: JSON.stringify(['具身智能', '强化学习', '研究']),
    },
    {
      externalId: 'mock-job-4',
      title: '机器人视觉工程师',
      company: '优必选',
      location: '深圳',
      salaryMin: 40,
      salaryMax: 80,
      description: '开发机器人视觉感知算法，包括目标检测、语义分割等',
      requirements: '本科及以上，熟悉OpenCV、PyTorch',
      applyUrl: 'https://www.ubtech.com/cn/join',
      tags: JSON.stringify(['计算机视觉', '深度学习', '机器人']),
    },
    {
      externalId: 'mock-job-5',
      title: '具身智能产品经理',
      company: '特斯拉',
      location: '加州',
      salaryMin: 100,
      salaryMax: 150,
      description: '负责Optimus人形机器人产品规划',
      requirements: '5年以上产品经验',
      applyUrl: 'https://tesla.com/careers',
      tags: JSON.stringify(['产品经理', '机器人', '具身智能']),
    },
  ];
}
