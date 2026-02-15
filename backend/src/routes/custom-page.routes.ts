import { Router, Request, Response } from 'express';
import { customPageService } from '../services/custom-page.service';
import { success, error } from '../utils/response';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/list', async (req: Request, res: Response) => {
  try {
    const result = await customPageService.listActive();
    res.json(success(result));
  } catch (err: any) {
    console.error('List custom pages error:', err);
    res.status(500).json(error(err.message || '获取页面列表失败'));
  }
});

router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const page = await customPageService.getBySlug(req.params.slug);
    if (!page || !page.isActive) {
      res.status(404).json(error('页面不存在'));
      return;
    }
    res.json(success(page));
  } catch (err: any) {
    console.error('Get custom page error:', err);
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
    console.error('List custom pages error:', err);
    res.status(500).json(error(err.message || '获取页面列表失败'));
  }
});

router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = await customPageService.create(req.body);
    res.json(success(page));
  } catch (err: any) {
    console.error('Create custom page error:', err);
    res.status(500).json(error(err.message || '创建页面失败'));
  }
});

router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = await customPageService.update(req.params.id, req.body);
    res.json(success(page));
  } catch (err: any) {
    console.error('Update custom page error:', err);
    res.status(500).json(error(err.message || '更新页面失败'));
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await customPageService.delete(req.params.id);
    res.json(success(null));
  } catch (err: any) {
    console.error('Delete custom page error:', err);
    res.status(500).json(error(err.message || '删除页面失败'));
  }
});

router.get('/detail/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = await customPageService.getById(req.params.id);
    if (!page) {
      res.status(404).json(error('页面不存在'));
      return;
    }
    res.json(success(page));
  } catch (err: any) {
    console.error('Get custom page error:', err);
    res.status(500).json(error(err.message || '获取页面失败'));
  }
});

export default router;
