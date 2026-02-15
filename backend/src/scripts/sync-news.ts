/**
 * 同步新闻数据脚本
 */

import { syncHotNews } from '../services/sync/hot-news.sync';
import { syncTechNews } from '../services/sync/tech-news.sync';
import { sync36krNews } from '../services/sync/36kr.sync';
import { logger } from '../utils/logger';

async function main() {
  console.log('🚀 开始同步新闻数据...\n');
  
  const results = {
    hotNews: 0,
    techNews: 0,
    kr36: 0,
  };
  
  try {
    // 1. 同步热点新闻（百度）
    console.log('📰 同步百度热点新闻...');
    try {
      const hotResult = await syncHotNews('baidu', 50);
      results.hotNews = hotResult.synced;
      console.log(`✅ 百度热点新闻同步完成: ${hotResult.synced} 条\n`);
    } catch (error: any) {
      console.error('❌ 百度热点新闻同步失败:', error.message);
    }
    
    // 2. 同步科技新闻
    console.log('📰 同步科技新闻...');
    try {
      const techResult = await syncTechNews(50);
      results.techNews = techResult.synced;
      console.log(`✅ 科技新闻同步完成: ${techResult.synced} 条\n`);
    } catch (error: any) {
      console.error('❌ 科技新闻同步失败:', error.message);
    }
    
    // 3. 同步36kr新闻
    console.log('📰 同步36kr新闻...');
    try {
      const kr36Result = await sync36krNews(50, true);
      results.kr36 = kr36Result.synced;
      console.log(`✅ 36kr新闻同步完成: ${kr36Result.synced} 条\n`);
    } catch (error: any) {
      console.error('❌ 36kr新闻同步失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 新闻同步失败:', error);
  }
  
  // 输出统计
  console.log('='.repeat(50));
  console.log('📊 新闻同步完成统计:');
  console.log('='.repeat(50));
  console.log(`📰 百度热点新闻: ${results.hotNews}条`);
  console.log(`📰 科技新闻: ${results.techNews}条`);
  console.log(`📰 36kr新闻: ${results.kr36}条`);
  console.log('='.repeat(50));
  console.log(`🎉 总计: ${Object.values(results).reduce((a, b) => a + b, 0)}条数据`);
  console.log('='.repeat(50));
  
  process.exit(0);
}

main().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
