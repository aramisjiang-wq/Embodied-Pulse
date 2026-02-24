import { Router } from 'express';
import { 
  getPublicBilibiliUploaders,
  getPublicOverview,
  getPublicPublishTrend,
  getPublicPlayHeatmap,
  getPublicRankings,
  getPublicUploaderDetail,
  exportData
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkVipPermission } from '../middleware/vip-permission.middleware';

const router = Router();

const vipRouter = Router();

vipRouter.use(authenticate);
vipRouter.use(checkVipPermission('bilibili-analytics'));

vipRouter.get('/bilibili/uploaders', getPublicBilibiliUploaders);
vipRouter.get('/bilibili/overview', getPublicOverview);
vipRouter.get('/bilibili/publish-trend', getPublicPublishTrend);
vipRouter.get('/bilibili/play-heatmap', getPublicPlayHeatmap);
vipRouter.get('/bilibili/rankings', getPublicRankings);
vipRouter.get('/bilibili/uploader-detail', getPublicUploaderDetail);
vipRouter.get('/bilibili/export', exportData);

router.use('/', vipRouter);

export default router;
