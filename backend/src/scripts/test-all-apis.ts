/**
 * 测试所有数据 API
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api/v1';
let adminToken = '';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// API 测试结果
interface ApiTestResult {
  name: string;
  method: string;
  path: string;
  status: 'success' | 'error' | 'skipped';
  statusCode?: number;
  message?: string;
  responseTime?: number;
}

const results: ApiTestResult[] = [];

// 测试单个 API
async function testApi(
  name: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  path: string,
  options: {
    auth?: boolean;
    data?: any;
    params?: any;
  } = {}
): Promise<ApiTestResult> {
  const startTime = Date.now();
  const url = `${BASE_URL}${path}`;
  
  try {
    const config: any = {
      method,
      url,
      timeout: 10000,
    };

    if (options.auth && adminToken) {
      config.headers = {
        Authorization: `Bearer ${adminToken}`,
      };
    }

    if (options.data) {
      config.data = options.data;
    }

    if (options.params) {
      config.params = options.params;
    }

    const response = await axios(config);
    const responseTime = Date.now() - startTime;

    const result: ApiTestResult = {
      name,
      method,
      path,
      status: response.status >= 200 && response.status < 300 ? 'success' : 'error',
      statusCode: response.status,
      responseTime,
    };

    if (response.data?.code !== undefined) {
      if (response.data.code === 0) {
        result.status = 'success';
      } else {
        result.status = 'error';
        result.message = response.data.message || 'Unknown error';
      }
    }

    return result;
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const result: ApiTestResult = {
      name,
      method,
      path,
      status: 'error',
      statusCode: error.response?.status,
      message: error.response?.data?.message || error.message,
      responseTime,
    };
    return result;
  }
}

// 登录获取 Token
async function loginAdmin(): Promise<boolean> {
  log('\n🔐 登录管理员账号...', 'cyan');
  const result = await testApi('管理员登录', 'POST', '/auth/admin/login', {
    data: {
      email: 'admin@embodiedpulse.com',
      password: 'admin123',
    },
  });

  if (result.status === 'success') {
    // 从响应中提取 token（需要实际调用 API）
    try {
      const response = await axios.post(`${BASE_URL}/auth/admin/login`, {
        email: 'admin@embodiedpulse.com',
        password: 'admin123',
      });
      if (response.data?.code === 0 && response.data?.data?.token) {
        adminToken = response.data.data.token;
        log('✅ 登录成功', 'green');
        return true;
      }
    } catch (error) {
      log('❌ 登录失败', 'red');
      return false;
    }
  }
  return false;
}

// 测试所有 API
async function testAllApis() {
  log('\n========================================', 'cyan');
  log('开始测试所有数据 API', 'cyan');
  log('========================================\n', 'cyan');

  // 1. 登录
  const loggedIn = await loginAdmin();
  if (!loggedIn) {
    log('⚠️  无法登录，将跳过需要认证的 API', 'yellow');
  }

  // 2. 健康检查
  log('\n📊 健康检查 API', 'blue');
  // 健康检查在根路径，不在 /api/v1 下
  try {
    const response = await axios.get(`${BASE_URL.replace('/api/v1', '')}/health`);
    results.push({
      name: '健康检查',
      method: 'GET',
      path: '/health',
      status: response.status === 200 ? 'success' : 'error',
      statusCode: response.status,
      responseTime: 0,
    });
  } catch (error: any) {
    results.push({
      name: '健康检查',
      method: 'GET',
      path: '/health',
      status: 'error',
      statusCode: error.response?.status,
      message: error.message,
    });
  }

  // 3. 认证相关 API
  log('\n🔐 认证相关 API', 'blue');
  results.push(await testApi('用户注册', 'POST', '/auth/register', {
    data: {
      username: 'test_user_' + Date.now(),
      email: `test_${Date.now()}@example.com`,
      password: 'test123456',
    },
  }));
  results.push(await testApi('获取当前用户', 'GET', '/auth/me', { auth: true }));

  // 4. Feed API
  log('\n📰 Feed API', 'blue');
  results.push(await testApi('获取Feed列表', 'GET', '/feed', { params: { page: 1, size: 10 } }));

  // 5. 论文 API
  log('\n📄 论文 API', 'blue');
  results.push(await testApi('获取论文列表', 'GET', '/papers', { params: { page: 1, size: 10 } }));
  results.push(await testApi('获取论文详情', 'GET', '/papers/1', {}));

  // 6. 视频 API
  log('\n🎬 视频 API', 'blue');
  results.push(await testApi('获取视频列表', 'GET', '/videos', { params: { page: 1, size: 10 } }));

  // 7. 仓库 API
  log('\n💻 仓库 API', 'blue');
  results.push(await testApi('获取仓库列表', 'GET', '/repos', { params: { page: 1, size: 10 } }));

  // 8. 岗位 API
  log('\n💼 岗位 API', 'blue');
  results.push(await testApi('获取岗位列表', 'GET', '/jobs', { params: { page: 1, size: 10 } }));

  // 9. HuggingFace API
  log('\n🤗 HuggingFace API', 'blue');
  results.push(await testApi('获取HuggingFace列表', 'GET', '/huggingface', { params: { page: 1, size: 10 } }));

  // 10. 新闻 API
  log('\n📰 新闻 API', 'blue');
  results.push(await testApi('获取新闻列表', 'GET', '/news', { params: { page: 1, size: 10 } }));

  // 11. 帖子 API
  log('\n💬 帖子 API', 'blue');
  results.push(await testApi('获取帖子列表', 'GET', '/posts', { params: { page: 1, size: 10 } }));

  // 12. Banner API
  log('\n🎨 Banner API', 'blue');
  results.push(await testApi('获取Banner列表', 'GET', '/banners'));
  results.push(await testApi('获取活跃Banner', 'GET', '/banners/active'));

  // 13. 搜索 API
  log('\n🔍 搜索 API', 'blue');
  results.push(await testApi('搜索', 'GET', '/search', { params: { q: 'AI', type: 'all' } }));

  // 14. 统计数据 API
  log('\n📊 统计数据 API', 'blue');
  results.push(await testApi('获取内容统计', 'GET', '/stats/content'));

  // 15. 公告 API
  log('\n📢 公告 API', 'blue');
  results.push(await testApi('获取公告列表', 'GET', '/announcements'));
  results.push(await testApi('获取活跃公告', 'GET', '/announcements/active'));

  // 16. 首页模块 API
  log('\n🏠 首页模块 API', 'blue');
  results.push(await testApi('获取首页模块', 'GET', '/home-modules'));

  // 17. 发现 API
  log('\n🔎 发现 API', 'blue');
  results.push(await testApi('获取发现内容', 'GET', '/discovery'));

  // 18. 管理端 API（需要认证）
  if (loggedIn) {
    log('\n👨‍💼 管理端 API', 'blue');
    results.push(await testApi('获取管理员信息', 'GET', '/admin/me', { auth: true }));
    results.push(await testApi('获取用户列表', 'GET', '/admin/users', { auth: true, params: { page: 1, size: 10 } }));
    results.push(await testApi('获取统计数据', 'GET', '/admin/stats', { auth: true }));
    results.push(await testApi('获取管理员列表', 'GET', '/admin/admins', { auth: true }));
    results.push(await testApi('获取订阅列表', 'GET', '/admin/subscriptions', { auth: true }));
    results.push(await testApi('获取数据源列表', 'GET', '/admin/data-sources', { auth: true }));
    results.push(await testApi('获取Bilibili UP主列表', 'GET', '/admin/bilibili-uploaders', { auth: true }));
    results.push(await testApi('获取同步队列状态', 'GET', '/admin/sync-queue/status', { auth: true }));
    results.push(await testApi('获取定时任务状态', 'GET', '/admin/scheduler/status', { auth: true }));
    results.push(await testApi('获取Cookie状态', 'GET', '/admin/cookies/status', { auth: true }));
  }

  // 19. 用户 API（需要认证）
  if (loggedIn) {
    log('\n👤 用户 API', 'blue');
    results.push(await testApi('获取用户资料', 'GET', '/user/profile', { auth: true }));
    results.push(await testApi('获取积分记录', 'GET', '/user/points', { auth: true }));
  }

  // 20. 订阅 API（需要认证）
  if (loggedIn) {
    log('\n📌 订阅 API', 'blue');
    results.push(await testApi('获取用户订阅', 'GET', '/subscriptions', { auth: true }));
    results.push(await testApi('获取订阅内容', 'GET', '/subscriptions/content', { auth: true }));
  }

  // 21. 收藏 API（需要认证）
  if (loggedIn) {
    log('\n⭐ 收藏 API', 'blue');
    results.push(await testApi('获取收藏列表', 'GET', '/favorites', { auth: true }));
  }

  // 22. 任务 API（需要认证）
  if (loggedIn) {
    log('\n✅ 任务 API', 'blue');
    results.push(await testApi('获取每日任务', 'GET', '/tasks/daily', { auth: true }));
  }

  // 打印结果
  printResults();
}

// 打印测试结果
function printResults() {
  log('\n========================================', 'cyan');
  log('测试结果汇总', 'cyan');
  log('========================================\n', 'cyan');

  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  const skippedCount = results.filter((r) => r.status === 'skipped').length;

  log(`总计: ${results.length} 个 API`, 'blue');
  log(`✅ 成功: ${successCount}`, 'green');
  log(`❌ 失败: ${errorCount}`, 'red');
  log(`⏭️  跳过: ${skippedCount}`, 'yellow');

  log('\n详细结果:', 'blue');
  log('----------------------------------------', 'cyan');

  results.forEach((result) => {
    const statusIcon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏭️';
    const statusColor = result.status === 'success' ? 'green' : result.status === 'error' ? 'red' : 'yellow';
    
    log(`${statusIcon} [${result.method}] ${result.name}`, statusColor);
    log(`   路径: ${result.path}`, 'reset');
    if (result.statusCode) {
      log(`   状态码: ${result.statusCode}`, 'reset');
    }
    if (result.responseTime) {
      log(`   响应时间: ${result.responseTime}ms`, 'reset');
    }
    if (result.message) {
      log(`   消息: ${result.message}`, 'reset');
    }
    log('', 'reset');
  });

  // 失败的 API 列表
  const failedApis = results.filter((r) => r.status === 'error');
  if (failedApis.length > 0) {
    log('\n❌ 失败的 API:', 'red');
    failedApis.forEach((api) => {
      log(`   - [${api.method}] ${api.name} (${api.path})`, 'red');
      if (api.message) {
        log(`     错误: ${api.message}`, 'red');
      }
    });
  }

  log('\n========================================', 'cyan');
  log('测试完成', 'cyan');
  log('========================================\n', 'cyan');
}

// 运行测试
testAllApis()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ 测试过程出错: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
