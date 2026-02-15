import { syncBilibiliVideos } from '../services/sync/bilibili.sync';

async function main() {
  try {
    console.log('开始同步B站视频数据...\n');
    
    const result = await syncBilibiliVideos('具身智能 机器人 深度学习', 20);
    
    console.log('\n同步结果:');
    console.log(`成功: ${result.synced}`);
    console.log(`错误: ${result.errors}`);
    console.log(`总计: ${result.total}`);
  } catch (error: any) {
    console.error('同步失败:', error.message);
  }
}

main();
