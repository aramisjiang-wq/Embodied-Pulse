import { Router, Request, Response } from 'express';
import { TechDebtService } from '../services/tech-debt.service';
import { SystemHealthService } from '../services/system-health.service';
import { success, error } from '../utils/response';

const router = Router();

router.get('/tech-debt', async (req: Request, res: Response) => {
  try {
    const { type, severity, status, page, size } = req.query;
    const result = await TechDebtService.getList({
      type: type as string,
      severity: severity as string,
      status: status as string,
      page: page ? parseInt(page as string) : 1,
      size: size ? parseInt(size as string) : 20,
    });
    res.json(success(result));
  } catch (err: unknown) {
    res.status(500).json(error(err instanceof Error ? err.message : '获取技术债务失败'));
  }
});

router.get('/tech-debt/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await TechDebtService.getStats();
    res.json(success(stats));
  } catch (err: unknown) {
    res.status(500).json(error(err instanceof Error ? err.message : '获取统计失败'));
  }
});

router.post('/tech-debt', async (req: Request, res: Response) => {
  try {
    const item = await TechDebtService.create(req.body);
    res.json(success(item));
  } catch (err: unknown) {
    res.status(500).json(error(err instanceof Error ? err.message : '创建技术债务失败'));
  }
});

router.put('/tech-debt/:id', async (req: Request, res: Response) => {
  try {
    const item = await TechDebtService.update(req.params.id, req.body);
    if (!item) {
      return res.status(404).json(error('技术债务不存在'));
    }
    res.json(success(item));
  } catch (err: unknown) {
    res.status(500).json(error(err instanceof Error ? err.message : '更新技术债务失败'));
  }
});

router.delete('/tech-debt/:id', async (req: Request, res: Response) => {
  try {
    const result = await TechDebtService.delete(req.params.id);
    if (!result) {
      return res.status(404).json(error('技术债务不存在'));
    }
    res.json(success(null));
  } catch (err: unknown) {
    res.status(500).json(error(err instanceof Error ? err.message : '删除技术债务失败'));
  }
});

router.post('/tech-debt/scan', async (_req: Request, res: Response) => {
  try {
    const [dependencies, vulnerabilities] = await Promise.all([
      TechDebtService.scanDependencies(),
      TechDebtService.scanVulnerabilities(),
    ]);
    res.json(success({
      dependencies: dependencies.length,
      vulnerabilities: vulnerabilities.length,
      items: [...dependencies, ...vulnerabilities],
    }));
  } catch (err: unknown) {
    res.status(500).json(error(err instanceof Error ? err.message : '扫描失败'));
  }
});

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await SystemHealthService.runAllChecks();
    res.json(success(health));
  } catch (err: unknown) {
    res.status(500).json(error(err instanceof Error ? err.message : '健康检查失败'));
  }
});

router.get('/health/latest', async (_req: Request, res: Response) => {
  try {
    const health = await SystemHealthService.getLatestHealth();
    res.json(success(health));
  } catch (err: unknown) {
    res.status(500).json(error(err instanceof Error ? err.message : '获取健康状态失败'));
  }
});

router.get('/health/history', async (req: Request, res: Response) => {
  try {
    const { component, hours, limit } = req.query;
    const history = await SystemHealthService.getHealthHistory({
      component: component as string,
      hours: hours ? parseInt(hours as string) : 24,
      limit: limit ? parseInt(limit as string) : 100,
    });
    res.json(success(history));
  } catch (err: unknown) {
    res.status(500).json(error(err instanceof Error ? err.message : '获取历史记录失败'));
  }
});

export default router;
