/**
 * 数据库索引优化迁移
 * 
 * 执行方式: tsx prisma/migrations/add-indexes.ts
 * 
 * 注意：SQLite 不支持 CONCURRENTLY，需要在低峰期执行
 */

import userPrisma from '../src/config/database.user';
import adminPrisma from '../src/config/database.admin';
import { logger } from '../src/utils/logger';

const USER_DB_INDEXES = [
  { name: 'users_email_idx', table: 'users', columns: ['email'], sql: 'CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)' },
  { name: 'users_github_id_idx', table: 'users', columns: ['github_id'], sql: 'CREATE INDEX IF NOT EXISTS users_github_id_idx ON users(github_id)' },
  { name: 'users_is_active_idx', table: 'users', columns: ['is_active'], sql: 'CREATE INDEX IF NOT EXISTS users_is_active_idx ON users(is_active)' },
  
  { name: 'videos_platform_video_id_idx', table: 'videos', columns: ['platform', 'video_id'], sql: 'CREATE INDEX IF NOT EXISTS videos_platform_video_id_idx ON videos(platform, video_id)' },
  { name: 'videos_uploader_id_idx', table: 'videos', columns: ['uploader_id'], sql: 'CREATE INDEX IF NOT EXISTS videos_uploader_id_idx ON videos(uploader_id)' },
  
  { name: 'papers_arxiv_id_idx', table: 'papers', columns: ['arxiv_id'], sql: 'CREATE INDEX IF NOT EXISTS papers_arxiv_id_idx ON papers(arxiv_id)' },
  
  { name: 'user_actions_user_content_idx', table: 'user_actions', columns: ['user_id', 'content_type', 'content_id'], sql: 'CREATE INDEX IF NOT EXISTS user_actions_user_content_idx ON user_actions(user_id, content_type, content_id)' },
  
  { name: 'point_records_user_action_idx', table: 'point_records', columns: ['user_id', 'action_type'], sql: 'CREATE INDEX IF NOT EXISTS point_records_user_action_idx ON point_records(user_id, action_type)' },
  
  { name: 'notifications_user_unread_idx', table: 'notifications', columns: ['user_id', 'is_read'], sql: 'CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_id, is_read)' },
  
  { name: 'subscriptions_user_active_idx', table: 'subscriptions', columns: ['user_id', 'is_active'], sql: 'CREATE INDEX IF NOT EXISTS subscriptions_user_active_idx ON subscriptions(user_id, is_active)' },
];

const ADMIN_DB_INDEXES = [
  { name: 'admins_role_idx', table: 'admins', columns: ['role'], sql: 'CREATE INDEX IF NOT EXISTS admins_role_idx ON admins(role)' },
  
  { name: 'videos_platform_video_id_idx', table: 'videos', columns: ['platform', 'video_id'], sql: 'CREATE INDEX IF NOT EXISTS videos_platform_video_id_idx ON videos(platform, video_id)' },
  { name: 'videos_uploader_id_idx', table: 'videos', columns: ['uploader_id'], sql: 'CREATE INDEX IF NOT EXISTS videos_uploader_id_idx ON videos(uploader_id)' },
  
  { name: 'papers_arxiv_id_idx', table: 'papers', columns: ['arxiv_id'], sql: 'CREATE INDEX IF NOT EXISTS papers_arxiv_id_idx ON papers(arxiv_id)' },
  
  { name: 'user_actions_user_content_idx', table: 'user_actions', columns: ['user_id', 'content_type', 'content_id'], sql: 'CREATE INDEX IF NOT EXISTS user_actions_user_content_idx ON user_actions(user_id, content_type, content_id)' },
  
  { name: 'subscriptions_user_active_idx', table: 'subscriptions', columns: ['user_id', 'is_active'], sql: 'CREATE INDEX IF NOT EXISTS subscriptions_user_active_idx ON subscriptions(user_id, is_active)' },
  
  { name: 'data_source_logs_status_idx', table: 'data_source_logs', columns: ['status'], sql: 'CREATE INDEX IF NOT EXISTS data_source_logs_status_idx ON data_source_logs(status)' },
];

async function checkIndexExists(prisma: any, indexName: string): Promise<boolean> {
  const result = await prisma.$queryRaw`
    SELECT name FROM sqlite_master 
    WHERE type='index' AND name = ${indexName}
  `;
  return result.length > 0;
}

async function createIndex(prisma: any, index: { name: string; sql: string }): Promise<boolean> {
  try {
    const exists = await checkIndexExists(prisma, index.name);
    if (exists) {
      logger.info(`Index ${index.name} already exists, skipping`);
      return false;
    }
    
    await prisma.$executeRawUnsafe(index.sql);
    logger.info(`Created index: ${index.name}`);
    return true;
  } catch (error) {
    logger.error(`Failed to create index ${index.name}:`, error);
    return false;
  }
}

async function runMigrations() {
  logger.info('Starting index migration...');
  
  logger.info('\n=== User Database Indexes ===');
  let userCreated = 0;
  for (const index of USER_DB_INDEXES) {
    const created = await createIndex(userPrisma, index);
    if (created) userCreated++;
  }
  logger.info(`User DB: Created ${userCreated} new indexes`);
  
  logger.info('\n=== Admin Database Indexes ===');
  let adminCreated = 0;
  for (const index of ADMIN_DB_INDEXES) {
    const created = await createIndex(adminPrisma, index);
    if (created) adminCreated++;
  }
  logger.info(`Admin DB: Created ${adminCreated} new indexes`);
  
  logger.info('\n=== Migration Complete ===');
  logger.info(`Total indexes created: ${userCreated + adminCreated}`);
}

runMigrations()
  .then(async () => {
    await userPrisma.$disconnect();
    await adminPrisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Migration failed:', error);
    await userPrisma.$disconnect();
    await adminPrisma.$disconnect();
    process.exit(1);
  });
