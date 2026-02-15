/**
 * 测试 bilibili-api-wrapper
 * 验证新 API 的功能
 */

import { BilibiliAPI, BilibiliAPIError, Credential } from '../services/bilibili';
import { logger } from '../utils/logger';

const bilibiliAPI = BilibiliAPI.fromEnv({
  timeout: 15000,
  retries: 3,
  retryDelay: 2000,
});

async function testVideoAPI() {
  console.log('\n=== 测试 Video API ===\n');

  try {
    console.log('1. 测试搜索视频...');
    const searchResult = await bilibiliAPI.video.searchVideos('机器人', 1, 5);
    console.log(`✅ 搜索成功，找到 ${searchResult.result?.length || 0} 个视频`);
    if (searchResult.result && searchResult.result.length > 0) {
      console.log(`   示例: ${searchResult.result[0].title} (${searchResult.result[0].bvid})`);
    }
  } catch (error: any) {
    console.log(`❌ 搜索失败: ${error.message}`);
  }

  await delay(2000);

  try {
    console.log('\n2. 测试获取视频详情...');
    const videoInfo = await bilibiliAPI.video.getVideoInfo('BV1xx411c7mu');
    console.log(`✅ 获取视频详情成功: ${videoInfo.title}`);
    console.log(`   UP主: ${videoInfo.author}, 播放量: ${videoInfo.view}`);
  } catch (error: any) {
    console.log(`❌ 获取视频详情失败: ${error.message}`);
  }

  await delay(2000);

  try {
    console.log('\n3. 测试获取热门视频...');
    const hotVideos = await bilibiliAPI.video.getHotVideos(0);
    console.log(`✅ 获取热门视频成功，共 ${hotVideos.length} 个`);
    if (hotVideos.length > 0) {
      console.log(`   示例: ${hotVideos[0].title} (播放量: ${hotVideos[0].view})`);
    }
  } catch (error: any) {
    console.log(`❌ 获取热门视频失败: ${error.message}`);
  }

  await delay(2000);

  try {
    console.log('\n4. 测试获取科技区视频...');
    const techVideos = await bilibiliAPI.video.getTechVideos(10);
    console.log(`✅ 获取科技区视频成功，共 ${techVideos.length} 个`);
    if (techVideos.length > 0) {
      console.log(`   示例: ${techVideos[0].title} (播放量: ${techVideos[0].view})`);
    }
  } catch (error: any) {
    console.log(`❌ 获取科技区视频失败: ${error.message}`);
  }
}

async function testUserAPI() {
  console.log('\n=== 测试 User API ===\n');

  try {
    console.log('1. 测试获取UP主信息...');
    const userInfo = await bilibiliAPI.user.getUserInfo(1172054289);
    console.log(`✅ 获取UP主信息成功: ${userInfo.name} (粉丝: ${userInfo.fans})`);
  } catch (error: any) {
    console.log(`❌ 获取UP主信息失败: ${error.message}`);
  }

  await delay(2000);

  try {
    console.log('\n2. 测试获取UP主统计...');
    const userStat = await bilibiliAPI.user.getUserStat(1172054289);
    console.log(`✅ 获取UP主统计成功: 视频 ${userStat.video}, 播放 ${userStat.views}`);
  } catch (error: any) {
    console.log(`❌ 获取UP主统计失败: ${error.message}`);
  }

  await delay(2000);

  try {
    console.log('\n3. 测试获取UP主视频列表...');
    const userVideos = await bilibiliAPI.user.getUserVideos(1172054289, 1, 5);
    const videoCount = userVideos.list?.vlist?.length || 0;
    console.log(`✅ 获取UP主视频列表成功，共 ${videoCount} 个视频`);
    if (videoCount > 0) {
      console.log(`   示例: ${userVideos.list?.vlist?.[0].title}`);
    }
  } catch (error: any) {
    console.log(`❌ 获取UP主视频列表失败: ${error.message}`);
  }

  await delay(2000);

  try {
    console.log('\n4. 测试获取UP主完整信息...');
    const fullInfo = await bilibiliAPI.user.getUserFullInfo(1172054289);
    console.log(`✅ 获取UP主完整信息成功:`);
    console.log(`   名称: ${fullInfo.info.name}`);
    console.log(`   粉丝: ${fullInfo.info.fans}`);
    console.log(`   视频: ${fullInfo.stat.video}`);
    console.log(`   播放: ${fullInfo.stat.views}`);
  } catch (error: any) {
    console.log(`❌ 获取UP主完整信息失败: ${error.message}`);
  }
}

async function testErrorHandling() {
  console.log('\n=== 测试错误处理 ===\n');

  try {
    console.log('1. 测试无效视频ID...');
    await bilibiliAPI.video.getVideoInfo('BV1invalid');
    console.log(`❌ 应该抛出错误但没有`);
  } catch (error: any) {
    if (error instanceof BilibiliAPIError) {
      console.log(`✅ 正确捕获API错误: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`⚠️  捕获到错误但不是BilibiliAPIError: ${error.message}`);
    }
  }

  await delay(2000);

  try {
    console.log('\n2. 测试无效UP主ID...');
    await bilibiliAPI.user.getUserInfo(999999999);
    console.log(`❌ 应该抛出错误但没有`);
  } catch (error: any) {
    if (error instanceof BilibiliAPIError) {
      console.log(`✅ 正确捕获API错误: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`⚠️  捕获到错误但不是BilibiliAPIError: ${error.message}`);
    }
  }
}

async function testCredential() {
  console.log('\n=== 测试 Credential ===\n');

  console.log('1. 测试从环境变量创建 Credential...');
  const credential = Credential.fromEnv();
  console.log(`✅ Credential 创建成功`);
  console.log(`   有 SESSDATA: ${!!credential.getSessdata()}`);
  console.log(`   有 BILI_JCT: ${!!credential.getBiliJct()}`);
  console.log(`   有 BUVID3: ${!!credential.getBuvid3()}`);
  console.log(`   有完整凭证: ${credential.hasCredential()}`);

  console.log('\n2. 测试手动创建 Credential...');
  const manualCredential = new Credential({
    sessdata: 'test_sessdata',
    biliJct: 'test_bili_jct',
    buvid3: 'test_buvid3',
  });
  console.log(`✅ 手动 Credential 创建成功`);
  console.log(`   Cookie: ${manualCredential.toCookie()}`);
}

async function testSearchAllVideos() {
  console.log('\n=== 测试搜索所有视频 ===\n');

  try {
    console.log('1. 测试搜索多个页面的视频...');
    const allVideos = await bilibiliAPI.video.searchAllVideos('机器人', 20);
    console.log(`✅ 搜索成功，共 ${allVideos.length} 个视频`);
    if (allVideos.length > 0) {
      console.log(`   前3个视频:`);
      allVideos.slice(0, 3).forEach((v, i) => {
        console.log(`     ${i + 1}. ${v.title} (${v.bvid})`);
      });
    }
  } catch (error: any) {
    console.log(`❌ 搜索失败: ${error.message}`);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(60));
  console.log('bilibili-api-wrapper 测试');
  console.log('参考: https://github.com/nemo2011/bilibili-api');
  console.log('='.repeat(60));

  try {
    await testCredential();
    await testVideoAPI();
    await testUserAPI();
    await testErrorHandling();
    await testSearchAllVideos();

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
