const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../prisma/user.db');

console.log('尝试读取数据库文件...');
console.log('数据库路径:', dbPath);

if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  console.log('数据库文件大小:', (stats.size / 1024).toFixed(2), 'KB');
  console.log('数据库文件存在: ✅');
} else {
  console.log('数据库文件不存在: ❌');
}
