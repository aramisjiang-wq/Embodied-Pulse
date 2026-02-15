import { Router } from 'express';
import { 
  getBilibiliUploaders,
  getOverview,
  getPublishTrend,
  getPlayHeatmap,
  getRankings,
  getUploaderDetail,
  exportData,
  getPublicBilibiliUploaders,
  getPublicOverview,
  getPublicPublishTrend,
  getPublicPlayHeatmap,
  getPublicRankings,
  getPublicUploaderDetail
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

const publicRouter = Router();
const privateRouter = Router();

privateRouter.use(authenticate);

publicRouter.get('/bilibili/uploaders', getPublicBilibiliUploaders);
publicRouter.get('/bilibili/overview', getPublicOverview);
publicRouter.get('/bilibili/publish-trend', getPublicPublishTrend);
publicRouter.get('/bilibili/play-heatmap', getPublicPlayHeatmap);
publicRouter.get('/bilibili/rankings', getPublicRankings);
publicRouter.get('/bilibili/uploader-detail', getPublicUploaderDetail);

privateRouter.get('/bilibili/uploaders', getBilibiliUploaders);
privateRouter.get('/bilibili/overview', getOverview);
privateRouter.get('/bilibili/publish-trend', getPublishTrend);
privateRouter.get('/bilibili/play-heatmap', getPlayHeatmap);
privateRouter.get('/bilibili/rankings', getRankings);
privateRouter.get('/bilibili/uploader-detail', getUploaderDetail);
privateRouter.get('/bilibili/export', exportData);

router.use('/', publicRouter);
router.use('/user', privateRouter);

export default router;
