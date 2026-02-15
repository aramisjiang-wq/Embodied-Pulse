/**
 * 岗位控制器
 */

import { Request, Response, NextFunction } from 'express';
import { 
  getJobs, 
  getJobById, 
  createJob, 
  updateJob, 
  deleteJob,
  getJobSeekingPosts,
  createJobSeekingPost,
  deleteJobSeekingPost,
  getMyPosts
} from '../services/job.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess, sendError } from '../utils/response';
import { createUserAction } from '../services/user-action.service';

export async function getJobList(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { sort, location, keyword } = req.query;

    const { jobs, total } = await getJobs({
      skip,
      take,
      sort: sort as any,
      location: location as string,
      keyword: keyword as string,
    });

    sendSuccess(res, {
      items: jobs,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

export async function getJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = req.params;
    const job = await getJobById(jobId);

    if (!job) {
      return sendError(res, 1005, '岗位不存在', 404);
    }

    // 记录用户查看行为（如果已登录）
    if (req.user?.id) {
      createUserAction({
        userId: req.user.id,
        actionType: 'view',
        contentType: 'job',
        contentId: jobId,
        metadata: {
          title: job.title,
          company: job.company,
        },
      }).catch(err => {
        // 行为记录失败不影响主流程
      });
    }

    sendSuccess(res, job);
  } catch (error) {
    next(error);
  }
}

export async function createJobPost(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return sendError(res, 1002, '请先登录', 401);
    }

    const job = await createJob(req.body);
    sendSuccess(res, job);
  } catch (error) {
    next(error);
  }
}

export async function updateJobPost(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return sendError(res, 1002, '请先登录', 401);
    }

    const { jobId } = req.params;
    const job = await updateJob(jobId, req.body);
    sendSuccess(res, job);
  } catch (error) {
    next(error);
  }
}

export async function deleteJobPost(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return sendError(res, 1002, '请先登录', 401);
    }

    const { jobId } = req.params;
    await deleteJob(jobId);
    sendSuccess(res, { message: '删除成功' });
  } catch (error) {
    next(error);
  }
}

// 求职信息相关控制器
export async function getJobSeekingPostList(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { sort, location, keyword } = req.query;

    const { posts, total } = await getJobSeekingPosts({
      skip,
      take,
      sort: sort as any,
      location: location as string,
      keyword: keyword as string,
    });

    sendSuccess(res, {
      items: posts,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

export async function createJobSeekingPostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return sendError(res, 1002, '请先登录', 401);
    }

    const post = await createJobSeekingPost({
      ...req.body,
      userId: req.user.id,
    });
    sendSuccess(res, post);
  } catch (error) {
    next(error);
  }
}

export async function deleteJobSeekingPostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return sendError(res, 1002, '请先登录', 401);
    }

    const { postId } = req.params;
    await deleteJobSeekingPost(postId);
    sendSuccess(res, { message: '删除成功' });
  } catch (error) {
    next(error);
  }
}

export async function getMyPostsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return sendError(res, 1002, '请先登录', 401);
    }

    const posts = await getMyPosts(req.user.id);
    
    const allPosts = [
      ...posts.recruitment.map((job: any) => ({ ...job, type: 'recruitment' })),
      ...posts.jobseeking.map((post: any) => ({ ...post, type: 'jobseeking' })),
    ];

    sendSuccess(res, {
      items: allPosts,
      pagination: {
        total: allPosts.length,
        hasNext: false,
      },
    });
  } catch (error) {
    next(error);
  }
}
