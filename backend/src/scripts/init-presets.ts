/**
 * 初始化预置订阅配置
 * 创建管理员的预置订阅（论文关键词、公共UP主等）
 */

import { PrismaClient } from '@prisma/client';
import {
  PAPER_PRESET_KEYWORDS,
  PAPER_PRESET_CATEGORIES,
  PAPER_PRESET_AUTHORS,
  VIDEO_PRESET_UPLOADERS,
} from '../config/subscription-presets';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 开始初始化预置订阅配置...\n');
  
  try {
    // 查找管理员用户
    const admin = await prisma.user.findFirst({
      where: { email: { contains: 'admin' } },
    });
    
    if (!admin) {
      console.error('❌ 未找到管理员用户，请先创建管理员');
      process.exit(1);
    }
    
    console.log(`✅ 找到管理员: ${admin.username} (${admin.email})\n`);
    
    // 1. 创建论文预置订阅（公共）
    console.log('📄 创建论文预置订阅...');
    // 先删除旧的
    await prisma.subscription.deleteMany({
      where: { userId: admin.id, contentType: 'paper', isPublic: true },
    });
    const paperSub = await prisma.subscription.create({
      data: {
        userId: admin.id,
        contentType: 'paper',
        keywords: JSON.stringify(PAPER_PRESET_KEYWORDS),
        tags: JSON.stringify(PAPER_PRESET_CATEGORIES),
        authors: JSON.stringify(PAPER_PRESET_AUTHORS),
        isPublic: true,
        isActive: true,
        notifyEnabled: true,
      },
    });
    console.log(`✅ 论文预置订阅创建成功: ${PAPER_PRESET_KEYWORDS.length}个关键词\n`);
    
    // 2. 创建B站公共UP主订阅
    console.log('📺 创建B站公共UP主订阅...');
    await prisma.subscription.deleteMany({
      where: { userId: admin.id, contentType: 'video', platform: 'bilibili', isPublic: true },
    });
    const bilibiliSub = await prisma.subscription.create({
      data: {
        userId: admin.id,
        contentType: 'video',
        uploaders: JSON.stringify(VIDEO_PRESET_UPLOADERS.bilibili),
        platform: 'bilibili',
        isPublic: true,
        isActive: true,
        notifyEnabled: true,
      },
    });
    console.log(`✅ B站公共UP主订阅创建成功: ${VIDEO_PRESET_UPLOADERS.bilibili.length}个UP主\n`);
    
    // 3. 创建YouTube公共UP主订阅
    console.log('🎬 创建YouTube公共UP主订阅...');
    await prisma.subscription.deleteMany({
      where: { userId: admin.id, contentType: 'video', platform: 'youtube', isPublic: true },
    });
    const youtubeSub = await prisma.subscription.create({
      data: {
        userId: admin.id,
        contentType: 'video',
        uploaders: JSON.stringify(VIDEO_PRESET_UPLOADERS.youtube),
        platform: 'youtube',
        isPublic: true,
        isActive: true,
        notifyEnabled: true,
      },
    });
    console.log(`✅ YouTube公共UP主订阅创建成功: ${VIDEO_PRESET_UPLOADERS.youtube.length}个UP主\n`);
    
    console.log('='.repeat(50));
    console.log('🎉 预置订阅配置初始化完成！');
    console.log('='.repeat(50));
    console.log(`📄 论文: ${PAPER_PRESET_KEYWORDS.length}个关键词 + ${PAPER_PRESET_CATEGORIES.length}个分类 + ${PAPER_PRESET_AUTHORS.length}个作者`);
    console.log(`📺 B站: ${VIDEO_PRESET_UPLOADERS.bilibili.length}个公共UP主`);
    console.log(`🎬 YouTube: ${VIDEO_PRESET_UPLOADERS.youtube.length}个公共UP主`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
