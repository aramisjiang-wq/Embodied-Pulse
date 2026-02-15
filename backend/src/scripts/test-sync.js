/**
 * 数据同步测试脚本
 * 测试管理端到用户端的数据同步功能
 */

import { syncUploadersFromAdminToUser, createDefaultUserSubscription, syncAllUserDefaultSubscriptions, fullDataSync } from '../src/services/admin-to-user-sync.service';
import { syncVideosForUploader, syncAllUploadersVideos, quickSyncRecentUploaders } from '../src/services/video-sync.service';
import { logger } from '../src/utils/logger';
import userPrisma from '../src/config/database.user';
import adminPrisma from '../src/config/database.admin';

async function testUploaderSync() {
  console.log('\n========== 测试1: UP主数据同步 ==========\n');
  
  try {
    const result = await syncUploadersFromAdminToUser();
    
    console.log('✅ UP主数据同步成功');
    console.log(`   - 新增: ${result.syncedUploaders}`);
    console.log(`   - 更新: ${result.updatedUploaders}`);
    console.log(`   - 跳过: ${result.skippedUploaders}`);
    console.log(`   - 耗时: ${result.duration}ms`);
    
    if (result.errors.length > 0) {
      console.log(`   - 错误: ${result.errors.length}个`);
      result.errors.forEach((err, i) => {
        console.log(`     ${i + 1}. ${err}`);
      });
    }
    
    return result.success;
  } catch (error: any) {
    console.error('❌ UP主数据同步失败:', error.message);
    return false;
  }
}

async function testUserSubscription() {
  console.log('\n========== 测试2: 用户默认订阅创建 ==========\n');
  
  try {
    const result = await syncAllUserDefaultSubscriptions();
    
    console.log('✅ 用户默认订阅同步成功');
    console.log(`   - 总用户: ${result.totalUsers}`);
    console.log(`   - 已同步: ${result.syncedUsers}`);
    
    if (result.errors.length > 0) {
      console.log(`   - 错误: ${result.errors.length}个`);
      result.errors.forEach((err, i) => {
        console.log(`     ${i + 1}. ${err}`);
      });
    }
    
    return result.success;
  } catch (error: any) {
    console.error('❌ 用户默认订阅同步失败:', error.message);
    return false;
  }
}

