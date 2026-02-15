/**
 * 视频路由
 */

import { Router } from 'express';
import { getVideoList, getVideo, getUploaders } from '../controllers/video.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';
import { validatePagination, validateKeyword, validateId } from '../middleware/validation.middleware';

const router = Router();

router.get('/', validatePagination, validateKeyword, optionalAuthenticate, getVideoList);
router.get('/uploaders', getUploaders);
router.get('/:videoId', validateId, optionalAuthenticate, getVideo);

export default router;
