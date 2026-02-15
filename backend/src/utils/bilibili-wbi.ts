/**
 * Bilibili WBI签名工具
 * 参考: https://github.com/SocialSisterYi/bilibili-API-collect
 */

import crypto from 'crypto';
import axios from 'axios';
import { logger } from '../utils/logger';

interface WBIKeys {
  img_key: string;
  sub_key: string;
}

let cachedWBIKeys: WBIKeys | null = null;
let cacheExpiry: number = 0;

const WBI_CACHE_DURATION = 30 * 60 * 1000; // 30分钟

/**
 * 获取WBI密钥
 */
async function getWBIKeys(): Promise<WBIKeys> {
  const now = Date.now();
  
  if (cachedWBIKeys && now < cacheExpiry) {
    return cachedWBIKeys;
  }

  try {
    const response = await axios.get('https://api.bilibili.com/x/web-interface/nav', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com',
      },
      timeout: 10000,
    });

    const wbiImg = response.data.data?.wbi_img;
    if (!wbiImg) {
      throw new Error('无法获取WBI密钥');
    }

    const imgKey = wbiImg.img_url.split('/').pop()?.replace('.png', '') || '';
    const subKey = wbiImg.sub_url.split('/').pop()?.replace('.png', '') || '';

    cachedWBIKeys = { img_key: imgKey, sub_key: subKey };
    cacheExpiry = now + WBI_CACHE_DURATION;

    logger.info('成功获取WBI密钥');
    return cachedWBIKeys;
  } catch (error: any) {
    logger.error('获取WBI密钥失败:', error.message);
    throw error;
  }
}

/**
 * 混淆密钥
 */
function mixKey(imgKey: string, subKey: string): string {
  const key = imgKey + subKey;
  const salt = '560c52ccd288fed045859ed18bffd973';
  return key.slice(0, 32) + salt + key.slice(32);
}

/**
 * 生成WBI签名
 */
export async function generateWBI(params: Record<string, any>): Promise<string> {
  try {
    const keys = await getWBIKeys();
    const mixedKey = mixKey(keys.img_key, keys.sub_key);
    
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const sign = crypto
      .createHash('md5')
      .update(sortedParams + mixedKey)
      .digest('hex');

    return sign;
  } catch (error: any) {
    logger.error('生成WBI签名失败:', error.message);
    throw error;
  }
}

/**
 * 为请求参数添加WBI签名
 */
export async function addWBISign(params: Record<string, any>): Promise<Record<string, any>> {
  try {
    const wbiSign = await generateWBI(params);
    return {
      ...params,
      wts: Math.floor(Date.now() / 1000),
      w_rid: wbiSign,
    };
  } catch (error: any) {
    logger.error('添加WBI签名失败:', error.message);
    return params;
  }
}

/**
 * 清除WBI缓存
 */
export function clearWBICache(): void {
  cachedWBIKeys = null;
  cacheExpiry = 0;
  logger.info('已清除WBI缓存');
}