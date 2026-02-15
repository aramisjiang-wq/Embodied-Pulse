/**
 * 测试HuggingFace API
 */

import axios from 'axios';

const HUGGINGFACE_API_BASE = 'https://huggingface.co/api';

async function testHuggingFaceAPI() {
  try {
    console.log('🔍 测试HuggingFace API...\n');

    // 测试1: 搜索embodied相关模型
    console.log('1. 搜索embodied相关模型:');
    const searchResponse = await axios.get(`${HUGGINGFACE_API_BASE}/models`, {
      params: {
        search: 'embodied',
        sort: 'downloads',
        direction: -1,
        limit: 5,
      },
      timeout: 10000,
    });
    console.log(`✅ 找到 ${searchResponse.data.length} 个模型`);
    if (searchResponse.data.length > 0) {
      console.log('   示例模型:', searchResponse.data[0].id);
      console.log('   下载量:', searchResponse.data[0].downloads);
      console.log('   标签:', searchResponse.data[0].tags?.slice(0, 3).join(', '));
    }

    // 测试2: 按任务类型筛选
    console.log('\n2. 按任务类型筛选 (image-classification):');
    const filterResponse = await axios.get(`${HUGGINGFACE_API_BASE}/models`, {
      params: {
        filter: 'image-classification',
        sort: 'downloads',
        direction: -1,
        limit: 3,
      },
      timeout: 10000,
    });
    console.log(`✅ 找到 ${filterResponse.data.length} 个模型`);

    // 测试3: 获取模型详情
    if (searchResponse.data.length > 0) {
      console.log('\n3. 获取模型详情:');
      const modelId = searchResponse.data[0].id;
      try {
        const detailResponse = await axios.get(`${HUGGINGFACE_API_BASE}/models/${modelId}`, {
          timeout: 10000,
        });
        console.log(`✅ 成功获取模型详情: ${modelId}`);
        console.log('   作者:', detailResponse.data.author || 'N/A');
      } catch (error: any) {
        console.log(`⚠️  获取详情失败: ${error.message}`);
      }
    }

    console.log('\n✅ HuggingFace API测试完成！');
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  }
}

testHuggingFaceAPI();
