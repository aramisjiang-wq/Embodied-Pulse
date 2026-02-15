/**
 * 测试环境变量加载
 */

import dotenv from 'dotenv';

console.log('加载 .env 文件...');
dotenv.config();

console.log('\n环境变量检查:');
console.log('BILIBILI_COOKIE:', process.env.BILIBILI_COOKIE ? '已设置' : '未设置');

if (process.env.BILIBILI_COOKIE) {
  console.log('\nBILIBILI_COOKIE 内容（前200字符）:');
  console.log(process.env.BILIBILI_COOKIE.substring(0, 200) + '...');
  
  const sessdata = process.env.BILIBILI_COOKIE.match(/SESSDATA=([^;]+)/);
  const biliJct = process.env.BILIBILI_COOKIE.match(/bili_jct=([^;]+)/);
  const dedeuserid = process.env.BILIBILI_COOKIE.match(/DedeUserID=([^;]+)/);
  
  console.log('\n解析结果:');
  console.log('- SESSDATA:', sessdata ? '找到' : '未找到');
  console.log('- bili_jct:', biliJct ? '找到' : '未找到');
  console.log('- DedeUserID:', dedeuserid ? '找到' : '未找到');
  
  if (sessdata) {
    const parts = sessdata[1].split(',');
    if (parts.length >= 2) {
      const expireTime = parseInt(parts[1], 10);
      const now = Math.floor(Date.now() / 1000);
      const daysLeft = Math.floor((expireTime - now) / 86400);
      
      console.log(`\nCookie 过期时间:`);
      console.log(`- 过期时间戳: ${expireTime}`);
      console.log(`- 当前时间戳: ${now}`);
      console.log(`- 剩余天数: ${daysLeft}`);
      
      if (expireTime < now) {
        console.log('⚠ Cookie 已过期！');
      } else if (daysLeft < 7) {
        console.log(`⚠ Cookie 即将过期（剩余 ${daysLeft} 天）`);
      } else {
        console.log(`✓ Cookie 有效（剩余 ${daysLeft} 天）`);
      }
    }
  }
}
