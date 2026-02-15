import { BilibiliAPI } from '../services/bilibili';

async function main() {
  try {
    console.log('测试B站API...\n');
    
    const bilibiliAPI = BilibiliAPI.fromEnv({
      timeout: 15000,
      retries: 3,
      retryDelay: 2000,
    });

    console.log('搜索视频...');
    const videos = await bilibiliAPI.video.searchAllVideos('具身智能', 5);
    
    console.log(`\n获取到 ${videos.length} 个视频\n`);
    
    videos.forEach((video, index) => {
      console.log(`\n${index + 1}. ${video.title}`);
      console.log(`   bvid: ${video.bvid}`);
      console.log(`   author: ${video.author}`);
      console.log(`   mid: ${video.mid}`);
      console.log(`   duration: ${video.duration}`);
      console.log(`   view: ${video.view}`);
      console.log(`   like: ${video.like}`);
      console.log(`   pubdate: ${video.pubdate}`);
      console.log(`   pic: ${video.pic}`);
      console.log(`   typename: ${video.typename}`);
      console.log(`   stat:`, video.stat);
    });
  } catch (error: any) {
    console.error('测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

main();
