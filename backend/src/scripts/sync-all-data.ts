/**
 * 全量数据同步脚本
 * 从所有第三方API抓取数据
 */

import { syncArxivPapers } from '../services/sync/arxiv.sync';
import { syncGithubRepos } from '../services/sync/github.sync';
import { syncHuggingFaceModels } from '../services/sync/huggingface.sync';
import { syncBilibiliVideos } from '../services/sync/bilibili.sync';
import { syncYouTubeVideos } from '../services/sync/youtube.sync';
import { syncJobsFromGithub } from '../services/sync/jobs.sync';
import { logger } from '../utils/logger';

async function main() {
  console.log('🚀 开始全量数据同步...\n');
  
  const results = {
    papers: 0,
    github: 0,
    huggingface: 0,
    bilibili: 0,
    youtube: 0,
    jobs: 0,
  };
  
  try {
    // 1. 同步arXiv论文
    console.log('📄 同步arXiv论文...');
    try {
      const paperResult = await syncArxivPapers(
        'embodied AI OR embodied intelligence OR robotic manipulation', 
        50
      );
      results.papers = paperResult.synced;
      console.log('✅ arXiv论文同步完成\n');
    } catch (error: any) {
      console.error('❌ arXiv论文同步失败:', error.message);
    }
    
    // 2. 同步GitHub项目
    console.log('💻 同步GitHub项目...');
    try {
      const githubResult = await syncGithubRepos(
        'embodied intelligence OR robotics OR robot learning', 
        30
      );
      results.github = githubResult.synced;
      console.log('✅ GitHub项目同步完成\n');
    } catch (error: any) {
      console.error('❌ GitHub项目同步失败:', error.message);
    }
    
    // 3. 同步HuggingFace模型
    console.log('🤖 同步HuggingFace模型...');
    try {
      const hfResult = await syncHuggingFaceModels(
        'robotics', 
        30
      );
      results.huggingface = hfResult.synced;
      console.log('✅ HuggingFace模型同步完成\n');
    } catch (error: any) {
      console.error('❌ HuggingFace模型同步失败:', error.message);
    }
    
    // 4. 同步B站视频
    console.log('📺 同步B站视频...');
    try {
      const biliResult = await syncBilibiliVideos(
        '具身智能 机器人 深度学习', 
        20
      );
      results.bilibili = biliResult.synced;
      console.log('✅ B站视频同步完成\n');
    } catch (error: any) {
      console.error('❌ B站视频同步失败:', error.message);
    }
    
    // 5. 同步YouTube视频
    console.log('🎬 同步YouTube视频...');
    try {
      const ytResult = await syncYouTubeVideos(
        'embodied AI robotics', 
        20
      );
      results.youtube = ytResult.synced;
      console.log('✅ YouTube视频同步完成\n');
    } catch (error: any) {
      console.error('❌ YouTube视频同步失败:', error.message);
    }
    
    // 6. 同步真实岗位数据
    console.log('💼 同步真实岗位数据...');
    try {
      const { syncRealJobs } = await import('../services/sync/job-real.sync');
      const jobResult = await syncRealJobs(50);
      results.jobs = jobResult.synced;
      console.log('✅ 真实岗位同步完成\n');
    } catch (error: any) {
      console.error('❌ 岗位同步失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 全量数据同步失败:', error);
  }
  
  // 输出统计
  console.log('\n' + '='.repeat(50));
  console.log('📊 全量数据同步完成统计:');
  console.log('='.repeat(50));
  console.log(`📄 论文: ${results.papers}篇`);
  console.log(`💻 GitHub项目: ${results.github}个`);
  console.log(`🤖 HuggingFace模型: ${results.huggingface}个`);
  console.log(`📺 B站视频: ${results.bilibili}个`);
  console.log(`🎬 YouTube视频: ${results.youtube}个`);
  console.log(`💼 求职岗位: ${results.jobs}个`);
  console.log('='.repeat(50));
  console.log(`🎉 总计: ${Object.values(results).reduce((a, b) => a + b, 0)}条数据`);
  console.log('='.repeat(50));
  
  process.exit(0);
}

main().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
