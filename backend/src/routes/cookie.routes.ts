/**
 * Cookie管理路由
 */

import { Router } from 'express';
import { addCookie, removeCookie, getCookieStatus, rotateCookie } from '../controllers/cookie.controller';
import { adminAuthMiddleware } from '../middleware/admin-auth.middleware';

const router = Router();

router.use(adminAuthMiddleware);

router.post('/cookies', addCookie);
router.delete('/cookies/:id', removeCookie);
router.get('/cookies/status', getCookieStatus);
router.post('/cookies/rotate', rotateCookie);

export default router;