const puppeteer = require('puppeteer');

async function testFrontendAuth() {
  console.log('========================================');
  console.log('前端认证自动化测试');
  console.log('========================================\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  // 收集控制台日志
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });
    console.log(`[浏览器 ${msg.type()}] ${text}`);
  });

  // 收集网络请求
  const requests = [];
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      requests.push({ method: req.method(), url: req.url() });
      console.log(`[请求] ${req.method()} ${req.url()}`);
    }
  });

  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log(`[响应] ${res.status()} ${res.url()}`);
    }
  });

  try {
    // 1. 打开登录页面
    console.log('\n[步骤1] 打开登录页面...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);

    // 2. 检查 localStorage 初始状态
    console.log('\n[步骤2] 检查 localStorage 初始状态...');
    const initialStorage = await page.evaluate(() => {
      return {
        user_token: localStorage.getItem('user_token'),
        admin_token: localStorage.getItem('admin_token'),
        user_user: localStorage.getItem('user_user'),
      };
    });
    console.log('localStorage:', initialStorage);

    // 3. 填写登录表单
    console.log('\n[步骤3] 填写登录表单...');
    await page.type('input[type="email"]', 'test@test.com');
    await page.type('input[type="password"]', 'Test123456');
    console.log('已填写邮箱和密码');

    // 4. 点击登录按钮
    console.log('\n[步骤4] 点击登录按钮...');
    await page.click('button[type="submit"]');
    
    // 5. 等待并观察
    console.log('\n[步骤5] 等待登录响应...');
    await page.waitForTimeout(5000);

    // 6. 检查当前 URL
    const currentUrl = page.url();
    console.log('\n[步骤6] 当前 URL:', currentUrl);

    // 7. 检查 localStorage 登录后状态
    console.log('\n[步骤7] 检查 localStorage 登录后状态...');
    const afterStorage = await page.evaluate(() => {
      return {
        user_token: localStorage.getItem('user_token')?.substring(0, 50) + '...',
        admin_token: localStorage.getItem('admin_token'),
        user_user: localStorage.getItem('user_user'),
      };
    });
    console.log('localStorage:', afterStorage);

    // 8. 检查页面内容
    console.log('\n[步骤8] 检查页面内容...');
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasUserMenu: !!document.querySelector('[class*="user"]'),
        bodyText: document.body.innerText.substring(0, 500),
      };
    });
    console.log('页面内容:', pageContent);

    // 9. 总结
    console.log('\n========================================');
    console.log('测试结果');
    console.log('========================================');
    
    if (currentUrl.includes('/login')) {
      console.log('❌ 仍然在登录页面 - 登录失败或被重定向回来');
    } else if (currentUrl === 'http://localhost:3000/' || currentUrl === 'http://localhost:3000') {
      console.log('✅ 成功跳转到首页');
      
      if (afterStorage.user_token && !afterStorage.user_token.includes('null')) {
        console.log('✅ Token 已保存到 localStorage');
      } else {
        console.log('❌ Token 未保存到 localStorage');
      }
    } else {
      console.log('⚠️ 跳转到其他页面:', currentUrl);
    }

    console.log('\n收集到的日志数量:', logs.length);
    console.log('收集到的请求数量:', requests.length);

    // 打印所有 API 请求
    console.log('\nAPI 请求列表:');
    requests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.method} ${req.url}`);
    });

    // 打印关键日志
    console.log('\n关键日志:');
    logs.filter(l => l.text.includes('[') || l.text.includes('API') || l.text.includes('Auth')).forEach(l => {
      console.log(`  [${l.type}] ${l.text}`);
    });

  } catch (error) {
    console.error('测试出错:', error);
  }

  // 保持浏览器打开以便观察
  console.log('\n浏览器保持打开状态，按 Ctrl+C 关闭...');
  // await browser.close();
}

testFrontendAuth().catch(console.error);
