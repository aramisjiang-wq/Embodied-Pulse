/**
 * 岗位服务
 */

import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

const prisma = userPrisma as any;

const JOB_EXPIRY_DAYS = 30;

function getExpiryDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + JOB_EXPIRY_DAYS);
  return date;
}

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

    if (params.location) {
      where.location = { contains: params.location };
    }

    if (params.keyword) {
      where.OR = [
        { title: { contains: params.keyword } },
        { company: { contains: params.keyword } },
        { description: { contains: params.keyword } },
      ];
    }

    const now = new Date();

    // 先查全部匹配记录，按过期状态分组再排序，实现过期岗位降权展示
    const allJobs = await prisma.job.findMany({
      where,
      orderBy: getOrderBy(params.sort),
    });

    const total = allJobs.length;

    // 未过期在前，已过期在后
    const active = allJobs.filter((j: any) => !j.expiresAt || new Date(j.expiresAt) > now);
    const expired = allJobs.filter((j: any) => j.expiresAt && new Date(j.expiresAt) <= now);
    const sorted = [...active, ...expired];

    const jobs = sorted.slice(params.skip, params.skip + params.take).map((j: any) => {
      const { apply_url, ...rest } = j;
      return {
        ...rest,
        applyUrl: apply_url ?? j.applyUrl,
        isExpired: j.expiresAt ? new Date(j.expiresAt) <= now : false,
      };
    });

    return { jobs, total };
  } catch (error: any) {
    logger.error('Get jobs error:', error);
    throw new Error('JOBS_FETCH_FAILED');
  }
}

function getOrderBy(sort?: string): any {
  switch (sort) {
    case 'salary':
      return { salaryMax: 'desc' };
    case 'hot':
      return { viewCount: 'desc' };
    case 'latest':
    default:
      return { createdAt: 'desc' };
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
      const now = new Date();
      const { apply_url, ...rest } = job;
      return {
        ...rest,
        applyUrl: apply_url ?? (job as any).applyUrl,
        isExpired: job.expiresAt ? new Date(job.expiresAt) <= now : false,
      };
    }
    return job;
  } catch (error) {
    logger.error('Get job by ID error:', error);
    throw new Error('JOB_FETCH_FAILED');
  }
}

export async function createJob(data: {
  userId: string;
  title: string;
  company: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  requirements?: string;
  tags?: string;
  apply_url?: string;
  experience?: string;
  education?: string;
  benefits?: string;
  [key: string]: unknown;
}): Promise<any> {
  try {
    const { userId, title, company, location, salaryMin, salaryMax, description, requirements, tags, apply_url, experience, education, benefits } = data;
    return await prisma.job.create({
      data: {
        userId,
        title,
        company,
        location,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        description,
        requirements,
        tags,
        apply_url,
        experience,
        education,
        benefits,
        status: 'open',
        expiresAt: getExpiryDate(),
      },
    });
  } catch (error) {
    logger.error('Create job error:', error);
    throw new Error('JOB_CREATION_FAILED');
  }
}

export async function updateJob(jobId: string, data: Partial<any>): Promise<any> {
  try {
    // 不允许外部覆盖 userId / expiresAt
    const { userId: _u, expiresAt: _e, id: _id, createdAt: _c, updatedAt: _up, viewCount: _v, favoriteCount: _f, ...safeData } = data;
    return await prisma.job.update({ where: { id: jobId }, data: safeData });
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
      data: { apply_count: { increment: 1 } },
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

    if (params.location) {
      where.expectedLocation = { contains: params.location };
    }

    if (params.keyword) {
      where.OR = [
        { name: { contains: params.keyword } },
        { targetPosition: { contains: params.keyword } },
        { skills: { contains: params.keyword } },
        { introduction: { contains: params.keyword } },
      ];
    }

    const now = new Date();
    const allPosts = await prisma.jobSeekingPost.findMany({
      where,
      orderBy: getOrderBy(params.sort),
    });

    const total = allPosts.length;

    const active = allPosts.filter((p: any) => !p.expiresAt || new Date(p.expiresAt) > now);
    const expired = allPosts.filter((p: any) => p.expiresAt && new Date(p.expiresAt) <= now);
    const sorted = [...active, ...expired];

    const posts = sorted.slice(params.skip, params.skip + params.take).map((p: any) => ({
      ...p,
      isExpired: p.expiresAt ? new Date(p.expiresAt) <= now : false,
    }));

    return { posts, total };
  } catch (error) {
    logger.error('Get job seeking posts error:', error);
    throw new Error('JOB_SEEKING_POSTS_FETCH_FAILED');
  }
}

export async function createJobSeekingPost(data: {
  userId: string;
  name: string;
  targetPosition: string;
  expectedLocation?: string;
  expectedSalary?: string;
  skills?: string;
  introduction?: string;
  [key: string]: unknown;
}): Promise<any> {
  try {
    const { userId, name, targetPosition, expectedLocation, expectedSalary, skills, introduction } = data;
    return await prisma.jobSeekingPost.create({
      data: {
        userId,
        name,
        targetPosition,
        expectedLocation,
        expectedSalary,
        skills,
        introduction,
        expiresAt: getExpiryDate(),
      },
    });
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
    const now = new Date();
    const [recruitment, jobseeking] = await Promise.all([
      prisma.job.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jobSeekingPost.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      recruitment: recruitment.map((j: any) => ({
        ...j,
        isExpired: j.expiresAt ? new Date(j.expiresAt) <= now : false,
      })),
      jobseeking: jobseeking.map((p: any) => ({
        ...p,
        isExpired: p.expiresAt ? new Date(p.expiresAt) <= now : false,
      })),
    };
  } catch (error) {
    logger.error('Get my posts error:', error);
    throw new Error('MY_POSTS_FETCH_FAILED');
  }
}
