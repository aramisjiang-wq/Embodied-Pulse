/**
 * 测试 Cookie 加载
 */

import dotenv from 'dotenv';
import { Credential } from '../services/bilibili/credential';
import { logger } from '../utils/logger';

dotenv.config();

console.log('测试 Cookie 加载');
console.log('================\n');

const credential = Credential.fromEnv();

console.log('Credential 状态:');
console.log('- SESSDATA:', credential.getSessdata() ? '已设置' : '未设置');
console.log('- bili_jct:', credential.getBiliJct() ? '已设置' : '未设置');
console.log('- DedeUserID:', credential.getDedeuserid() ? '已设置' : '未设置');
console.log('- 完整 Cookie:', (credential as any).cookies ? '已设置' : '未设置');

if ((credential as any).cookies) {
  console.log('\nCookie 内容（前100字符）:');
  console.log((credential as any).cookies.substring(0, 100) + '...');
}

console.log('\n检查 Cookie 是否过期:');
const sessdata = credential.getSessdata();
if (sessdata) {
  const parts = sessdata.split(',');
  if (parts.length >= 2) {
    const expireTime = parseInt(parts[1], 10);
    const now = Math.floor(Date.now() / 1000);
    const daysLeft = Math.floor((expireTime - now) / 86400);
    
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
