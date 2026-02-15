import userPrisma from '../config/database.user';

async function main() {
  try {
    console.log('检查视频数据...\n');

    const videos = await userPrisma.video.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    console.log(`总视频数: ${videos.length}\n`);

    if (videos.length > 0) {
      console.log('最近的视频:');
      videos.forEach((video, index) => {
        console.log(`\n${index + 1}. ${video.title}`);
        console.log(`   平台: ${video.platform}`);
        console.log(`   UP主: ${video.uploader}`);
        console.log(`   播放量: ${video.playCount || video.viewCount || 0}`);
        console.log(`   时长: ${video.duration ? video.duration + '秒' : '无'}`);
        console.log(`   发布日期: ${video.publishedDate || '无'}`);
        console.log(`   bvid: ${video.bvid || '无'}`);
        console.log(`   videoId: ${video.videoId || '无'}`);
      });
    } else {
      console.log('数据库中没有视频数据！');
    }

    console.log('\n数据库表结构:');
    console.log('- Video表 (user数据库): 存储视频基本信息');
    console.log('- 包括字段: title, platform, uploader, playCount, duration, publishedDate, bvid, videoId等');
  } catch (error) {
    console.error('检查失败:', error);
  }
}

main();
