import { syncHuggingFaceModels } from '../services/sync/huggingface.sync';

async function main() {
  try {
    console.log('开始同步HuggingFace模型...\n');
    
    const result = await syncHuggingFaceModels('robotics', 30);
    
    console.log('\n同步结果:');
    console.log(`成功: ${result.synced}`);
    console.log(`错误: ${result.errors}`);
    console.log(`总计: ${result.total}`);
    console.log(`消息: ${result.message || 'N/A'}`);
  } catch (error: any) {
    console.error('同步失败:', error.message);
    console.error('错误详情:', error);
  }
}

main();
