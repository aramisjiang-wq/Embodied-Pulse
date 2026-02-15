import { getAllActiveUploaders, getUploaderInfo, createOrUpdateUploader } from './src/services/bilibili-uploader.service';
import { logger } from './src/utils/logger';
import userPrisma from './src/config/database.user';
import { BilibiliCookieManager } from './src/services/bilibili-cookie-manager.service';

BilibiliCookieManager.initialize();
logger.info('Bilibili Cookie manager initialized');

async function refreshUploadersInfo() {
  try {
    logger.info('开始刷新所有UP主信息');
    
    const uploaders = await getAllActiveUploaders();
    
    logger.info(`找到 ${uploaders.length} 个活跃UP主`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const uploader of uploaders) {
      try {
        logger.info(`刷新UP主: ${uploader.name} (${uploader.mid})`);
        
        const uploaderInfo = await getUploaderInfo(uploader.mid);
        
        if (uploaderInfo) {
          await createOrUpdateUploader(uploaderInfo);
          logger.info(`✓ UP主 ${uploader.name} 信息更新成功`);
          successCount++;
        } else {
          logger.warn(`✗ UP主 ${uploader.name} 无法获取信息，使用默认名称`);
          failCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error: any) {
        logger.error(`✗ UP主 ${uploader.name} 刷新失败:`, error.message);
        failCount++;
      }
    }
    
    logger.info(`刷新完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);
    
    process.exit(0);
  } catch (error: any) {
    logger.error('刷新UP主信息失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

refreshUploadersInfo();