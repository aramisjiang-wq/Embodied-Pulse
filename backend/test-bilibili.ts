import { BilibiliAPI } from './src/services/bilibili/index';
import { logger } from './src/utils/logger';

async function testBilibiliAPI() {
  try {
    logger.info('开始测试Bilibili API');
    
    const api = BilibiliAPI.fromEnv();
    
    const mid = 1172054289;
    
    logger.info(`测试获取UP主视频列表: ${mid}`);
    
    const result = await api.user.getUserVideos(mid, 1, 5);
    
    logger.info(`获取成功: ${result.list?.vlist?.length} 个视频`);
    
    if (result.list?.vlist?.length > 0) {
      logger.info('第一个视频:', JSON.stringify(result.list.vlist[0], null, 2));
    }
    
    process.exit(0);
  } catch (error: any) {
    logger.error('测试失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

testBilibiliAPI();