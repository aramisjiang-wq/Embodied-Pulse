/**
 * 第三方API连通性测试脚本
 */

import axios from 'axios';

const API_TIMEOUT = 10000; // 10秒超时

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'timeout';
  message: string;
  responseTime?: number;
  data?: any;
}

const results: TestResult[] = [];

async function testArxivAPI(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const response = await axios.get('http://export.arxiv.org/api/query', {
      params: {
        search_query: 'cat:cs.AI',
        max_results: 1,
      },
      timeout: API_TIMEOUT,
    });
    const responseTime = Date.now() - startTime;
    return {
      name: 'arXiv API',
      status: 'success',
      message: '连接成功',
      responseTime,
      data: { status: response.status, hasData: !!response.data },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        name: 'arXiv API',
        status: 'timeout',
        message: `请求超时 (${responseTime}ms)`,
        responseTime,
      };
    }
    return {
      name: 'arXiv API',
      status: 'error',
      message: error.message || '连接失败',
      responseTime,
    };
  }
}

async function testGithubAPI(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const response = await axios.get('https://api.github.com/search/repositories', {
      params: {
        q: 'embodied AI',
        per_page: 1,
      },
      timeout: API_TIMEOUT,
    });
    const responseTime = Date.now() - startTime;
    return {
      name: 'GitHub API',
      status: 'success',
      message: '连接成功',
      responseTime,
      data: { status: response.status, total_count: response.data?.total_count },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        name: 'GitHub API',
        status: 'timeout',
        message: `请求超时 (${responseTime}ms)`,
        responseTime,
      };
    }
    return {
      name: 'GitHub API',
      status: 'error',
      message: error.message || '连接失败',
      responseTime,
    };
  }
}

async function testHuggingFaceAPI(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const response = await axios.get('https://huggingface.co/api/models', {
      params: {
        limit: 1,
      },
      timeout: API_TIMEOUT,
    });
    const responseTime = Date.now() - startTime;
    return {
      name: 'HuggingFace API',
      status: 'success',
      message: '连接成功',
      responseTime,
      data: { status: response.status, hasData: !!response.data },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        name: 'HuggingFace API',
        status: 'timeout',
        message: `请求超时 (${responseTime}ms)`,
        responseTime,
      };
    }
    return {
      name: 'HuggingFace API',
      status: 'error',
      message: error.message || '连接失败',
      responseTime,
    };
  }
}

async function testBilibiliAPI(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const response = await axios.get('https://api.bilibili.com/x/web-interface/search/type', {
      params: {
        search_type: 'video',
        keyword: '机器人',
        page: 1,
        page_size: 1,
      },
      timeout: API_TIMEOUT,
    });
    const responseTime = Date.now() - startTime;
    return {
      name: 'Bilibili API',
      status: 'success',
      message: '连接成功',
      responseTime,
      data: { status: response.status, hasData: !!response.data },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        name: 'Bilibili API',
        status: 'timeout',
        message: `请求超时 (${responseTime}ms)`,
        responseTime,
      };
    }
    return {
      name: 'Bilibili API',
      status: 'error',
      message: error.message || '连接失败',
      responseTime,
    };
  }
}

async function testYoutubeAPI(): Promise<TestResult> {
  const startTime = Date.now();
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    return {
      name: 'YouTube API',
      status: 'error',
      message: '未配置 YOUTUBE_API_KEY 环境变量',
    };
  }
  
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: 'embodied AI',
        maxResults: 1,
        key: apiKey,
      },
      timeout: API_TIMEOUT,
    });
    const responseTime = Date.now() - startTime;
    return {
      name: 'YouTube API',
      status: 'success',
      message: '连接成功',
      responseTime,
      data: { status: response.status, hasData: !!response.data },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        name: 'YouTube API',
        status: 'timeout',
        message: `请求超时 (${responseTime}ms)`,
        responseTime,
      };
    }
    return {
      name: 'YouTube API',
      status: 'error',
      message: error.message || '连接失败',
      responseTime,
    };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('第三方API连通性测试');
  console.log('='.repeat(60));
  console.log('');

  // 测试所有API
  results.push(await testArxivAPI());
  results.push(await testGithubAPI());
  results.push(await testHuggingFaceAPI());
  results.push(await testBilibiliAPI());
  results.push(await testYoutubeAPI());

  // 打印结果
  console.log('');
  console.log('测试结果:');
  console.log('-'.repeat(60));

  let successCount = 0;
  let errorCount = 0;
  let timeoutCount = 0;

  results.forEach((result) => {
    const statusIcon = result.status === 'success' ? '✅' : result.status === 'timeout' ? '⏱️' : '❌';
    const timeInfo = result.responseTime ? ` (${result.responseTime}ms)` : '';
    
    console.log(`${statusIcon} ${result.name}: ${result.message}${timeInfo}`);
    
    if (result.status === 'success') successCount++;
    else if (result.status === 'timeout') timeoutCount++;
    else errorCount++;
  });

  console.log('-'.repeat(60));
  console.log(`总计: ${results.length} 个API`);
  console.log(`✅ 成功: ${successCount} 个`);
  console.log(`❌ 失败: ${errorCount} 个`);
  console.log(`⏱️ 超时: ${timeoutCount} 个`);
  console.log('='.repeat(60));

  // 详细信息
  console.log('');
  console.log('详细信息:');
  console.log('-'.repeat(60));
  results.forEach((result) => {
    console.log(`\n${result.name}:`);
    console.log(`  状态: ${result.status}`);
    console.log(`  消息: ${result.message}`);
    if (result.responseTime) {
      console.log(`  响应时间: ${result.responseTime}ms`);
    }
    if (result.data) {
      console.log(`  数据: ${JSON.stringify(result.data, null, 2)}`);
    }
  });
  console.log('='.repeat(60));
}

runTests().catch((error) => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
