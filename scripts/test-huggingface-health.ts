/**
 * 测试HuggingFace健康检查修复
 */

import { checkDataSourceHealth } from '../backend/src/services/data-source.service';
import { getAllDataSources } from '../backend/src/services/data-source.service';

async function testHuggingFaceHealth() {
  try {
    console.log('=== 测试HuggingFace健康检查 ===\n');
    
    // 1. 获取所有数据源
    console.log('1. 获取所有数据源...');
    const sources = await getAllDataSources();
    const huggingfaceSource = sources.find(s => s.name === 'huggingface');
    
    if (!huggingfaceSource) {
      console.error('❌ 未找到HuggingFace数据源');
      return;
    }
    
    console.log(`✅ 找到HuggingFace数据源: ${huggingfaceSource.id}`);
    console.log(`   - 名称: ${huggingfaceSource.displayName}`);
    console.log(`   - API URL: ${huggingfaceSource.apiBaseUrl}`);
    console.log(`   - 当前健康状态: ${huggingfaceSource.healthStatus || 'unknown'}\n`);
    
    // 2. 执行健康检查
    console.log('2. 执行健康检查...');
    const startTime = Date.now();
    const result = await checkDataSourceHealth(huggingfaceSource.id);
    const duration = Date.now() - startTime;
    
    console.log(`✅ 健康检查完成 (耗时: ${duration}ms)`);
    console.log(`   - 状态: ${result.status}`);
    console.log(`   - 响应时间: ${result.responseTime || 'N/A'}ms`);
    if (result.error) {
      console.log(`   - 错误信息: ${result.error}`);
    }
    console.log(`   - 时间戳: ${result.timestamp}\n`);
    
    // 3. 验证结果
    if (result.status === 'healthy') {
      console.log('✅ HuggingFace健康检查通过！');
    } else if (result.status === 'unhealthy') {
      console.log('❌ HuggingFace健康检查失败');
      console.log(`   错误: ${result.error || '未知错误'}`);
    } else {
      console.log('⚠️  HuggingFace健康状态未知');
    }
    
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error(error);
  }
}

// 运行测试
testHuggingFaceHealth()
  .then(() => {
    console.log('\n测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('测试异常:', error);
    process.exit(1);
  });
