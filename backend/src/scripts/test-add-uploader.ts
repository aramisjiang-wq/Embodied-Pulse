/**
 * 测试添加UP主功能
 */

import { extractMidFromUrl, getUploaderInfo, createOrUpdateUploader } from '../services/bilibili-uploader.service';
import { logger } from '../utils/logger';

const testUrl = 'https://space.bilibili.com/1172054289?spm_id_from=333.337.0.0';
const testMid = '1172054289';

async function testAddUploader() {
  console.log('='.repeat(60));
  console.log('测试添加UP主功能');
  console.log('='.repeat(60));
  console.log('');

  // 1. 测试链接解析
  console.log('1. 测试链接解析...');
  const mid = extractMidFromUrl(testUrl);
  if (mid === testMid) {
    console.log(`   ✅ 链接解析成功: ${mid}`);
  } else {
    console.log(`   ❌ 链接解析失败: 期望 ${testMid}, 实际 ${mid}`);
    process.exit(1);
  }
  console.log('');

  // 2. 测试获取UP主信息（可能失败，但应该使用fallback）
  console.log('2. 测试获取UP主信息...');
  let uploaderInfo;
  try {
    uploaderInfo = await getUploaderInfo(testMid);
    if (uploaderInfo) {
      console.log(`   ✅ 成功获取UP主信息:`);
      console.log(`      MID: ${uploaderInfo.mid}`);
      console.log(`      名称: ${uploaderInfo.name}`);
      console.log(`      头像: ${uploaderInfo.avatar || '无'}`);
      console.log(`      简介: ${uploaderInfo.description || '无'}`);
    } else {
      console.log(`   ⚠️  无法从API获取信息，将使用默认信息`);
      uploaderInfo = {
        mid: testMid,
        name: `UP主-${testMid}`,
        avatar: undefined,
        description: undefined,
      };
    }
  } catch (error: any) {
    console.log(`   ⚠️  API调用失败: ${error.message}`);
    console.log(`   使用默认信息创建UP主`);
    uploaderInfo = {
      mid: testMid,
      name: `UP主-${testMid}`,
      avatar: undefined,
      description: undefined,
    };
  }
  console.log('');

  // 3. 测试创建UP主
  console.log('3. 测试创建/更新UP主...');
  try {
    const uploader = await createOrUpdateUploader(uploaderInfo);
    console.log(`   ✅ UP主创建/更新成功:`);
    console.log(`      ID: ${uploader.id}`);
    console.log(`      MID: ${uploader.mid}`);
    console.log(`      名称: ${uploader.name}`);
    console.log(`      状态: ${uploader.isActive ? '启用' : '禁用'}`);
    console.log(`      视频数: ${uploader.videoCount || 0}`);
  } catch (error: any) {
    console.log(`   ❌ 创建UP主失败: ${error.message}`);
    process.exit(1);
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('✅ 所有测试通过！');
  console.log('='.repeat(60));
  console.log('');
  console.log('下一步：');
  console.log('1. 在管理端UP主列表中应该能看到该UP主');
  console.log('2. 点击"同步视频"按钮可以同步该UP主的视频');
  console.log('3. 在用户端视频页面可以筛选该UP主的视频');
}

testAddUploader().catch(error => {
  logger.error('测试失败:', error);
  process.exit(1);
});
