/**
 * 数据源管理路由
 */

import { Router } from 'express';
import {
  initDataSources,
  getDataSources,
  getDataSource,
  updateDataSourceConfig,
  toggleDataSourceStatus,
  checkHealth,
  checkAllHealth,
  getLogs,
} from '../controllers/data-source.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// 所有路由都需要管理员权限
router.use(authenticate);
router.use(requireAdmin);

// 初始化数据源
router.post('/init', initDataSources);

// 获取所有数据源
router.get('/', getDataSources);

// 检查所有数据源健康状态
router.get('/health/all', checkAllHealth);

// 获取单个数据源
router.get('/:id', getDataSource);

// 更新数据源配置
router.put('/:id', updateDataSourceConfig);

// 切换数据源启用状态
router.patch('/:id/toggle', toggleDataSourceStatus);

// 检查单个数据源健康状态
router.get('/:id/health', checkHealth);

// 获取数据源日志
router.get('/:id/logs', getLogs);

export default router;
