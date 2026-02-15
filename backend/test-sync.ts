import { syncUploaderVideos } from './src/services/bilibili-uploader.service';
import { logger } from './src/utils/logger';

async function testSync() {
  try {
    logger.info('开始测试同步UP主视频');
    
    const mid = '1172054289';
    const result = await syncUploaderVideos(mid, 5);
    
    logger.info('同步完成:', result);
    
    process.exit(0);
  } catch (error: any) {
    logger.error('同步失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

testSync();