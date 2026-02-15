/**
 * 创建首页底部运营模块示例
 * 使用方法: node scripts/create-bottom-module.js
 */

const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // 需要先登录获取token

async function createBottomModule() {
  const moduleData = {
    name: 'bottom_promotion_20260122',
    title: '🎯 加入具身智能社区',
    description: '与全球具身智能研究者、工程师和爱好者一起探索AI的未来',
    config: JSON.stringify({
      position: 'bottom',
      moduleType: 'promotion',
      content: 'Embodied Pulse 是专为具身智能领域打造的信息聚合平台。我们聚合了最新的论文、代码、模型、视频和求职信息，帮助您快速发现和获取具身智能领域的最新资源。',
      linkUrl: '/community',
      buttonText: '立即加入社区 →',
      backgroundColor: '#f0f9ff',
      textColor: '#1e40af'
    }),
    isActive: true,
    order: 0
  };

  try {
    const response = await fetch(`${API_URL}/api/v1/home-modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify(moduleData)
    });

    const result = await response.json();
    
    if (result.code === 0) {
      console.log('✅ 底部模块创建成功！');
      console.log('模块ID:', result.data.id);
      console.log('模块名称:', result.data.name);
      console.log('模块标题:', result.data.title);
    } else {
      console.error('❌ 创建失败:', result.message);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    console.log('\n💡 提示:');
    console.log('1. 确保后端服务已启动 (http://localhost:3001)');
    console.log('2. 需要管理员Token，可以通过管理端登录获取');
    console.log('3. 或者直接在管理端页面手动创建模块');
  }
}

createBottomModule();
