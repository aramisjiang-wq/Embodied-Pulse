/**
 * 密码加密和验证工具
 */

import bcrypt from 'bcryptjs';
import { logger } from './logger';

const SALT_ROUNDS = 10;

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    logger.error('Password hashing error:', error);
    throw new Error('PASSWORD_HASH_FAILED');
  }
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Password verification error:', error);
    throw new Error('PASSWORD_VERIFICATION_FAILED');
  }
}

/**
 * 验证密码强度
 * 规则: 8-32字符,至少包含一个字母和一个数字
 */
export function validatePasswordStrength(password: string): boolean {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,32}$/;
  return regex.test(password);
}
