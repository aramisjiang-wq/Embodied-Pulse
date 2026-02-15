/**
 * 测试科技新闻同步脚本
 * 用于诊断RSS解析问题
 */

import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { logger } from '../utils/logger';

const TECH_NEWS_SOURCES = [
  { name: 'TechCrunch', rss: 'https://techcrunch.com/feed/', platform: 'techcrunch' },
  { name: 'The Verge', rss: 'https://www.theverge.com/rss/index.xml', platform: 'theverge' },
];

async function testRssSource(source: typeof TECH_NEWS_SOURCES[0]) {
  console.log(`\n========== 测试 ${source.name} ==========`);
  console.log(`RSS地址: ${source.rss}`);
  
  try {
    const response = await axios.get(source.rss, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      validateStatus: () => true,
    });

    console.log(`HTTP状态: ${response.status}`);
    console.log(`数据类型: ${typeof response.data}`);
    console.log(`数据长度: ${typeof response.data === 'string' ? response.data.length : 'N/A'}`);

    if (typeof response.data !== 'string') {
      console.log('❌ 返回非字符串数据');
      return;
    }

    if (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html>')) {
      console.log('❌ 返回HTML页面');
      return;
    }

    console.log('✅ 响应数据格式正确');

    // 解析XML
    const result = await parseStringPromise(response.data, {
      explicitArray: true,
      mergeAttrs: false,
      explicitRoot: true,
      ignoreAttrs: false,
      trim: true,
    });

    console.log(`解析结果根元素: ${Object.keys(result || {})[0] || 'unknown'}`);

    let items: any[] = [];

    // 检查RSS 2.0格式
    if (result && result.rss) {
      console.log('✅ 检测到RSS 2.0格式');
      if (result.rss.channel) {
        const channels = Array.isArray(result.rss.channel) ? result.rss.channel : [result.rss.channel];
        console.log(`Channel数量: ${channels.length}`);
        
        if (channels.length > 0) {
          const channel = channels[0];
          console.log(`Channel keys: ${Object.keys(channel).join(', ')}`);
          
          if (channel.item) {
            if (Array.isArray(channel.item)) {
              items = channel.item;
              console.log(`✅ 找到 ${items.length} 个item（数组）`);
            } else {
              items = [channel.item];
              console.log(`✅ 找到 1 个item（单项目）`);
            }
          } else {
            console.log('❌ Channel中没有item字段');
          }
        }
      } else {
        console.log('❌ RSS中没有channel字段');
      }
    }
    // 检查Atom格式
    else if (result && result.feed) {
      console.log('✅ 检测到Atom格式');
      if (result.feed.entry) {
        if (Array.isArray(result.feed.entry)) {
          items = result.feed.entry;
          console.log(`✅ 找到 ${items.length} 个entry（数组）`);
        } else {
          items = [result.feed.entry];
          console.log(`✅ 找到 1 个entry（单条目）`);
        }
      } else {
        console.log('❌ Feed中没有entry字段');
      }
    } else {
      console.log('❌ 既不是RSS 2.0也不是Atom格式');
      console.log(`解析结果keys: ${Object.keys(result || {}).join(', ')}`);
      return;
    }

    if (items.length === 0) {
      console.log('❌ 没有找到任何项目');
      return;
    }

    // 检查第一个项目
    const firstItem = items[0];
    console.log(`\n第一个项目的结构:`);
    console.log(`Keys: ${Object.keys(firstItem).join(', ')}`);
    console.log(`Title类型: ${typeof firstItem.title}, 是数组: ${Array.isArray(firstItem.title)}`);
    console.log(`Link类型: ${typeof firstItem.link}, 是数组: ${Array.isArray(firstItem.link)}`);
    
    if (firstItem.title) {
      if (Array.isArray(firstItem.title)) {
        console.log(`Title值: ${firstItem.title[0]?.substring(0, 50)}...`);
      } else {
        console.log(`Title值: ${String(firstItem.title).substring(0, 50)}...`);
      }
    }

    if (firstItem.link) {
      if (Array.isArray(firstItem.link)) {
        console.log(`Link值: ${firstItem.link[0]}`);
      } else if (firstItem.link.$ && firstItem.link.$.href) {
        console.log(`Link值 (Atom): ${firstItem.link.$.href}`);
      } else {
        console.log(`Link值: ${String(firstItem.link)}`);
      }
    }

    console.log(`✅ 成功解析 ${items.length} 个项目`);

  } catch (error: any) {
    console.error(`❌ 错误: ${error.message}`);
    console.error(error.stack);
  }
}

async function main() {
  console.log('开始测试科技新闻RSS源...\n');
  
  for (const source of TECH_NEWS_SOURCES) {
    await testRssSource(source);
  }
  
  console.log('\n========== 测试完成 ==========');
}

main().catch(console.error);
