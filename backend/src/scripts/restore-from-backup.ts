import { PrismaClient } from '@prisma/client';

const backupPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:/Users/dong/Documents/Product/Embodied/backend/prisma/dev.db.backup',
    },
  },
});

const userPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    console.log('开始从备份数据库恢复数据...\n');

    let papersRestored = 0;
    let reposRestored = 0;
    let videosRestored = 0;

    const papers = await backupPrisma.paper.findMany();
    console.log(`找到 ${papers.length} 个论文`);

    for (const paper of papers) {
      try {
        await userPrisma.paper.create({
          data: {
            id: paper.id,
            arxivId: paper.arxivId,
            title: paper.title,
            authors: paper.authors,
            abstract: paper.abstract,
            pdfUrl: paper.pdfUrl,
            publishedDate: paper.publishedDate,
            citationCount: paper.citationCount,
            venue: paper.venue,
            categories: paper.categories,
            viewCount: paper.viewCount,
            favoriteCount: paper.favoriteCount,
            shareCount: paper.shareCount,
            createdAt: paper.createdAt,
            updatedAt: paper.updatedAt,
          },
        });
        papersRestored++;
        console.log(`✓ 恢复论文: ${paper.title.substring(0, 50)}...`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`- 跳过已存在: ${paper.arxivId}`);
        } else {
          console.error(`✗ 恢复失败: ${paper.arxivId}`, error.message);
        }
      }
    }

    const repos = await backupPrisma.githubRepo.findMany();
    console.log(`找到 ${repos.length} 个GitHub仓库`);

    for (const repo of repos) {
      try {
        await userPrisma.githubRepo.create({
          data: {
            id: repo.id,
            repoId: repo.repoId,
            fullName: repo.fullName,
            name: repo.name,
            description: repo.description,
            owner: repo.owner,
            language: repo.language,
            starsCount: repo.starsCount,
            forksCount: repo.forksCount,
            issuesCount: repo.issuesCount,
            topics: repo.topics,
            createdDate: repo.createdDate,
            updatedDate: repo.updatedDate,
            viewCount: repo.viewCount,
            favoriteCount: repo.favoriteCount,
            createdAt: repo.createdAt,
            updatedAt: repo.updatedAt,
          },
        });
        reposRestored++;
        console.log(`✓ 恢复仓库: ${repo.fullName}`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`- 跳过已存在: ${repo.fullName}`);
        } else {
          console.error(`✗ 恢复失败: ${repo.fullName}`, error.message);
        }
      }
    }

    const videos = await backupPrisma.video.findMany();
    console.log(`找到 ${videos.length} 个视频`);

    for (const video of videos) {
      try {
        await userPrisma.video.create({
          data: {
            id: video.id,
            platform: video.platform,
            videoId: video.videoId,
            title: video.title,
            description: video.description,
            coverUrl: video.coverUrl,
            duration: video.duration,
            uploader: video.uploader,
            uploaderId: video.uploaderId,
            publishedDate: video.publishedDate,
            playCount: video.playCount,
            likeCount: video.likeCount,
            viewCount: video.viewCount,
            favoriteCount: video.favoriteCount,
            tags: video.tags,
            createdAt: video.createdAt,
            updatedAt: video.updatedAt,
          },
        });
        videosRestored++;
        console.log(`✓ 恢复视频: ${video.title.substring(0, 50)}...`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`- 跳过已存在: ${video.videoId}`);
        } else {
          console.error(`✗ 恢复失败: ${video.videoId}`, error.message);
        }
      }
    }

    console.log(`\n完成！`);
    console.log(`论文: ${papersRestored}个`);
    console.log(`GitHub仓库: ${reposRestored}个`);
    console.log(`视频: ${videosRestored}个`);
  } catch (error) {
    console.error('恢复失败:', error);
  } finally {
    await backupPrisma.$disconnect();
    await userPrisma.$disconnect();
  }
}

main();
