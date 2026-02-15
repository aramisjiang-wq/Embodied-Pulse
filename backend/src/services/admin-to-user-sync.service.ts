/**
 * 管理端到用户端的数据同步服务
 * 将管理端订阅的UP主数据同步到用户端数据库
 */

import adminPrisma from '../config/database.admin';
import userPrismaAny from '../config/database.user';
import { logger } from '../utils/logger';

const userPrisma = userPrismaAny as any;

interface SyncResult {
  success: boolean;
  syncedUploaders: number;
  updatedUploaders: number;
  skippedUploaders: number;
  errors: string[];
  duration: number;
}

interface UploaderSyncStats {
  total: number;
  synced: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * 同步管理端的UP主数据到用户端
 * 支持增量同步，只同步有变化的UP主
 */
export async function syncUploadersFromAdminToUser(): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const stats: UploaderSyncStats = {
    total: 0,
    synced: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };

  try {
    logger.info('========== 开始同步管理端UP主数据到用户端 ==========');

    const adminUploaders = await getAdminUploaders();
    stats.total = adminUploaders.length;

    logger.info(`管理端找到 ${adminUploaders.length} 个激活的UP主`);

    for (const adminUploader of adminUploaders) {
      try {
        const result = await syncSingleUploader(adminUploader);
        
        if (result.status === 'created') {
          stats.synced++;
          logger.info(`✅ 新增UP主: ${adminUploader.name} (mid: ${adminUploader.mid})`);
        } else if (result.status === 'updated') {
          stats.updated++;
          logger.info(`🔄 更新UP主: ${adminUploader.name} (mid: ${adminUploader.mid})`);
        } else {
          stats.skipped++;
          logger.debug(`⏭️ 跳过UP主: ${adminUploader.name} (mid: ${adminUploader.mid}) - 无变化`);
        }
      } catch (error: any) {
        stats.errors++;
        const errorMsg = `同步UP主失败: ${adminUploader.name} (mid: ${adminUploader.mid}) - ${error.message}`;
        errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    const duration = Date.now() - startTime;
    
    const syncResult: SyncResult = {
      success: stats.errors === 0,
      syncedUploaders: stats.synced,
      updatedUploaders: stats.updated,
      skippedUploaders: stats.skipped,
      errors,
      duration
    };

    logger.info('========== UP主数据同步完成 ==========');
    logger.info(`总计: ${stats.total} | 新增: ${stats.synced} | 更新: ${stats.updated} | 跳过: ${stats.skipped} | 错误: ${stats.errors}`);
    logger.info(`耗时: ${duration}ms`);

    return syncResult;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMsg = `同步UP主数据失败: ${error.message}`;
    logger.error(errorMsg, error);
    
    return {
      success: false,
      syncedUploaders: stats.synced,
      updatedUploaders: stats.updated,
      skippedUploaders: stats.skipped,
      errors: [errorMsg, ...errors],
      duration
    };
  }
}

/**
 * 从管理端数据库获取所有激活的UP主
 */
async function getAdminUploaders(): Promise<Array<{
  id: string;
  mid: string;
  name: string;
  avatar: string | null;
  description: string | null;
  tags: string | null;
  is_active: boolean;
  video_count: number;
  last_sync_at: Date | null;
  created_at: Date;
  updated_at: Date;
}>> {
  try {
    const uploaders = await adminPrisma.bilibili_uploaders.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return uploaders.map((u: any) => ({
      id: u.id,
      mid: u.mid,
      name: u.name,
      avatar: u.avatar,
      description: u.description,
      tags: u.tags,
      is_active: u.is_active,
      video_count: u.video_count,
      last_sync_at: u.last_sync_at,
      created_at: u.created_at,
      updated_at: u.updated_at
    }));
  } catch (error: any) {
    logger.error('获取管理端UP主列表失败:', error);
    throw new Error(`获取管理端UP主列表失败: ${error.message}`);
  }
}

/**
 * 同步单个UP主到用户端
 */
async function syncSingleUploader(adminUploader: any): Promise<{
  status: 'created' | 'updated' | 'skipped';
}> {
  try {
    const existingUploader = await userPrisma.bilibili_uploaders.findUnique({
      where: { mid: adminUploader.mid }
    });

    if (!existingUploader) {
      await createUploaderInUserDB(adminUploader);
      return { status: 'created' };
    }

    if (shouldUpdateUploader(existingUploader, adminUploader)) {
      await updateUploaderInUserDB(existingUploader.id, adminUploader);
      return { status: 'updated' };
    }

    return { status: 'skipped' };

  } catch (error: any) {
    logger.error(`同步UP主失败 (${adminUploader.mid}):`, error);
    throw error;
  }
}

/**
 * 判断是否需要更新UP主数据
 */
function shouldUpdateUploader(
  existing: any,
  admin: any
): boolean {
  if (existing.name !== admin.name) return true;
  if (existing.avatar !== admin.avatar) return true;
  if (existing.description !== admin.description) return true;
  if (existing.tags !== admin.tags) return true;
  if (existing.isActive !== admin.is_active) return true;
  if (existing.videoCount !== admin.video_count) return true;

  const existingUpdatedAt = existing.updatedAt.getTime();
  const adminUpdatedAt = admin.updated_at.getTime();
  
  if (adminUpdatedAt > existingUpdatedAt) return true;

  return false;
}

/**
 * 在用户端数据库创建UP主
 */
async function createUploaderInUserDB(adminUploader: any): Promise<void> {
  try {
    await userPrisma.bilibili_uploaders.create({
      data: {
        id: adminUploader.id,
        mid: adminUploader.mid,
        name: adminUploader.name,
        avatar: adminUploader.avatar,
        description: adminUploader.description,
        tags: adminUploader.tags,
        isActive: adminUploader.is_active,
        videoCount: adminUploader.video_count,
        lastSyncAt: adminUploader.last_sync_at,
        createdAt: adminUploader.created_at,
        updatedAt: adminUploader.updated_at
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      logger.warn(`UP主已存在 (${adminUploader.mid})，尝试更新`);
      const existing = await userPrisma.bilibili_uploaders.findUnique({
        where: { mid: adminUploader.mid }
      });
      if (existing) {
        await updateUploaderInUserDB(existing.id, adminUploader);
        return;
      }
    }
    throw error;
  }
}

/**
 * 在用户端数据库更新UP主
 */
async function updateUploaderInUserDB(
  uploaderId: string,
  adminUploader: any
): Promise<void> {
  await userPrisma.bilibili_uploaders.update({
    where: { id: uploaderId },
    data: {
      name: adminUploader.name,
      avatar: adminUploader.avatar,
      description: adminUploader.description,
      tags: adminUploader.tags,
      isActive: adminUploader.is_active,
      videoCount: adminUploader.video_count,
      lastSyncAt: adminUploader.last_sync_at,
      updatedAt: adminUploader.updated_at
    }
  });
}

/**
 * 为用户创建默认的UP主订阅记录
 * 如果用户没有订阅任何UP主，自动订阅所有激活的UP主
 */
export async function createDefaultUserSubscription(userId: string): Promise<{
  success: boolean;
  subscribedCount: number;
  error?: string;
}> {
  try {
    logger.info(`为用户 ${userId} 创建默认UP主订阅`);

    const existingSubscription = await userPrisma.subscription.findFirst({
      where: {
        userId,
        contentType: 'video',
        platform: 'bilibili',
        isActive: true
      }
    });

    if (existingSubscription) {
      logger.info(`用户 ${userId} 已有UP主订阅，跳过创建`);
      return {
        success: true,
        subscribedCount: 0
      };
    }

    const uploaders = await userPrisma.bilibili_uploaders.findMany({
      where: { isActive: true },
      select: { mid: true }
    });

    if (uploaders.length === 0) {
      logger.warn(`用户端没有激活的UP主，无法创建订阅`);
      return {
        success: false,
        subscribedCount: 0,
        error: '没有可订阅的UP主'
      };
    }

    const uploaderMids = uploaders.map((u: any) => u.mid);
    const uploadersJson = JSON.stringify(uploaderMids);

    await userPrisma.subscription.create({
      data: {
        userId,
        contentType: 'video',
        platform: 'bilibili',
        uploaders: uploadersJson,
        isActive: true,
        notifyEnabled: true,
        syncEnabled: true,
        newCount: 0,
        totalMatched: uploaders.length
      }
    });

    logger.info(`✅ 为用户 ${userId} 创建默认订阅，订阅了 ${uploaders.length} 个UP主`);

    return {
      success: true,
      subscribedCount: uploaders.length
    };

  } catch (error: any) {
    const errorMsg = `创建默认订阅失败: ${error.message}`;
    logger.error(errorMsg, error);
    return {
      success: false,
      subscribedCount: 0,
      error: errorMsg
    };
  }
}

/**
 * 同步所有用户的默认订阅
 * 为没有UP主订阅的用户创建默认订阅
 */
export async function syncAllUserDefaultSubscriptions(): Promise<{
  success: boolean;
  totalUsers: number;
  syncedUsers: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let syncedUsers = 0;

  try {
    logger.info('========== 开始同步所有用户的默认订阅 ==========');

    const users = await userPrisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    logger.info(`找到 ${users.length} 个激活的用户`);

    for (const user of users) {
      try {
        const result = await createDefaultUserSubscription(user.id);
        if (result.success && result.subscribedCount > 0) {
          syncedUsers++;
        }
      } catch (error: any) {
        const errorMsg = `为用户 ${user.id} 创建默认订阅失败: ${error.message}`;
        errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    logger.info('========== 用户默认订阅同步完成 ==========');
    logger.info(`总计用户: ${users.length} | 已同步: ${syncedUsers} | 错误: ${errors.length}`);

    return {
      success: errors.length === 0,
      totalUsers: users.length,
      syncedUsers,
      errors
    };

  } catch (error: any) {
    const errorMsg = `同步用户默认订阅失败: ${error.message}`;
    logger.error(errorMsg, error);
    return {
      success: false,
      totalUsers: 0,
      syncedUsers: 0,
      errors: [errorMsg]
    };
  }
}

/**
 * 完整的数据同步流程
 * 1. 同步UP主数据
 * 2. 同步用户默认订阅
 */
export async function fullDataSync(): Promise<{
  uploaderSync: SyncResult;
  subscriptionSync: {
    success: boolean;
    totalUsers: number;
    syncedUsers: number;
    errors: string[];
  };
}> {
  logger.info('========== 开始完整数据同步 ==========');

  const uploaderSync = await syncUploadersFromAdminToUser();
  
  const subscriptionSync = await syncAllUserDefaultSubscriptions();

  logger.info('========== 完整数据同步完成 ==========');

  return {
    uploaderSync,
    subscriptionSync
  };
}
