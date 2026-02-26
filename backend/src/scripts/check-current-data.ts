import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

async function checkCurrentData() {
  logger.info('📊 检查当前数据库数据状态...');
  
  try {
    const [
      paperCount, 
      repoCount, 
      modelCount, 
      videoCount,
      hfDatasetCount,
      semanticScholarPaperCount
    ] = await Promise.all([
      userPrisma.paper.count(),
      userPrisma.githubRepo.count(),
      userPrisma.huggingFaceModel.count(),
      userPrisma.video.count(),
      userPrisma.huggingFaceDataset.count().catch(() => 0),
      userPrisma.semanticScholarPaper.count().catch(() => 0),
    ]);
    
    logger.info('========================================');
    logger.info('📊 当前数据统计:');
    logger.info('========================================');
    logger.info(`  📄 学术论文 (arXiv): ${paperCount} 篇`);
    if (semanticScholarPaperCount > 0) {
      logger.info(`  📄 Semantic Scholar论文: ${semanticScholarPaperCount} 篇`);
    }
    logger.info(`  💻 GitHub项目: ${repoCount} 个`);
    logger.info(`  🤖 HuggingFace模型: ${modelCount} 个`);
    if (hfDatasetCount > 0) {
      logger.info(`  📊 HuggingFace数据集: ${hfDatasetCount} 个`);
    }
    logger.info(`  📺 视频资料: ${videoCount} 个`);
    logger.info('========================================');
    
    // 显示一些样本数据
    if (paperCount > 0) {
      const samplePapers = await userPrisma.paper.findMany({
        take: 5,
        orderBy: { publishedDate: 'desc' }
      });
      logger.info('\n📄 最新5篇论文:');
      samplePapers.forEach((paper, i) => {
        logger.info(`  ${i + 1}. ${paper.title.substring(0, 60)}...`);
      });
    }
    
    if (repoCount > 0) {
      const sampleRepos = await userPrisma.githubRepo.findMany({
        take: 5,
        orderBy: { starsCount: 'desc' }
      });
      logger.info('\n💻 Star最高的5个项目:');
      sampleRepos.forEach((repo, i) => {
        logger.info(`  ${i + 1}. ${repo.fullName} (⭐${repo.starsCount})`);
      });
    }
    
    if (modelCount > 0) {
      const sampleModels = await userPrisma.huggingFaceModel.findMany({
        take: 5,
        orderBy: { downloads: 'desc' }
      });
      logger.info('\n🤖 下载量最高的5个模型:');
      sampleModels.forEach((model, i) => {
        logger.info(`  ${i + 1}. ${model.fullName} (📥${model.downloads})`);
      });
    }
    
    if (videoCount > 0) {
      const sampleVideos = await userPrisma.video.findMany({
        take: 5,
        orderBy: { playCount: 'desc' }
      });
      logger.info('\n📺 播放量最高的5个视频:');
      sampleVideos.forEach((video, i) => {
        logger.info(`  ${i + 1}. ${video.title.substring(0, 50)}... (▶️${video.playCount})`);
      });
    }
    
    return { paperCount, repoCount, modelCount, videoCount };
  } catch (error: any) {
    logger.error('检查数据失败:', error.message);
    throw error;
  } finally {
    await userPrisma.$disconnect();
  }
}

checkCurrentData().catch((error) => {
  logger.error('检查数据失败:', error);
  process.exit(1);
});
