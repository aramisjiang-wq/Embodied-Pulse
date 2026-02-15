/**
 * 测试UP主视频同步
 */

import { BilibiliAPI } from '../services/bilibili';
import { logger } from '../utils/logger';

const bilibiliAPI = BilibiliAPI.fromEnv({
  timeout: 15000,
  retries: 3,
  retryDelay: 2000,
});

async function testUploaderSync() {
  try {
    // 使用一个测试UP主MID
    const mid = 3546800709438203;
    
    console.log('========================================');
    console.log('测试UP主视频同步');
    console.log('========================================\n');
    console.log(`UP主MID: ${mid}\n`);

    // 获取UP主信息
    console.log('1. 获取UP主信息...');
    try {
      const userInfo = await bilibiliAPI.user.getUserInfo(mid);
      console.log(`   名称: ${userInfo.name}`);
      console.log(`   头像: ${userInfo.face}`);
      console.log(`   简介: ${userInfo.sign}`);
      console.log('   ✅ UP主信息获取成功\n');
    } catch (error: any) {
      console.log(`   ❌ UP主信息获取失败: ${error.message}\n`);
    }

    // 获取视频列表
    console.log('2. 获取视频列表（第1页）...');
    try {
      const result = await bilibiliAPI.user.getUserVideos(mid, 1, 50);
      console.log(`   总视频数: ${result.page?.count || 0}`);
      console.log(`   当前页视频数: ${result.list?.vlist?.length || 0}`);
      console.log('   ✅ 视频列表获取成功\n');

      if (result.list?.vlist && result.list.vlist.length > 0) {
        console.log('3. 前5个视频信息:');
        result.list.vlist.slice(0, 5).forEach((video: any, index: number) => {
          console.log(`   ${index + 1}. ${video.title}`);
          console.log(`      BVID: ${video.bvid}`);
          console.log(`      时长: ${video.length}`);
          console.log(`      播放量: ${video.play}`);
          console.log(`      发布时间: ${new Date(video.created * 1000).toLocaleString('zh-CN')}`);
          console.log('');
        });
      } else {
        console.log('   ⚠️  没有找到视频\n');
      }
    } catch (error: any) {
      console.log(`   ❌ 视频列表获取失败: ${error.message}\n`);
      console.log(`   错误详情:`, error);
    }

  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

testUploaderSync()
  .then(() => {
    console.log('\n测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('测试失败:', error);
    process.exit(1);
  });
