/**
 * 直接创建管理员账号（使用SQL）
 */

import { execSync } from 'child_process';
import { hashPassword } from '../utils/password';
import path from 'path';
import fs from 'fs';

async function createAdminDirect() {
  try {
    const dbPath = path.join(__dirname, '../../prisma/admin.db');
    
    // 检查数据库文件是否存在
    if (!fs.existsSync(dbPath)) {
      console.error('❌ 数据库文件不存在:', dbPath);
      return;
    }

    // 生成密码哈希
    const passwordHash = await hashPassword('admin123');
    console.log('密码哈希生成成功');

    // 生成UUID
    const adminId = require('crypto').randomUUID();
    const now = new Date().toISOString();

    // 使用SQL直接插入
    const sql = `
      INSERT OR IGNORE INTO admins (id, username, email, password_hash, role, is_active, created_at, updated_at)
      VALUES ('${adminId}', 'admin', 'admin@embodiedpulse.com', '${passwordHash}', 'super_admin', 1, '${now}', '${now}');
    `;

    execSync(`sqlite3 "${dbPath}" "${sql}"`, { encoding: 'utf-8' });
    
    console.log('✅ 管理员账号创建成功');
    console.log('   邮箱: admin@embodiedpulse.com');
    console.log('   密码: admin123');
    console.log('   角色: super_admin');
    
    // 验证
    const verifySql = `SELECT email, username, role FROM admins WHERE email = 'admin@embodiedpulse.com';`;
    const result = execSync(`sqlite3 "${dbPath}" "${verifySql}"`, { encoding: 'utf-8' });
    console.log('验证结果:', result.trim());
  } catch (error: any) {
    console.error('❌ 创建管理员账号失败:', error.message);
    throw error;
  }
}

createAdminDirect()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
