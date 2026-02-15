/**
 * 收藏路由
 */

import { Router } from 'express';
import { createFavoriteHandler, deleteFavoriteHandler, getFavoritesHandler } from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createFavoriteHandler);
router.delete('/:contentType/:contentId', authenticate, deleteFavoriteHandler);
router.get('/', authenticate, getFavoritesHandler);

export default router;