async function testVideoSync() {
  console.log('\n========== 测试3: 视频数据同步 ==========\n');
  
  try {
    const uploaders = await userPrisma.bilibiliUploader.findMany({
      where: { isActive: true },
      select: { id: true, name: true, mid: true },
      take: 2
    });
    
    if (uploaders.length === 0) {
      console.log('⚠️  没有可同步的UP主');
      return false;
    }
    
    console.log(`找到 ${uploaders.length} 个UP主，开始同步视频...`);
    
    let successCount = 0;
    for (const uploader of uploaders) {
      try {
        const result = await syncVideosForUploader(uploader.id, 20);
        
        if (result.success) {
          successCount++;
          console.log(`✅ ${uploader.name}: 新增 ${result.syncedVideos} | 更新 ${result.updatedVideos}`);
        } else {
          console.log(`❌ ${uploader.name}: 同步失败`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error: any) {
        console.error(`❌ ${uploader.name}: ${error.message}`);
      }
    }
    
    console.log(`\n视频同步完成: ${successCount}/${uploaders.length} 成功`);
    return successCount > 0;
  } catch (error: any) {
    console.error('❌ 视频数据同步失败:', error.message);
    return false;
  }
}

async function testQuickSync() {
  console.log('\n========== 测试4: 快速同步 ==========\n');
  
  try {
    const result = await quickSyncRecentUploaders(7, 10);
    
    console.log('✅ 快速同步成功');
    console.log(`   - 已同步UP主: ${result.syncedUploaders}`);
    console.log(`   - 总视频: ${result.totalVideos}`);
    console.log(`   - 耗时: ${result.duration}ms`);
    
    if (result.errors.length > 0) {
      console.log(`   - 错误: ${result.errors.length}个`);
      result.errors.forEach((err, i) => {
        console.log(`     ${i + 1}. ${err}`);
      });
    }
    
    return result.success;
  } catch (error: any) {
    console.error('❌ 快速同步失败:', error.message);
    return false;
  }
}

async function testFullSync() {
  console.log('\n========== 测试5: 完整数据同步 ==========\n');
  
  try {
    const result = await fullDataSync();
    
    console.log('✅ 完整数据同步成功');
    console.log('\nUP主同步:');
    console.log(`   - 新增: ${result.uploaderSync.syncedUploaders}`);
    console.log(`   - 更新: ${result.uploaderSync.updatedUploaders}`);
    console.log(`   - 跳过: ${result.uploaderSync.skippedUploaders}`);
    console.log(`   - 耗时: ${result.uploaderSync.duration}ms`);
    
    console.log('\n用户订阅同步:');
    console.log(`   - 总用户: ${result.subscriptionSync.totalUsers}`);
    console.log(`   - 已同步: ${result.subscriptionSync.syncedUsers}`);
    
    if (result.uploaderSync.errors.length > 0) {
      console.log(`\nUP主同步错误: ${result.uploaderSync.errors.length}个`);
      result.uploaderSync.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }
    
    if (result.subscriptionSync.errors.length > 0) {
      console.log(`\n订阅同步错误: ${result.subscriptionSync.errors.length}个`);
      result.subscriptionSync.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }
    
    return result.uploaderSync.success && result.subscriptionSync.success;
  } catch (error: any) {
    console.error('❌ 完整数据同步失败:', error.message);
    return false;
  }
}

async function checkDatabaseStatus() {
  console.log('\n========== 数据库状态检查 ==========\n');
  
  try {
    const adminUploaders = await adminPrisma.bilibili_uploaders.findMany({
      where: { is_active: true }
    });
    
    const userUploaders = await userPrisma.bilibiliUploader.findMany({
      where: { isActive: true }
    });
    
    const userVideos = await userPrisma.video.findMany({
      where: { platform: 'bilibili' }
    });
    
    const userSubscriptions = await userPrisma.subscription.findMany({
      where: {
        contentType: 'video',
        platform: 'bilibili',
        isActive: true
      }
    });
    
    console.log('管理端数据库:');
    console.log(`   - 激活的UP主: ${adminUploaders.length}个`);
    
    console.log('\n用户端数据库:');
    console.log(`   - 激活的UP主: ${userUploaders.length}个`);
    console.log(`   - B站视频: ${userVideos.length}个`);
    console.log(`   - UP主订阅: ${userSubscriptions.length}个`);
    
    if (adminUploaders.length > 0) {
      console.log('\n管理端UP主列表:');
      adminUploaders.slice(0, 5).forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.name} (mid: ${u.mid})`);
      });
      if (adminUploaders.length > 5) {
        console.log(`   ... 还有 ${adminUploaders.length - 5} 个`);
      }
    }
    
    if (userUploaders.length > 0) {
      console.log('\n用户端UP主列表:');
      userUploaders.slice(0, 5).forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.name} (mid: ${u.mid})`);
      });
      if (userUploaders.length > 5) {
        console.log(`   ... 还有 ${userUploaders.length - 5} 个`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ 数据库状态检查失败:', error.message);
  }
}

async function main() {
  console.log('========================================');
  console.log('  数据同步功能测试脚本');
  console.log('========================================');
  
  try {
    await checkDatabaseStatus();
    
    const test1 = await testUploaderSync();
    await checkDatabaseStatus();
    
    const test2 = await testUserSubscription();
    await checkDatabaseStatus();
    
    const test3 = await testVideoSync();
    await checkDatabaseStatus();
    
    const test4 = await testQuickSync();
    await checkDatabaseStatus();
    
    console.log('\n========================================');
    console.log('  测试结果汇总');
    console.log('========================================');
    console.log(`1. UP主数据同步: ${test1 ? '✅ 通过' : '❌ 失败'}`);
    console.log(`2. 用户默认订阅: ${test2 ? '✅ 通过' : '❌ 失败'}`);
    console.log(`3. 视频数据同步: ${test3 ? '✅ 通过' : '❌ 失败'}`);
    console.log(`4. 快速同步: ${test4 ? '✅ 通过' : '❌ 失败'}`);
    console.log('========================================\n');
    
    console.log('提示: 如需测试完整数据同步，请运行:');
    console.log('  node scripts/test-full-sync.js');
    
  } catch (error: any) {
    console.error('\n❌ 测试过程中发生错误:', error);
    process.exit(1);
  } finally {
    await adminPrisma.$disconnect();
    await userPrisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { main as testSyncFunctions };
