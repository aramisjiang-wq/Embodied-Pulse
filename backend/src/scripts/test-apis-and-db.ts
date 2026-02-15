/**
 * 测试所有第三方API和数据库连接
 * 用于验证数据流是否顺畅
 */

import axios from 'axios';
import prisma from '../config/database';
import adminPrisma from '../config/database.admin';
import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

/**
 * 测试arXiv API
 */
async function testArxivAPI(): Promise<TestResult> {
  try {
    const response = await axios.get('http://export.arxiv.org/api/query', {
      params: {
        search_query: 'all:embodied AI',
        start: 0,
        max_results: 1,
      },
      timeout: 10000,
    });
    
    if (response.status === 200 && response.data) {
      return {
        name: 'arXiv API',
        status: 'success',
        message: 'API可用，响应正常',
        data: { status: response.status, hasData: !!response.data },
      };
    }
    
    return {
      name: 'arXiv API',
      status: 'error',
      message: 'API响应异常',
    };
  } catch (error: any) {
    return {
      name: 'arXiv API',
      status: 'error',
      message: `API调用失败: ${error.message}`,
    };
  }
}

/**
 * 测试GitHub API
 */
async function testGitHubAPI(): Promise<TestResult> {
  try {
    const token = process.env.GITHUB_TOKEN || '';
    const headers: any = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    
    const response = await axios.get('https://api.github.com/search/repositories', {
      params: {
        q: 'embodied-ai',
        per_page: 1,
      },
      headers,
      timeout: 10000,
    });
    
    if (response.status === 200 && response.data) {
      return {
        name: 'GitHub API',
        status: 'success',
        message: token ? 'API可用（已认证）' : 'API可用（未认证，限制60次/小时）',
        data: { 
          status: response.status, 
          hasData: !!response.data.items,
          rateLimit: response.headers['x-ratelimit-remaining'],
        },
      };
    }
    
    return {
      name: 'GitHub API',
      status: 'error',
      message: 'API响应异常',
    };
  } catch (error: any) {
    if (error.response?.status === 403) {
      return {
        name: 'GitHub API',
        status: 'error',
        message: 'API限制已超，建议配置GITHUB_TOKEN',
      };
    }
    return {
      name: 'GitHub API',
      status: 'error',
      message: `API调用失败: ${error.message}`,
    };
  }
}

/**
 * 测试HuggingFace API
 */
async function testHuggingFaceAPI(): Promise<TestResult> {
  try {
    const response = await axios.get('https://huggingface.co/api/models', {
      params: {
        search: 'robotics',
        limit: 1,
      },
      timeout: 10000,
    });
    
    if (response.status === 200 && response.data) {
      return {
        name: 'HuggingFace API',
        status: 'success',
        message: 'API可用，响应正常',
        data: { status: response.status, hasData: Array.isArray(response.data) },
      };
    }
    
    return {
      name: 'HuggingFace API',
      status: 'error',
      message: 'API响应异常',
    };
  } catch (error: any) {
    return {
      name: 'HuggingFace API',
      status: 'error',
      message: `API调用失败: ${error.message}`,
    };
  }
}

/**
 * 测试Bilibili API
 */
async function testBilibiliAPI(): Promise<TestResult> {
  try {
    // 测试Bilibili搜索API（使用公开接口）
    const response = await axios.get('https://api.bilibili.com/x/web-interface/search/type', {
      params: {
        search_type: 'video',
        keyword: '机器人',
        page: 1,
        pagesize: 1,
      },
      timeout: 10000,
    });
    
    if (response.status === 200 && response.data) {
      return {
        name: 'Bilibili API',
        status: 'success',
        message: 'API可用，响应正常',
        data: { status: response.status, hasData: response.data.code === 0 },
      };
    }
    
    return {
      name: 'Bilibili API',
      status: 'error',
      message: 'API响应异常',
    };
  } catch (error: any) {
    return {
      name: 'Bilibili API',
      status: 'error',
      message: `API调用失败: ${error.message}`,
    };
  }
}

/**
 * 测试YouTube API
 */
async function testYouTubeAPI(): Promise<TestResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    return {
      name: 'YouTube API',
      status: 'skipped',
      message: '未配置YOUTUBE_API_KEY，跳过测试',
    };
  }
  
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        key: apiKey,
        q: 'embodied AI',
        part: 'snippet',
        maxResults: 1,
        type: 'video',
      },
      timeout: 10000,
    });
    
    if (response.status === 200 && response.data) {
      return {
        name: 'YouTube API',
        status: 'success',
        message: 'API可用，响应正常',
        data: { status: response.status, hasData: !!response.data.items },
      };
    }
    
    return {
      name: 'YouTube API',
      status: 'error',
      message: 'API响应异常',
    };
  } catch (error: any) {
    return {
      name: 'YouTube API',
      status: 'error',
      message: `API调用失败: ${error.message}`,
    };
  }
}

/**
 * 测试主数据库连接
 */
