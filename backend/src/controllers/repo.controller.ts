/**
 * GitHub仓库控制器
 */

import { Request, Response, NextFunction } from 'express';
import { getRepos, getRepoById, createRepo as createRepoService } from '../services/repo.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess, sendError } from '../utils/response';
import { createUserAction } from '../services/user-action.service';

export async function getRepoList(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { sort, language, keyword, domain, scenario } = req.query;

    const { repos, total } = await getRepos({
      skip,
      take,
      sort: sort as any,
      language: language as string,
      keyword: keyword as string,
      domain: domain as string,
      scenario: scenario as string,
    });

    sendSuccess(res, {
      items: repos,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRepo(req: Request, res: Response, next: NextFunction) {
  try {
    const { repoId } = req.params;
    const repo = await getRepoById(repoId);

    if (!repo) {
      return sendError(res, 1005, 'GitHub项目不存在', 404);
    }

    if (req.user?.id) {
      createUserAction({
        userId: req.user.id,
        actionType: 'view',
        contentType: 'repo',
        contentId: repoId,
        metadata: {
          name: repo.name,
          fullName: repo.fullName,
        },
      }).catch(err => {
      });
    }

    sendSuccess(res, repo);
  } catch (error) {
    next(error);
  }
}

export async function createRepo(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return sendError(res, 1002, '未登录', 401);
    }

    const repoData = req.body;
    
    const repo = await createRepoService({
      ...repoData,
      addedBy: `user:${req.user.id}`,
      notifyEnabled: true,
    });

    sendSuccess(res, repo, '创建成功');
  } catch (error) {
    next(error);
  }
}
