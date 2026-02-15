/**
 * 第三方API连通性测试脚本
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TEST_RESULTS = {
  arxiv: { status: 'pending', message: '', responseTime: 0 },
  github: { status: 'pending', message: '', responseTime: 0 },
  bilibili: { status: 'pending', message: '', responseTime: 0 },
  youtube: { status: 'pending', message: '', responseTime: 0 },
  huggingface: { status: 'pending', message: '', responseTime: 0 },
};

async function testArxivAPI() {
  const startTime = Date.now();
  try {
    const url = 'http://export.arxiv.org/api/query?search_query=cat:cs.AI&start=0&max_results=1';
    const response = await axios.get(url, { timeout: 10000 });
    const responseTime = Date.now() - startTime;
    
    TEST_RESULTS.arxiv = {
      status: 'success',
      message: `成功获取数据，状态码: ${response.status}`,
      responseTime,
    };
    console.log('✅ arXiv API 测试通过');
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    TEST_RESULTS.arxiv = {
      status: 'failed',
      message: error.message || '连接失败',
      responseTime,
    };
    console.log('❌ arXiv API 测试失败:', error.message);
  }
}

async function testGithubAPI() {
  const startTime = Date.now();
  try {
    const url = 'https://api.github.com/search/repositories?q=embodied-ai&sort=stars&order=desc&per_page=1';
    const headers = process.env.GITHUB_TOKEN ? {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
    } : {};
    
    const response = await axios.get(url, { headers, timeout: 10000 });
    const responseTime = Date.now() - startTime;
    
    TEST_RESULTS.github = {
      status: 'success',
      message: `成功获取数据，状态码: ${response.status}`,
      responseTime,
    };
    console.log('✅ GitHub API 测试通过');
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    TEST_RESULTS.github = {
      status: 'failed',
      message: error.message || '连接失败',
      responseTime,
    };
    console.log('❌ GitHub API 测试失败:', error.message);
  }
}

async function testBilibiliAPI() {
  const startTime = Date.now();
  try {
    const url = 'https://api.bilibili.com/x/web-interface/search/all?keyword=机器人&page=1&pagesize=1';
    const response = await axios.get(url, { timeout: 10000 });
    const responseTime = Date.now() - startTime;
    
    TEST_RESULTS.bilibili = {
      status: 'success',
      message: `成功获取数据，状态码: ${response.status}`,
      responseTime,
    };
    console.log('✅ Bilibili API 测试通过');
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    TEST_RESULTS.bilibili = {
      status: 'failed',
      message: error.message || '连接失败',
      responseTime,
    };
    console.log('❌ Bilibili API 测试失败:', error.message);
  }
}

async function testYoutubeAPI() {
  const startTime = Date.now();
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY 未配置');
    }
    
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=embodied+AI&type=video&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`;
    const response = await axios.get(url, { timeout: 10000 });
    const responseTime = Date.now() - startTime;
    
    TEST_RESULTS.youtube = {
      status: 'success',
      message: `成功获取数据，状态码: ${response.status}`,
      responseTime,
    };
    console.log('✅ YouTube API 测试通过');
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    TEST_RESULTS.youtube = {
      status: 'failed',
      message: error.message || '连接失败',
      responseTime,
    };
    console.log('❌ YouTube API 测试失败:', error.message);
  }
}

async function testHuggingFaceAPI() {
  const startTime = Date.now();
  try {
    const url = 'https://huggingface.co/api/models?limit=1&sort=downloads&direction=-1';
    const response = await axios.get(url, { timeout: 10000 });
    const responseTime = Date.now() - startTime;
    
    TEST_RESULTS.huggingface = {
      status: 'success',
      message: `成功获取数据，状态码: ${response.status}`,
      responseTime,
    };
    console.log('✅ HuggingFace API 测试通过');
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    TEST_RESULTS.huggingface = {
      status: 'failed',
      message: error.message || '连接失败',
      responseTime,
    };
    console.log('❌ HuggingFace API 测试失败:', error.message);
  }
}

async function runAllTests() {
  console.log('\n========== 开始第三方API连通性测试 ==========\n');
  
  await Promise.all([
    testArxivAPI(),
    testGithubAPI(),
    testBilibiliAPI(),
    testYoutubeAPI(),
    testHuggingFaceAPI(),
  ]);
  
  console.log('\n========== 测试结果汇总 ==========\n');
  
  const table = [
    ['API', '状态', '响应时间', '消息'],
    ['arXiv', TEST_RESULTS.arxiv.status, `${TEST_RESULTS.arxiv.responseTime}ms`, TEST_RESULTS.arxiv.message],
    ['GitHub', TEST_RESULTS.github.status, `${TEST_RESULTS.github.responseTime}ms`, TEST_RESULTS.github.message],
    ['Bilibili', TEST_RESULTS.bilibili.status, `${TEST_RESULTS.bilibili.responseTime}ms`, TEST_RESULTS.bilibili.message],
    ['YouTube', TEST_RESULTS.youtube.status, `${TEST_RESULTS.youtube.responseTime}ms`, TEST_RESULTS.youtube.message],
    ['HuggingFace', TEST_RESULTS.huggingface.status, `${TEST_RESULTS.huggingface.responseTime}ms`, TEST_RESULTS.huggingface.message],
  ];
  
  table.forEach(row => {
    console.log(row.map(cell => cell.padEnd(20)).join(' | '));
  });
  
  const successCount = Object.values(TEST_RESULTS).filter(r => r.status === 'success').length;
  const totalCount = Object.keys(TEST_RESULTS).length;
  
  console.log(`\n总计: ${successCount}/${totalCount} 个API测试通过`);
  
  if (successCount === totalCount) {
    console.log('✅ 所有API测试通过！');
  } else {
    console.log('⚠️  部分API测试失败，请检查网络连接或API配置');
  }
}

runAllTests().catch(console.error);