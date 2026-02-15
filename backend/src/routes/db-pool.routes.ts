import { Router, Request, Response } from 'express';
import dbPool from '../utils/db-pool';
import { logger } from '../utils/logger';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await dbPool.healthCheck();
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Database health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = dbPool.getStats();
    const poolInfo = await dbPool.getPoolInfo();

    res.json({
      ...stats,
      poolInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Database stats error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

router.post('/clear-stats', (req: Request, res: Response) => {
  try {
    dbPool.clearStats();
    res.json({
      message: 'Stats cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Clear stats error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
