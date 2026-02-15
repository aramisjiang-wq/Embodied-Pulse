/**
 * 测试Bilibili API响应
 */

const { BilibiliAPI } = require('../services/bilibili');

async function testBilibiliAPI() {
  try {
    console.log('========================================');
    console.log('测试Bilibili API响应');
    console.log('========================================\n');

    const bilibiliAPI = BilibiliAPI.fromEnv({
      timeout: 15000,
      retries: 3,
      retryDelay: 2000,
    });

    // 测试UP主MID
    const mid = 3546800709438203;
    
    console.log(`测试UP主MID: ${mid}\n`);

    // 获取UP主信息
    console.log('1. 获取UP主信息...');
    try {
      const userInfo = await bilibiliAPI.user.getUserInfo(parseInt(mid, 10));
      console.log('✅ UP主信息获取成功');
      console.log(JSON.stringify(userInfo, null, 2));
    } catch (error: any) {
      console.log('❌ UP主信息获取失败:', error.message);
    }

    console.log('\n2. 获取视频列表（第1页）...');
    try {
      const result = await bilibiliAPI.user.getUserVideos(parseInt(mid, 10), 1, 50);
      console.log('✅ 视频列表获取成功');
      console.log('完整响应:', JSON.stringify(result, null, 2));
      console.log('\n视频数量:', result.list?.vlist?.length || 0);
      console.log('总视频数:', result.page?.count || 0);
      
      if (result.list?.vlist && result.list.vlist.length > 0) {
        console.log('\n前3个视频:');
        result.list.vlist.slice(0, 3).forEach((video: any, index: number) => {
          console.log(`  ${index + 1}. ${video.title}`);
          console.log(`     BVID: ${video.bvid}`);
          console.log(`     时长: ${video.length}`);
          console.log(`     播放量: ${video.play}`);
          console.log('');
        });
      }
    } catch (error: any) {
      console.log('❌ 视频列表获取失败:', error.message);
      console.log('错误详情:', error);
    }

  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

testBilibiliAPI()
  .then(() => {
    console.log('\n测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('测试失败:', error);
    process.exit(1);
  });
