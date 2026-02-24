const http = require('http');

const API_BASE = 'http://localhost:3001/api/v1';

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`\n[HTTP] ${options.method} ${options.path}`);
        console.log(`[HTTP] Status: ${res.statusCode}`);
        console.log(`[HTTP] Headers:`, JSON.stringify(res.headers, null, 2));
        try {
          const json = JSON.parse(body);
          console.log(`[HTTP] Response:`, JSON.stringify(json, null, 2));
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          console.log(`[HTTP] Response (raw):`, body);
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAuth() {
  console.log('========================================');
  console.log('开始认证测试');
  console.log('========================================\n');

  // 1. 测试登录
  console.log('[步骤1] 测试登录 API...');
  const loginResult = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  }, {
    email: 'test@test.com',
    password: 'Test123456',
  });

  if (loginResult.status !== 200 || !loginResult.data.data?.token) {
    console.error('\n[错误] 登录失败！');
    console.error('状态码:', loginResult.status);
    console.error('响应:', loginResult.data);
    return;
  }

  const token = loginResult.data.data.token;
  console.log('\n[成功] 登录成功！');
  console.log('Token:', token.substring(0, 50) + '...');
  console.log('User:', JSON.stringify(loginResult.data.data.user, null, 2));

  // 2. 测试需要认证的 API - favorites
  console.log('\n[步骤2] 测试 /favorites API (需要认证)...');
  const favoritesResult = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/favorites?page=1&size=10',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (favoritesResult.status === 401) {
    console.error('\n[错误] Token 无效或已过期！');
  } else if (favoritesResult.status === 200) {
    console.log('\n[成功] /favorites API 正常工作！');
  } else {
    console.log('\n[警告] /favorites API 返回非预期状态:', favoritesResult.status);
  }

  // 3. 测试 /notifications/unread-count API
  console.log('\n[步骤3] 测试 /notifications/unread-count API (需要认证)...');
  const notificationsResult = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/notifications/unread-count',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (notificationsResult.status === 401) {
    console.error('\n[错误] Token 无效或已过期！');
  } else if (notificationsResult.status === 200) {
    console.log('\n[成功] /notifications/unread-count API 正常工作！');
  } else {
    console.log('\n[警告] /notifications/unread-count API 返回非预期状态:', notificationsResult.status);
  }

  // 4. 测试 /subscriptions API
  console.log('\n[步骤4] 测试 /subscriptions API (需要认证)...');
  const subscriptionsResult = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/subscriptions?page=1&size=10',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (subscriptionsResult.status === 401) {
    console.error('\n[错误] Token 无效或已过期！');
  } else if (subscriptionsResult.status === 200) {
    console.log('\n[成功] /subscriptions API 正常工作！');
  } else {
    console.log('\n[警告] /subscriptions API 返回非预期状态:', subscriptionsResult.status);
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

testAuth().catch(console.error);
