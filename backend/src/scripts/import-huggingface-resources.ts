/**
 * 从 HuggingFace 资源大全文档导入数据
 * 解析 Markdown 表格，提取模型和数据集信息
 */

import fs from 'fs';
import path from 'path';
import userPrisma from '../config/database.user';
import { v4 as uuidv4 } from 'uuid';

const prisma = userPrisma;

const DOC_PATH = path.join(__dirname, '../../../docs/08-资源/HuggingFace_具身智能资源大全.md');

interface HFResource {
  fullName: string;
  name: string;
  author: string;
  description: string;
  contentType: 'model' | 'dataset';
  category: string;
}

function parseMarkdownTables(content: string): HFResource[] {
  const resources: HFResource[] = [];
  const lines = content.split('\n');
  
  let currentCategory = '';
  let currentContentType: 'model' | 'dataset' = 'model';
  let inTable = false;
  let headerProcessed = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测章节标题
    if (line.startsWith('## ')) {
      currentCategory = line.replace(/^##\s+/, '').trim();
      // 判断是模型还是数据集部分
      if (line.includes('第一部分') || line.includes('模型')) {
        currentContentType = 'model';
      }
    } else if (line.startsWith('### ')) {
      currentCategory = line.replace(/^###\s+/, '').trim();
    }
    
    // 检测数据集部分开始
    if (line.includes('第二部分：数据集')) {
      currentContentType = 'dataset';
    }
    
    // 检测表格开始
    if (line.startsWith('|') && line.includes('---')) {
      inTable = true;
      headerProcessed = true;
      continue;
    }
    
    // 跳过表头
    if (line.startsWith('|') && !headerProcessed) {
      headerProcessed = true;
      continue;
    }
    
    // 处理表格行
    if (line.startsWith('|') && inTable && headerProcessed) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      
      if (cells.length >= 2) {
        // 尝试提取 fullName（从链接中）
        let fullName = '';
        let description = '';
        
        // 常见表格格式：
        // 格式1: | 模型名称 | 描述 | 参数量 | 链接 |
        // 格式2: | 数据集名称 | 描述 | 规模 | 链接 |
        
        const nameCell = cells[0];
        description = cells[1] || '';
        
        // 从链接中提取 fullName
        const linkMatch = nameCell.match(/\[链接\]\(https:\/\/huggingface\.co\/(datasets\/)?([^)]+)\)/);
        if (linkMatch) {
          const isDataset = !!linkMatch[1];
          fullName = linkMatch[2];
          currentContentType = isDataset ? 'dataset' : 'model';
        } else {
          // 尝试其他链接格式
          const altLinkMatch = nameCell.match(/\[.*?\]\(https:\/\/huggingface\.co\/(datasets\/)?([^)]+)\)/);
          if (altLinkMatch) {
            const isDataset = !!altLinkMatch[1];
            fullName = altLinkMatch[2];
            currentContentType = isDataset ? 'dataset' : 'model';
          } else {
            // 使用名称作为 fullName（可能需要 author/name 格式）
            const cleanName = nameCell.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
            if (cleanName.includes('/')) {
              fullName = cleanName;
            } else if (cleanName && !cleanName.includes('---')) {
              // 跳过无效名称
              continue;
            }
          }
        }
        
        if (fullName && fullName.includes('/')) {
          const [author, ...nameParts] = fullName.split('/');
          const name = nameParts.join('/');
          
          resources.push({
            fullName,
            name: name || fullName,
            author: author || 'unknown',
            description: description.replace(/\[.*?\]\(.*?\)/g, '').trim(),
            contentType: currentContentType,
            category: currentCategory,
          });
        }
      }
    }
    
    // 表格结束
    if (!line.startsWith('|') && inTable) {
      inTable = false;
      headerProcessed = false;
    }
  }
  
  return resources;
}

function deduplicateResources(resources: HFResource[]): HFResource[] {
  const seen = new Set<string>();
  return resources.filter(r => {
    if (seen.has(r.fullName)) {
      return false;
    }
    seen.add(r.fullName);
    return true;
  });
}

async function main() {
  console.log('📄 读取 HuggingFace 资源大全文档...\n');
  
  const content = fs.readFileSync(DOC_PATH, 'utf-8');
  console.log(`文档大小: ${(content.length / 1024).toFixed(1)} KB\n`);
  
  console.log('🔍 解析 Markdown 表格...\n');
  const resources = parseMarkdownTables(content);
  const uniqueResources = deduplicateResources(resources);
  
  console.log(`解析到 ${resources.length} 条资源`);
  console.log(`去重后 ${uniqueResources.length} 条资源\n`);
  
  // 统计
  const models = uniqueResources.filter(r => r.contentType === 'model');
  const datasets = uniqueResources.filter(r => r.contentType === 'dataset');
  console.log(`模型: ${models.length} 条`);
  console.log(`数据集: ${datasets.length} 条\n`);
  
  // 显示前10条
  console.log('前10条资源预览:');
  uniqueResources.slice(0, 10).forEach((r, i) => {
    console.log(`${i + 1}. [${r.contentType}] ${r.fullName} - ${r.description.substring(0, 50)}...`);
  });
  console.log('');
  
  // 导入数据库
  console.log('📥 开始导入数据库...\n');
  
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const resource of uniqueResources) {
    try {
      await prisma.huggingFaceModel.create({
        data: {
          id: uuidv4(),
          fullName: resource.fullName,
          name: resource.name,
          author: resource.author,
          description: resource.description || null,
          contentType: resource.contentType,
          category: resource.category,
          downloads: 0,
          likes: 0,
          viewCount: 0,
          favoriteCount: 0,
          shareCount: 0,
          isPinned: false,
          pinnedAt: null,
          updatedAt: new Date(),
        },
      });
      imported++;
      
      if (imported % 50 === 0) {
        console.log(`已导入 ${imported} 条...`);
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        skipped++;
      } else {
        failed++;
        console.log(`导入失败: ${resource.fullName} - ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 导入结果');
  console.log('='.repeat(50));
  console.log(`✅ 成功导入: ${imported}`);
  console.log(`⏭️  已存在跳过: ${skipped}`);
  console.log(`❌ 导入失败: ${failed}`);
  
  await prisma.$disconnect();
  console.log('\n🎉 导入完成！');
}

main().catch((error) => {
  console.error('❌ 导入失败:', error);
  process.exit(1);
});