async function testMainDatabase(): Promise<TestResult> {
  try {
    await prisma.$connect();
    const count = await prisma.paper.count();
    
    return {
      name: '主数据库（Papers）',
      status: 'success',
      message: '数据库连接正常',
      data: { paperCount: count },
    };
  } catch (error: any) {
    return {
      name: '主数据库（Papers）',
      status: 'error',
      message: `数据库连接失败: ${error.message}`,
    };
  }
}

/**
 * 测试用户端数据库连接
 */
async function testUserDatabase(): Promise<TestResult> {
  try {
    await userPrisma.$connect();
    // 检查表是否存在
    try {
      const count = await userPrisma.user.count();
      return {
        name: '用户端数据库（Users）',
        status: 'success',
        message: '数据库连接正常',
        data: { userCount: count },
      };
    } catch (error: any) {
      // 表不存在，但连接正常
      return {
        name: '用户端数据库（Users）',
        status: 'error',
        message: `表不存在，需要运行迁移: npx prisma migrate dev --schema=./prisma/schema.user.prisma`,
      };
    }
  } catch (error: any) {
    return {
      name: '用户端数据库（Users）',
      status: 'error',
      message: `数据库连接失败: ${error.message}`,
    };
  }
}

/**
 * 测试管理端数据库连接
 */
async function testAdminDatabase(): Promise<TestResult> {
  try {
    await adminPrisma.$connect();
    const count = await adminPrisma.admins.count();
    
    return {
      name: '管理端数据库（Admins）',
      status: 'success',
      message: '数据库连接正常',
      data: { adminCount: count },
    };
  } catch (error: any) {
    return {
      name: '管理端数据库（Admins）',
      status: 'error',
      message: `数据库连接失败: ${error.message}`,
    };
  }
}

/**
 * 测试数据库表数据
 */
async function testDatabaseTables(): Promise<TestResult[]> {
  const tableResults: TestResult[] = [];
  
  try {
    // 测试主数据库表
    const papers = await prisma.paper.count();
    const repos = await prisma.githubRepo.count();
    const models = await prisma.huggingFaceModel.count();
    const videos = await prisma.video.count();
    const jobs = await prisma.job.count();
    const banners = await prisma.banner.count();
    const announcements = await prisma.announcement.count();
    
    tableResults.push({
      name: 'Papers表',
      status: 'success',
      message: `有 ${papers} 条记录`,
      data: { count: papers },
    });
    
    tableResults.push({
      name: 'GitHubRepos表',
      status: 'success',
      message: `有 ${repos} 条记录`,
      data: { count: repos },
    });
    
    tableResults.push({
      name: 'HuggingFaceModels表',
      status: 'success',
      message: `有 ${models} 条记录`,
      data: { count: models },
    });
    
    tableResults.push({
      name: 'Videos表',
      status: 'success',
      message: `有 ${videos} 条记录`,
      data: { count: videos },
    });
    
    tableResults.push({
      name: 'Jobs表',
      status: 'success',
      message: `有 ${jobs} 条记录`,
      data: { count: jobs },
    });
    
    tableResults.push({
      name: 'Banners表',
      status: 'success',
      message: `有 ${banners} 条记录`,
      data: { count: banners },
    });
    
    tableResults.push({
      name: 'Announcements表',
      status: 'success',
      message: `有 ${announcements} 条记录`,
      data: { count: announcements },
    });
  } catch (error: any) {
    tableResults.push({
      name: '数据库表查询',
      status: 'error',
      message: `查询失败: ${error.message}`,
    });
  }
  
  return tableResults;
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('\n🔍 开始测试第三方API和数据库连接...\n');
  
  // 测试第三方API
  console.log('📡 测试第三方API...');
  results.push(await testArxivAPI());
  results.push(await testGitHubAPI());
  results.push(await testHuggingFaceAPI());
  results.push(await testBilibiliAPI());
  results.push(await testYouTubeAPI());
  
  // 测试数据库连接
  console.log('\n💾 测试数据库连接...');
  results.push(await testMainDatabase());
  results.push(await testUserDatabase());
  results.push(await testAdminDatabase());
  
  // 测试数据库表
  console.log('\n📊 测试数据库表数据...');
  const tableResults = await testDatabaseTables();
  results.push(...tableResults);
  
  // 打印结果
  console.log('\n' + '='.repeat(60));
  console.log('📋 测试结果汇总');
  console.log('='.repeat(60) + '\n');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏭️';
    console.log(`${icon} ${result.name}: ${result.message}`);
    if (result.data) {
      console.log(`   数据: ${JSON.stringify(result.data)}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`总计: ✅ ${successCount} 成功 | ❌ ${errorCount} 失败 | ⏭️ ${skippedCount} 跳过`);
  console.log('='.repeat(60) + '\n');
  
  // 清理连接
  await prisma.$disconnect();
  await userPrisma.$disconnect();
  await adminPrisma.$disconnect();
  
  // 返回结果
  return {
    success: errorCount === 0,
    results,
    summary: {
      success: successCount,
      error: errorCount,
      skipped: skippedCount,
      total: results.length,
    },
  };
}

// 运行测试
if (require.main === module) {
  runTests()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('测试执行失败:', error);
      process.exit(1);
    });
}

export { runTests };
