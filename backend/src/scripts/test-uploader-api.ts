/**
 * 测试 Bilibili UP主管理功能
 * 验证 bilibili-api-wrapper 的 UP主相关 API
 */

import { BilibiliAPI } from '../services/bilibili';
import { logger } from '../utils/logger';

const bilibiliAPI = BilibiliAPI.fromEnv({
  timeout: 15000,
  retries: 3,
  retryDelay: 2000,
});

async function testGetUploaderInfo() {
  console.log('\n=== 测试获取UP主信息 ===\n');

  const testMids = [
    '1172054289', // 逐际动力
    '123456', // 测试ID
  ];

  for (const mid of testMids) {
    try {
      console.log(`1. 测试获取UP主信息: ${mid}`);
      const userInfo = await bilibiliAPI.user.getUserInfo(parseInt(mid, 10));
      console.log(`✅ 获取UP主信息成功:`);
      console.log(`   名称: ${userInfo.name}`);
      console.log(`   粉丝: ${userInfo.fans}`);
      console.log(`   等级: ${userInfo.level}`);
      console.log(`   签名: ${userInfo.sign}`);
      console.log(`   头像: ${userInfo.face ? '有' : '无'}`);
    } catch (error: any) {
      console.log(`❌ 获取UP主信息失败 (${mid}): ${error.message}`);
    }

    await delay(2000);
  }
}

async function testGetUserVideos() {
  console.log('\n=== 测试获取UP主视频列表 ===\n');

  const testMid = '1172054289';

  try {
    console.log(`1. 测试获取UP主视频列表: ${testMid}`);
    const userVideos = await bilibiliAPI.user.getUserVideos(parseInt(testMid, 10), 1, 10);
    const videoCount = userVideos.list?.vlist?.length || 0;
    const totalCount = userVideos.page?.count || 0;
    
    console.log(`✅ 获取UP主视频列表成功:`);
    console.log(`   本页视频数: ${videoCount}`);
    console.log(`   总视频数: ${totalCount}`);
    
    if (videoCount > 0) {
      console.log(`   前3个视频:`);
      userVideos.list?.vlist?.slice(0, 3).forEach((v, i) => {
        console.log(`     ${i + 1}. ${v.title}`);
        console.log(`        BV号: ${v.bvid}`);
        console.log(`        时长: ${v.length}`);
        console.log(`        播放: ${v.play}`);
      });
    }
  } catch (error: any) {
    console.log(`❌ 获取UP主视频列表失败 (${testMid}): ${error.message}`);
  }
}

async function testGetUserFullInfo() {
  console.log('\n=== 测试获取UP主完整信息 ===\n');

  const testMid = '1172054289';

  try {
    console.log(`1. 测试获取UP主完整信息: ${testMid}`);
    const fullInfo = await bilibiliAPI.user.getUserFullInfo(parseInt(testMid, 10));
    
    console.log(`✅ 获取UP主完整信息成功:`);
    console.log(`   基本信息:`);
    console.log(`     名称: ${fullInfo.info.name}`);
    console.log(`     粉丝: ${fullInfo.info.fans}`);
    console.log(`     等级: ${fullInfo.info.level}`);
    console.log(`     签名: ${fullInfo.info.sign}`);
    console.log(`   统计信息:`);
    console.log(`     视频: ${fullInfo.stat.video}`);
    console.log(`     播放: ${fullInfo.stat.views}`);
    console.log(`     获赞: ${fullInfo.stat.likes}`);
  } catch (error: any) {
    console.log(`❌ 获取UP主完整信息失败 (${testMid}): ${error.message}`);
  }
}

async function testGetAllUserVideos() {
  console.log('\n=== 测试获取UP主所有视频 ===\n');

  const testMid = '1172054289';

  try {
    console.log(`1. 测试获取UP主所有视频: ${testMid}, maxResults=20`);
    const allVideos = await bilibiliAPI.user.getAllUserVideos(parseInt(testMid, 10), 20);
    
    console.log(`✅ 获取UP主所有视频成功，共 ${allVideos.length} 个视频`);
    
    if (allVideos.length > 0) {
      console.log(`   前5个视频:`);
      allVideos.slice(0, 5).forEach((v, i) => {
        console.log(`     ${i + 1}. ${v.title}`);
        console.log(`        BV号: ${v.bvid}`);
        console.log(`        时长: ${v.length}`);
        console.log(`        播放: ${v.play}`);
      });
    }
  } catch (error: any) {
    console.log(`❌ 获取UP主所有视频失败 (${testMid}): ${error.message}`);
  }
}

async function testErrorHandling() {
  console.log('\n=== 测试错误处理 ===\n');

  try {
    console.log('1. 测试无效UP主ID...');
    await bilibiliAPI.user.getUserInfo(999999999);
    console.log(`❌ 应该抛出错误但没有`);
  } catch (error: any) {
    console.log(`✅ 正确捕获错误: ${error.message}`);
  }

  await delay(2000);

  try {
    console.log('\n2. 测试获取无效UP主的视频...');
    await bilibiliAPI.user.getUserVideos(999999999, 1, 10);
    console.log(`❌ 应该抛出错误但没有`);
  } catch (error: any) {
    console.log(`✅ 正确捕获错误: ${error.message}`);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(60));
  console.log('Bilibili UP主管理功能测试');
  console.log('参考: https://github.com/nemo2011/bilibili-api');
  console.log('='.repeat(60));

  try {
    await testGetUploaderInfo();
    await testGetUserVideos();
    await testGetUserFullInfo();
    await testGetAllUserVideos();
    await testErrorHandling();

    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有测试完成！');
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ 测试执行失败:', error.message);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

main();
