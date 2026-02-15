/**
 * 诊断UP主同步问题
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

async function diagnoseUploaderSync() {
  try {
    console.log('========================================');
    console.log('UP主同步诊断');
    console.log('========================================\n');

    // 获取所有UP主
    const uploaders = await userPrisma.bilibili_uploaders.findMany({
      orderBy: { created_at: 'desc' },
    });

    console.log(`找到 ${uploaders.length} 个UP主\n`);

    for (const uploader of uploaders) {
      console.log('----------------------------------------');
      console.log(`UP主: ${uploader.name}`);
      console.log(`MID: ${uploader.mid}`);
      console.log(`激活状态: ${uploader.is_active ? '是' : '否'}`);
      console.log(`视频数量: ${uploader.video_count}`);
      console.log(`最后同步: ${uploader.last_sync_at || '从未同步'}`);
      console.log(`创建时间: ${uploader.created_at}`);
      console.log(`更新时间: ${uploader.updated_at}`);

      // 检查数据库中实际有多少视频
      const videoCount = await userPrisma.video.count({
        where: {
          platform: 'bilibili',
          uploaderId: uploader.mid,
        },
      });

      console.log(`数据库中实际视频数: ${videoCount}`);
      
      if (uploader.video_count !== videoCount) {
        console.log(`⚠️  数据不一致！video_count=${uploader.video_count}, 实际=${videoCount}`);
      }

      console.log('----------------------------------------\n');
    }

    // 检查最近的视频
    console.log('========================================');
    console.log('最近的Bilibili视频');
    console.log('========================================\n');

    const recentVideos = await userPrisma.video.findMany({
      where: {
        platform: 'bilibili',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    console.log(`找到 ${recentVideos.length} 个最近的视频\n`);

    for (const video of recentVideos) {
      console.log(`- ${video.title}`);
      console.log(`  BVID: ${video.bvid}`);
      console.log(`  UP主: ${video.uploader} (${video.uploaderId})`);
      console.log(`  创建时间: ${video.createdAt}`);
      console.log(`  发布时间: ${video.publishedDate}`);
      console.log('');
    }

  } catch (error) {
    console.error('诊断失败:', error);
    process.exit(1);
  }
}

diagnoseUploaderSync()
  .then(() => {
    console.log('\n诊断完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('诊断失败:', error);
    process.exit(1);
  });
