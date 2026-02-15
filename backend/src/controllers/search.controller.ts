/**
 * 搜索控制器
 */

import { Request, Response } from 'express';
import userPrisma from '../config/database.user';
import { ApiError } from '../utils/errors';
import { sendSuccess, sendError } from '../utils/response';

/**
 * 全站搜索
 */
export const search = async (req: Request, res: Response) => {
  try {
    const { q, type, page = 1, size = 20 } = req.query;
    
    if (!q || typeof q !== 'string') {
      throw new ApiError(400, 'INVALID_QUERY', '搜索关键词不能为空');
    }

    const keyword = q.toLowerCase();
    const pageNum = Number(page);
    const pageSize = Number(size);
    const skip = (pageNum - 1) * pageSize;

    const results: any[] = [];
    
    // 如果没有指定类型，搜索所有类型
    const searchTypes = type ? [type] : ['paper', 'video', 'repo', 'job', 'huggingface', 'post', 'news'];

    // 搜索论文（SQLite不支持mode: 'insensitive'，keyword已转换为小写）
    if (searchTypes.includes('paper')) {
      const papers = await userPrisma.paper.findMany({
        where: {
          OR: [
            { title: { contains: keyword } },
            { abstract: { contains: keyword } },
          ],
        },
        take: pageSize,
        skip,
        orderBy: { createdAt: 'desc' },
      });
      
      results.push(...papers.map(p => ({
        type: 'paper',
        id: p.id,
        title: p.title,
        description: p.abstract,
        metadata: { authors: p.authors, publishedDate: p.publishedDate },
        // 添加外部链接所需字段
        arxivId: p.arxivId || null,
        pdfUrl: p.pdfUrl || null,
      })));
    }

    // 搜索视频（SQLite不支持mode: 'insensitive'，keyword已转换为小写）
    if (searchTypes.includes('video')) {
      const videos = await userPrisma.video.findMany({
        where: {
          OR: [
            { title: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        },
        take: pageSize,
        skip,
        orderBy: { createdAt: 'desc' },
      });
      
      results.push(...videos.map(v => ({
        type: 'video',
        id: v.id,
        title: v.title,
        description: v.description,
        metadata: { platform: v.platform, uploader: v.uploader },
        // 添加外部链接所需字段
        platform: v.platform || 'bilibili',
        videoId: v.videoId || '',
        bvid: (v as any).bvid || v.videoId || '',
      })));
    }

    // 搜索GitHub项目（SQLite不支持mode: 'insensitive'，keyword已转换为小写）
    if (searchTypes.includes('repo')) {
      const repos = await userPrisma.githubRepo.findMany({
        where: {
          OR: [
            { name: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        },
        take: pageSize,
        skip,
        orderBy: { starsCount: 'desc' },
      });
      
      results.push(...repos.map(r => ({
        type: 'repo',
        id: r.id,
        title: r.name,
        description: r.description,
        metadata: { fullName: r.fullName, language: r.language, starsCount: r.starsCount },
        // 添加外部链接所需字段
        htmlUrl: (r as any).htmlUrl || null,
        fullName: r.fullName || '',
      })));
    }

    // 搜索岗位（SQLite不支持mode: 'insensitive'，keyword已转换为小写）
    if (searchTypes.includes('job')) {
      const jobs = await userPrisma.job.findMany({
        where: {
          OR: [
            { title: { contains: keyword } },
            { company: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        },
        take: pageSize,
        skip,
        orderBy: { createdAt: 'desc' },
      });
      
      results.push(...jobs.map(j => ({
        type: 'job',
        id: j.id,
        title: j.title,
        description: j.description,
        metadata: { company: j.company, location: j.location },
        // 添加外部链接所需字段
        applyUrl: (j as any).applyUrl || null,
      })));
    }

    // 搜索新闻（SQLite不支持mode: 'insensitive'，keyword已转换为小写）
    if (searchTypes.includes('news')) {
      const news = await userPrisma.news.findMany({
        where: {
          OR: [
            { title: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        },
        take: pageSize,
        skip,
        orderBy: { publishedDate: 'desc' },
      });
      
      results.push(...news.map(n => ({
        type: 'news',
        id: n.id,
        title: n.title,
        description: n.description,
        metadata: { platform: n.platform, score: n.score, url: n.url },
      })));
    }

    // 搜索HuggingFace模型（SQLite不支持mode: 'insensitive'，keyword已转换为小写）
    if (searchTypes.includes('huggingface')) {
      const models = await userPrisma.huggingFaceModel.findMany({
        where: {
          OR: [
            { fullName: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        },
        take: pageSize,
        skip,
        orderBy: { downloads: 'desc' },
      });
      
      results.push(...models.map(m => ({
        type: 'huggingface',
        id: m.id,
        // 添加外部链接所需字段
        fullName: m.fullName || '',
        hfId: m.fullName || '', // HuggingFace使用fullName作为ID
        title: m.fullName,
        description: m.description,
        metadata: { fullName: m.fullName, task: m.task, downloads: m.downloads },
      })));
    }

    // 搜索帖子（SQLite不支持mode: 'insensitive'，keyword已转换为小写）
    if (searchTypes.includes('post')) {
      const posts = await userPrisma.post.findMany({
        where: {
          OR: [
            { title: { contains: keyword } },
            { content: { contains: keyword } },
          ],
          status: 'active',
        },
        take: pageSize,
        skip,
        orderBy: { createdAt: 'desc' },
      });
      
      results.push(...posts.map(p => ({
        type: 'post',
        id: p.id,
        title: p.title || '无标题',
        description: p.content.substring(0, 200),
        metadata: { likeCount: p.likeCount, commentCount: p.commentCount },
      })));
    }

    // 简单分页（实际应该分别查询总数）
    const total = results.length;

    sendSuccess(res, {
      items: results.slice(0, pageSize),
      pagination: {
        page: pageNum,
        size: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }, '搜索成功');
  } catch (error) {
    if (error instanceof ApiError) {
      sendError(res, error.statusCode, error.message, error.statusCode);
    } else {
      sendError(res, 500, '搜索失败', 500);
    }
  }
};
