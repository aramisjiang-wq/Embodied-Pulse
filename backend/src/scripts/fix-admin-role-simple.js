#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, '../..');

try {
  console.log('========================================');
  console.log('修复管理员角色');
  console.log('========================================\n');

  const dbPath = path.join(backendDir, 'prisma/admin.db');
  
  console.log(`数据库路径: ${dbPath}\n`);

  const sql = `
    -- 检查当前管理员
    SELECT '当前管理员:' as info;
    SELECT id, username, email, role, is_active FROM admins;
    
    -- 修复管理员角色
    UPDATE admins SET role = 'super_admin' WHERE role IS NULL OR role != 'super_admin';
    
    -- 验证修复结果
    SELECT '修复后管理员:' as info;
    SELECT id, username, email, role, is_active FROM admins;
  `;

  console.log('执行SQL修复...\n');
  
  const result = execSync(`sqlite3 "${dbPath}" "${sql}"`, {
    encoding: 'utf8',
    cwd: backendDir
  });

  console.log(result);
  
  console.log('\n========================================');
  console.log('修复完成！');
  console.log('========================================\n');
  console.log('请重新登录管理端：http://localhost:3000/admin/login');
  
} catch (error) {
  console.error('修复失败:', error.message);
  process.exit(1);
}
