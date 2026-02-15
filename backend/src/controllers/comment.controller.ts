/**
 * 评论控制器
 */

import { Request, Response, NextFunction } from 'express';
import { createComment, getCommentsByPostId, likeComment } from '../services/comment.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess, sendError } from '../utils/response';
import { createUserAction } from '../services/user-action.service';

export async function createCommentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { postId, parentId, content } = req.body;

    if (!content || content.length < 1 || content.length > 1000) {
      return sendError(res, 1001, '评论长度必须在1-1000字符之间', 400);
    }

    const comment = await createComment({
      userId,
      postId,
      parentId,
      content,
    });

    // 记录用户评论行为
    createUserAction({
      userId,
      actionType: 'comment',
      contentType: 'post',
      contentId: postId,
      metadata: {
        commentId: comment.id,
        parentId: parentId || null,
        contentLength: content.length,
      },
    }).catch(err => {
      // 行为记录失败不影响主流程
    });

    sendSuccess(res, {
      commentId: comment.id,
      pointsEarned: 15,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCommentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { postId } = req.params;
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { comments, total } = await getCommentsByPostId(postId, skip, take);

    sendSuccess(res, {
      items: comments,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

export async function likeCommentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { commentId } = req.params;
    await likeComment(commentId, userId);

    sendSuccess(res, { message: '点赞成功' });
  } catch (error) {
    next(error);
  }
}
