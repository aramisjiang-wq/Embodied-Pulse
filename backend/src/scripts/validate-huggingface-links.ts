/**
 * 验证 HuggingFace 链接有效性
 * 通过直接访问 HuggingFace API 检查链接是否存在
 * 自动删除返回 404 的无效记录
 */

import axios from 'axios';
import userPrisma from '../config/database.user';

const HUGGINGFACE_API_BASE = 'https://huggingface.co/api';
const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN || '';

const prisma = userPrisma;

interface ValidationResult {
  id: string;
  fullName: string;
  contentType: string;
  valid: boolean;
  statusCode?: number;
  error?: string;
}

function getApiUrl(fullName: string, contentType: string): string {
  if (contentType === 'dataset') {
    return `${HUGGINGFACE_API_BASE}/datasets/${fullName}`;
  } else if (contentType === 'space') {
    return `${HUGGINGFACE_API_BASE}/spaces/${fullName}`;
  }
  return `${HUGGINGFACE_API_BASE}/models/${fullName}`;
}

async function validateModel(fullName: string, contentType: string): Promise<{ valid: boolean; statusCode?: number; error?: string }> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      };
      
      if (HUGGINGFACE_TOKEN) {
        headers['Authorization'] = `Bearer ${HUGGINGFACE_TOKEN}`;
      }
      
      const apiUrl = getApiUrl(fullName, contentType);
      
      const response = await axios.head(apiUrl, {
        timeout: 15000,
        headers,
        validateStatus: () => true,
      });
      
      if (response.status === 200) {
        return { valid: true, statusCode: 200 };
      } else if (response.status === 404) {
        return { valid: false, statusCode: 404, error: 'Not Found' };
      } else if (response.status === 429) {
        const waitTime = 5000 * attempt;
        console.log(`  ⏳ Rate limited, waiting ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      } else {
        return { valid: false, statusCode: response.status, error: `HTTP ${response.status}` };
      }
    } catch (error: any) {
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        if (attempt < maxRetries) {
          console.log(`  ⏳ Connection error, retrying (${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
      }
      return { valid: false, error: error.message };
    }
  }
  
  return { valid: false, error: 'Max retries exceeded' };
}

async function main() {
  console.log('🔍 开始验证 HuggingFace 链接有效性...\n');
  
  const models = await prisma.huggingFaceModel.findMany({
    select: { id: true, fullName: true, contentType: true },
    orderBy: { updatedAt: 'desc' },
  });
  
  if (models.length === 0) {
    console.log('📭 数据库中没有 HuggingFace 数据');
    console.log('💡 请先运行同步脚本: npx ts-node src/scripts/sync-huggingface.ts');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`📊 共 ${models.length} 条记录需要验证\n`);
  
  const invalidIds: string[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let errorCount = 0;
  
  const batchSize = 5;
  const delayBetweenBatches = 1000;
  
  for (let i = 0; i < models.length; i += batchSize) {
    const batch = models.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (model) => {
        const result = await validateModel(model.fullName, model.contentType || 'model');
        return {
          id: model.id,
          fullName: model.fullName,
          contentType: model.contentType || 'model',
          ...result,
        };
      })
    );
    
    for (const result of batchResults) {
      if (result.valid) {
        validCount++;
        console.log(`✅ ${result.fullName}`);
      } else if (result.statusCode === 404) {
        invalidCount++;
        invalidIds.push(result.id);
        console.log(`❌ ${result.fullName} - 404 Not Found (将删除)`);
      } else {
        errorCount++;
        console.log(`⚠️  ${result.fullName} - ${result.error || 'Unknown error'}`);
      }
    }
    
    if (i + batchSize < models.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
    
    const processed = Math.min(i + batchSize, models.length);
    if (processed % 20 === 0 || processed >= models.length) {
      console.log(`\n📈 进度: ${processed}/${models.length} (有效: ${validCount}, 无效: ${invalidCount}, 错误: ${errorCount})\n`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 验证结果');
  console.log('='.repeat(50));
  console.log(`总记录数: ${models.length}`);
  console.log(`✅ 有效链接: ${validCount}`);
  console.log(`❌ 无效链接 (404): ${invalidCount}`);
  console.log(`⚠️  检查失败: ${errorCount}`);
  
  if (invalidIds.length > 0) {
    console.log(`\n🗑️  正在删除 ${invalidIds.length} 条无效记录...`);
    
    const deleteResult = await prisma.huggingFaceModel.deleteMany({
      where: { id: { in: invalidIds } },
    });
    
    console.log(`✅ 已删除 ${deleteResult.count} 条无效记录`);
  } else {
    console.log('\n✨ 没有发现无效链接！');
  }
  
  await prisma.$disconnect();
  console.log('\n🎉 验证完成！');
}

main().catch((error) => {
  console.error('❌ 验证失败:', error);
  process.exit(1);
});
