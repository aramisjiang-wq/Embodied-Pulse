/**
 * 岗位服务
 */

import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

const prisma = userPrisma as any;

export interface GetJobsParams {
  skip: number;
  take: number;
  sort?: 'latest' | 'hot' | 'salary';
  location?: string;
  keyword?: string;
}

export interface GetJobSeekingPostsParams {
  skip: number;
  take: number;
  sort?: 'latest' | 'hot' | 'salary';
  location?: string;
  keyword?: string;
}

export async function getJobs(params: GetJobsParams): Promise<{ jobs: any[]; total: number }> {
  try {
    const where: any = { status: 'open' };

    // 位置筛选（SQLite不支持mode: 'insensitive'，使用contains即可）
    if (params.location) {
      where.location = { contains: params.location };
    }

    // 关键词搜索（SQLite不支持mode: 'insensitive'，使用contains即可）
    if (params.keyword) {
      where.OR = [
        { title: { contains: params.keyword } },
        { company: { contains: params.keyword } },
        { description: { contains: params.keyword } },
      ];
    }

    let orderBy: any = {};
    switch (params.sort) {
      case 'salary':
        orderBy = { salaryMax: 'desc' };
        break;
      case 'hot':
        orderBy = { viewCount: 'desc' };
        break;
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({ where, orderBy, skip: params.skip, take: params.take }),
      prisma.job.count({ where }),
    ]);

    return { jobs, total };
  } catch (error) {
    logger.error('Get jobs error:', error);
    throw new Error('JOBS_FETCH_FAILED');
  }
}

export async function getJobById(jobId: string): Promise<any | null> {
  try {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (job) {
      await prisma.job.update({
        where: { id: jobId },
        data: { viewCount: { increment: 1 } },
      });
    }
    return job;
  } catch (error) {
    logger.error('Get job by ID error:', error);
    throw new Error('JOB_FETCH_FAILED');
  }
}

export async function createJob(data: Omit<any, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'favoriteCount' | 'applyCount' | 'status'>): Promise<any> {
  try {
    return await prisma.job.create({ data });
  } catch (error) {
    logger.error('Create job error:', error);
    throw new Error('JOB_CREATION_FAILED');
  }
}

export async function updateJob(jobId: string, data: Partial<any>): Promise<any> {
  try {
    return await prisma.job.update({ where: { id: jobId }, data });
  } catch (error) {
    logger.error('Update job error:', error);
    throw new Error('JOB_UPDATE_FAILED');
  }
}

export async function deleteJob(jobId: string): Promise<void> {
  try {
    await prisma.job.delete({ where: { id: jobId } });
  } catch (error) {
    logger.error('Delete job error:', error);
    throw new Error('JOB_DELETION_FAILED');
  }
}

export async function applyJob(jobId: string): Promise<void> {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { applyCount: { increment: 1 } } as any, // Prisma类型定义可能不完整
    });
  } catch (error) {
    logger.error('Apply job error:', error);
    throw new Error('JOB_APPLY_FAILED');
  }
}

// 求职信息相关功能
export async function getJobSeekingPosts(params: GetJobSeekingPostsParams): Promise<{ posts: any[]; total: number }> {
  try {
    const where: any = {};

    // 位置筛选
    if (params.location) {
      where.location = { contains: params.location };
    }

    // 关键词搜索
    if (params.keyword) {
      where.OR = [
        { name: { contains: params.keyword } },
        { position: { contains: params.keyword } },
        { skills: { contains: params.keyword } },
        { description: { contains: params.keyword } },
      ];
    }

    let orderBy: any = {};
    switch (params.sort) {
      case 'salary':
        orderBy = { salaryMax: 'desc' };
        break;
      case 'hot':
        orderBy = { viewCount: 'desc' };
        break;
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [posts, total] = await Promise.all([
      prisma.jobSeekingPost.findMany({ where, orderBy, skip: params.skip, take: params.take }),
      prisma.jobSeekingPost.count({ where }),
    ]);

    return { posts, total };
  } catch (error) {
    logger.error('Get job seeking posts error:', error);
    throw new Error('JOB_SEEKING_POSTS_FETCH_FAILED');
  }
}

export async function createJobSeekingPost(data: Omit<any, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'favoriteCount'>): Promise<any> {
  try {
    return await prisma.jobSeekingPost.create({ data });
  } catch (error) {
    logger.error('Create job seeking post error:', error);
    throw new Error('JOB_SEEKING_POST_CREATION_FAILED');
  }
}

export async function deleteJobSeekingPost(postId: string): Promise<void> {
  try {
    await prisma.jobSeekingPost.delete({ where: { id: postId } });
  } catch (error) {
    logger.error('Delete job seeking post error:', error);
    throw new Error('JOB_SEEKING_POST_DELETION_FAILED');
  }
}

export async function getMyPosts(userId: string): Promise<{ recruitment: any[]; jobseeking: any[] }> {
  try {
    const [recruitment, jobseeking] = await Promise.all([
      prisma.job.findMany({ 
        where: { 
          company: { contains: userId } 
        },
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.jobSeekingPost.findMany({ 
        where: { userId },
        orderBy: { createdAt: 'desc' } 
      }),
    ]);

    return { recruitment, jobseeking };
  } catch (error) {
    logger.error('Get my posts error:', error);
    throw new Error('MY_POSTS_FETCH_FAILED');
  }
}
