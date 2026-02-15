/**
 * 检查数据库中的视频
 */

import dotenv from 'dotenv';
import userPrisma from '../config/database.user';

dotenv.config();

async function main() {
  console.log('检查数据库中的视频');
  console.log('==================\n');

  const videos = await userPrisma.video.findMany({
    orderBy: { publishedDate: 'desc' },
    take: 20,
  });

  console.log(`总共找到 ${videos.length} 个视频\n`);

  const uploaderGroups: Record<string, any[]> = {};
  videos.forEach(v => {
    const uploaderId = v.uploaderId || 'unknown';
    if (!uploaderGroups[uploaderId]) {
      uploaderGroups[uploaderId] = [];
    }
    uploaderGroups[uploaderId].push(v);
  });

  console.log('按UP主分组:');
  Object.entries(uploaderGroups).forEach(([uploaderId, vids]) => {
    console.log(`\nUP主ID: ${uploaderId} (${vids.length} 个视频)`);
    vids.forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.bvid || v.videoId} - ${v.title}`);
      console.log(`     发布时间: ${v.publishedDate?.toLocaleString()}`);
      console.log(`     播放量: ${v.playCount || 0}`);
    });
  });
}

main().catch(console.error);
