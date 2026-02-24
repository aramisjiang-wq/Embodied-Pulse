import { Router, Request, Response } from 'express';
import { customPageService } from '../services/custom-page.service';
import { success, error } from '../utils/response';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

router.get('/list', async (req: Request, res: Response) => {
  try {
    const result = await customPageService.listActive();
    res.json(success(result));
  } catch (err: any) {
    logger.error('List custom pages error:', err);
    res.status(500).json(error(err.message || '获取页面列表失败'));
  }
});

router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug || typeof slug !== 'string') {
      res.status(400).json(error('无效的页面标识'));
      return;
    }

    const page = await customPageService.getBySlug(slug);
    if (!page || !page.isActive) {
      res.status(404).json(error('页面不存在'));
      return;
    }
    res.json(success(page));
  } catch (err: any) {
    logger.error('Get custom page error:', err);
    res.status(500).json(error(err.message || '获取页面失败'));
  }
});

router.get('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page, size, isActive } = req.query;
    const result = await customPageService.list({
      page: page ? parseInt(page as string) : 1,
      size: size ? parseInt(size as string) : 20,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
    res.json(success(result));
  } catch (err: any) {
    logger.error('List custom pages error:', err);
    res.status(500).json(error(err.message || '获取页面列表失败'));
  }
});

router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = await customPageService.create(req.body);
    res.json(success(page));
  } catch (err: any) {
    logger.error('Create custom page error:', err);
    if (err.message.includes('已存在') || err.message.includes('不能为空') || err.message.includes('不能超过') || err.message.includes('只能包含') || err.message.includes('必须')) {
      res.status(400).json(error(err.message));
    } else {
      res.status(500).json(error(err.message || '创建页面失败'));
    }
  }
});

router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json(error('无效的页面ID'));
      return;
    }

    const page = await customPageService.update(id, req.body);
    res.json(success(page));
  } catch (err: any) {
    logger.error('Update custom page error:', err);
    if (err.message.includes('不存在') || err.message.includes('已存在') || err.message.includes('不能为空') || err.message.includes('不能超过') || err.message.includes('只能包含') || err.message.includes('必须') || err.message.includes('无效')) {
      res.status(400).json(error(err.message));
    } else {
      res.status(500).json(error(err.message || '更新页面失败'));
    }
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json(error('无效的页面ID'));
      return;
    }

    await customPageService.delete(id);
    res.json(success(null, '删除成功'));
  } catch (err: any) {
    logger.error('Delete custom page error:', err);
    if (err.message.includes('不存在') || err.message.includes('无效')) {
      res.status(400).json(error(err.message));
    } else {
      res.status(500).json(error(err.message || '删除页面失败'));
    }
  }
});

router.get('/detail/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json(error('无效的页面ID'));
      return;
    }

    const page = await customPageService.getById(id);
    if (!page) {
      res.status(404).json(error('页面不存在'));
      return;
    }
    res.json(success(page));
  } catch (err: any) {
    logger.error('Get custom page error:', err);
    res.status(500).json(error(err.message || '获取页面失败'));
  }
});

export default router;
