/**
 * 测试HuggingFace作者同步功能
 * 用于诊断同步问题
 */

import { listModelsByAuthor } from '../services/huggingface-api.service';
import { syncAuthorModels } from '../services/huggingface-author-subscription.service';
import { logger } from '../utils/logger';

async function testAuthorSync() {
  const author = process.argv[2] || 'akhaliq';
  
  console.log(`\n=== 测试HuggingFace作者同步功能 ===\n`);
  console.log(`作者: ${author}\n`);

  try {
    // 步骤1: 测试API调用
    console.log('步骤1: 测试API调用...');
    const models = await listModelsByAuthor(author, 10);
    console.log(`✅ API调用成功，获取到 ${models.length} 个模型\n`);

    if (models.length === 0) {
      console.log('⚠️  警告: 没有获取到任何模型');
      console.log('可能的原因:');
      console.log('  1. 作者名不正确');
      console.log('  2. 作者没有公开模型');
      console.log('  3. API限制或网络问题');
      return;
    }

    // 显示前3个模型信息
    console.log('前3个模型信息:');
    models.slice(0, 3).forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.id || model.modelId || 'N/A'}`);
      console.log(`     下载量: ${model.downloads || 0}`);
      console.log(`     点赞数: ${model.likes || 0}`);
      console.log(`     是否私有: ${model.private ? '是' : '否'}`);
      console.log('');
    });

    // 步骤2: 测试同步功能
    console.log('步骤2: 测试同步功能...');
    const result = await syncAuthorModels(author, 10);
    console.log(`✅ 同步完成:`);
    console.log(`   成功: ${result.synced} 个`);
    console.log(`   失败: ${result.errors} 个`);
    console.log(`   总计: ${result.total} 个\n`);

    if (result.synced === 0 && result.total > 0) {
      console.log('⚠️  警告: 有模型但同步数为0');
      console.log('可能的原因:');
      console.log('  1. 所有模型都是私有的');
      console.log('  2. 所有模型都已存在');
      console.log('  3. 创建模型时出错');
    }

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
  }
}

// 运行测试
testAuthorSync()
  .then(() => {
    console.log('\n=== 测试完成 ===\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 测试异常:', error);
    process.exit(1);
  });
