/**
 * 初始化新闻源配置
 */

import userPrisma from '../config/database.user';

export async function initNewsSources() {
  try {
    const sources = [
      {
        platform: 'baidu',
        name: '百度',
        baseUrl: 'https://www.baidu.com',
        searchUrl: 'https://www.baidu.com/s?wd={keyword}',
        listUrl: 'https://www.baidu.com/s?wd={keyword}',
        headers: JSON.stringify({
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }),
        params: JSON.stringify({}),
        isActive: true,
        syncEnabled: true,
        syncInterval: 3600,
      },
      {
        platform: 'weibo',
        name: '微博',
        baseUrl: 'https://weibo.com',
        searchUrl: 'https://s.weibo.com/weibo?q={keyword}',
        listUrl: 'https://s.weibo.com/weibo?q={keyword}',
        headers: JSON.stringify({
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://weibo.com',
        }),
        params: JSON.stringify({}),
        isActive: true,
        syncEnabled: true,
        syncInterval: 1800,
      },
      {
        platform: 'zhihu',
        name: '知乎',
        baseUrl: 'https://www.zhihu.com',
        searchUrl: 'https://www.zhihu.com/search?q={keyword}',
        listUrl: 'https://www.zhihu.com/api/v3/search?q={keyword}',
        headers: JSON.stringify({
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.zhihu.com',
        }),
        params: JSON.stringify({}),
        isActive: true,
        syncEnabled: true,
        syncInterval: 3600,
      },
    ];

    for (const source of sources) {
      await userPrisma.news_source_configs.upsert({
        where: { platform: source.platform },
        update: source as any,
        create: source as any,
      });
    }

    console.log('News sources initialized successfully');
  } catch (error: any) {
    console.error('Error initializing news sources:', error);
    throw error;
  }
}

export async function initDefaultFilters() {
  try {
    const filters = [
      {
        name: '具身智能相关',
        description: '过滤与具身智能相关的新闻',
        keywords: JSON.stringify(['具身智能', '机器人', 'embodied AI', 'embodied intelligence']),
        excludeKeywords: JSON.stringify(['广告', '推广', '营销']),
        matchType: 'any',
        caseSensitive: false,
        isActive: true,
        priority: 10,
        applyToPlatform: 'all',
      },
      {
        name: 'AI大模型',
        description: '过滤AI大模型相关新闻',
        keywords: JSON.stringify(['大模型', 'LLM', 'GPT', 'ChatGPT', 'Claude', 'Llama']),
        excludeKeywords: JSON.stringify([]),
        matchType: 'any',
        caseSensitive: false,
        isActive: true,
        priority: 5,
        applyToPlatform: 'all',
      },
    ];

    for (const filter of filters) {
      await userPrisma.news_keyword_filters.upsert({
        where: { name: filter.name },
        update: filter as any,
        create: filter as any,
      });
    }

    console.log('Default filters initialized successfully');
  } catch (error: any) {
    console.error('Error initializing default filters:', error);
    throw error;
  }
}

if (require.main === module) {
  (async () => {
    await initNewsSources();
    await initDefaultFilters();
    process.exit(0);
  })();
}