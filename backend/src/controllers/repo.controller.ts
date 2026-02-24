/**
 * GitHub仓库控制器
 */

import { Request, Response, NextFunction } from 'express';
import { getRepos, getRepoById, getRepoCounts, createRepo as createRepoService } from '../services/repo.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess, sendError } from '../utils/response';
import { createUserAction } from '../services/user-action.service';

/** 将 query 中的 category 规范为 string（Express 可能传 string 或 string[]） */
function normalizeCategory(category: unknown): string | undefined {
  if (category == null || category === '') return undefined;
  if (Array.isArray(category)) return (category[0] && String(category[0]).trim()) || undefined;
  const s = String(category).trim();
  return s === '' || s === 'undefined' ? undefined : s;
}

export async function getRepoList(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { sort, language, keyword, domain, scenario, category } = req.query;

    const { repos, total } = await getRepos({
      skip,
      take,
      sort: sort as any,
      language: language as string,
      keyword: keyword as string,
      domain: domain as string,
      scenario: scenario as string,
      category: normalizeCategory(category),
    });

    sendSuccess(res, {
      items: repos,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRepoCountsController(req: Request, res: Response, next: NextFunction) {
  try {
    const counts = await getRepoCounts();
    sendSuccess(res, counts);
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

    try {
      const repo = await createRepoService({
        ...repoData,
        addedBy: `user:${req.user.id}`,
        notifyEnabled: true,
      });
      sendSuccess(res, repo, '创建成功');
    } catch (err: any) {
      if (err.message === 'REPO_ALREADY_EXISTS') {
        return sendError(res, 1007, '该项目已在列表中，无需重复提交', 409);
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
}
