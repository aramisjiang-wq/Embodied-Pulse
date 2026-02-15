/**
 * 测试单个UP主同步
 */

import dotenv from 'dotenv';
import { BilibiliAPI } from '../services/bilibili';
import { getUploaderVideos } from '../services/bilibili-uploader.service';
import { createVideo } from '../services/video.service';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

dotenv.config();

const bilibiliAPI = BilibiliAPI.fromEnv({
  timeout: 15000,
  retries: 3,
  retryDelay: 2000,
});

async function testSingleUploader(mid: string) {
  console.log(`\n========== 测试UP主: ${mid} ==========`);

  try {
    // 1. 获取UP主信息
    console.log('\n1. 获取UP主信息...');
    const userInfo = await bilibiliAPI.user.getUserInfo(parseInt(mid, 10));
    console.log(`✓ UP主名称: ${userInfo.name}`);
    console.log(`✓ UP主头像: ${userInfo.face}`);
    console.log(`✓ UP主简介: ${userInfo.sign}`);

    // 等待2秒避免限流
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. 获取视频列表
    console.log('\n2. 获取视频列表...');
    const { videos, total } = await getUploaderVideos(mid, 1, 30);
    console.log(`✓ 视频总数: ${total}`);
    console.log(`✓ 当前页视频数: ${videos.length}`);

    if (videos.length > 0) {
      console.log('\n前3个视频:');
      videos.slice(0, 3).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.bvid} - ${v.title}`);
        console.log(`     时长: ${v.duration}秒, 发布时间: ${new Date(v.pubdate * 1000).toLocaleString()}`);
        console.log(`     播放量: ${v.stat.view}`);
      });

      // 3. 尝试创建视频
      console.log('\n3. 尝试创建视频...');
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < Math.min(videos.length, 5); i++) {
        const video = videos[i];
        try {
          const created = await createVideo({
            platform: 'bilibili',
            videoId: video.bvid,
            bvid: video.bvid,
            title: video.title,
            description: video.description,
            coverUrl: video.pic,
            duration: video.duration,
            uploader: userInfo.name,
            uploaderId: mid,
            publishedDate: new Date(video.pubdate * 1000),
            viewCount: video.stat.view,
            playCount: video.stat.view,
          });
          console.log(`✓ 视频 ${video.bvid} 创建/更新成功`);
          successCount++;
        } catch (error: any) {
          console.log(`✗ 视频 ${video.bvid} 创建失败: ${error.message}`);
          errorCount++;
        }

        // 每个视频之间等待1秒
        if (i < Math.min(videos.length, 5) - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`\n创建结果: 成功 ${successCount} 个, 失败 ${errorCount} 个`);

      // 4. 检查数据库中的视频
      console.log('\n4. 检查数据库中的视频...');
      const dbVideos = await userPrisma.video.findMany({
        where: { uploaderId: mid },
        orderBy: { publishedDate: 'desc' },
        take: 5,
      });
      console.log(`✓ 数据库中该UP主的视频数: ${dbVideos.length}`);
      if (dbVideos.length > 0) {
        console.log('最新的5个视频:');
        dbVideos.forEach((v, i) => {
          console.log(`  ${i + 1}. ${v.bvid || v.videoId} - ${v.title}`);
          console.log(`     发布时间: ${v.publishedDate?.toLocaleString()}`);
        });
      }
    } else {
      console.log('⚠ 该UP主没有视频或API返回空列表');
    }

    console.log(`\n========== UP主 ${mid} 测试完成 ==========\n`);
    return true;
  } catch (error: any) {
    console.error(`\n✗ UP主 ${mid} 测试失败:`, error.message);
    console.error('错误详情:', error);
    return false;
  }
}

async function main() {
  console.log('Bilibili 单个UP主视频同步测试');
  console.log('================================\n');

  const mid = process.argv[2];

  if (!mid) {
    console.error('请提供UP主ID');
    console.log('用法: npx tsx src/scripts/test-single-uploader.ts <mid>');
    process.exit(1);
  }

  await testSingleUploader(mid);
}

main().catch(console.error);
