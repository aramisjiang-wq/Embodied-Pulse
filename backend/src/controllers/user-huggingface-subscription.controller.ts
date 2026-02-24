/**
 * 用户端HuggingFace订阅控制器
 */

import { Request, Response, NextFunction } from 'express';
import {
  getUserSubscriptions,
  subscribePapers,
  unsubscribePapers,
  subscribeAuthor,
  unsubscribeAuthor,
} from '../services/user-huggingface-subscription.service';
import { getHuggingFaceModels } from '../services/huggingface.service';
import { sendSuccess, sendError } from '../utils/response';

export async function getMySubscriptions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', '请先登录');
    }

    const subscriptions = await getUserSubscriptions(userId);
    sendSuccess(res, subscriptions);
  } catch (error) {
    next(error);
  }
}

export async function subscribeHuggingFacePapers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', '请先登录');
    }

    const result = await subscribePapers(userId);
    if (result.success) {
      sendSuccess(res, { message: result.message });
    } else {
      sendError(res, 'SUBSCRIBE_FAILED', result.message || '订阅失败');
    }
  } catch (error) {
    next(error);
  }
}

export async function unsubscribeHuggingFacePapers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', '请先登录');
    }

    const result = await unsubscribePapers(userId);
    if (result.success) {
      sendSuccess(res, { message: result.message });
    } else {
      sendError(res, 'UNSUBSCRIBE_FAILED', result.message || '取消订阅失败');
    }
  } catch (error) {
    next(error);
  }
}

export async function subscribeHuggingFaceAuthor(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', '请先登录');
    }

    const { author, authorUrl } = req.body;
    if (!author) {
      return sendError(res, 'INVALID_PARAMS', '请提供作者名称');
    }

    const result = await subscribeAuthor(userId, author, authorUrl);
    if (result.success) {
      sendSuccess(res, { message: result.message });
    } else {
      sendError(res, 'SUBSCRIBE_FAILED', result.message || '订阅失败');
    }
  } catch (error) {
    next(error);
  }
}

export async function unsubscribeHuggingFaceAuthor(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', '请先登录');
    }

    const { subscriptionId } = req.params;
    if (!subscriptionId) {
      return sendError(res, 'INVALID_PARAMS', '请提供订阅ID');
    }

    const result = await unsubscribeAuthor(userId, subscriptionId);
    if (result.success) {
      sendSuccess(res, { message: result.message });
    } else {
      sendError(res, 'UNSUBSCRIBE_FAILED', result.message || '取消订阅失败');
    }
  } catch (error) {
    next(error);
  }
}

/**
 * 获取订阅作者的新内容
 */
export async function getSubscribedAuthorsContent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', '请先登录');
    }

    const subscriptions = await getUserSubscriptions(userId);
    
    // 获取所有订阅作者的最新内容
    const authorContents: Array<{
      author: string;
      authorUrl: string;
      items: any[];
      total: number;
    }> = [];

    for (const authorSub of subscriptions.authors) {
      if (!authorSub.isActive) continue;
      
      const { models, total } = await getHuggingFaceModels({
        skip: 0,
        take: 10,
        sort: 'latest',
        author: authorSub.author,
      });

      authorContents.push({
        author: authorSub.author,
        authorUrl: authorSub.authorUrl || `https://huggingface.co/${authorSub.author}`,
        items: models,
        total,
      });
    }

    sendSuccess(res, { authors: authorContents });
  } catch (error) {
    next(error);
  }
}
