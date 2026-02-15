import express from 'express';
import {
  requestPasswordReset,
  resetPassword,
  validateResetToken,
} from '../controllers/password-reset.controller';

const router = express.Router();

router.post('/request', requestPasswordReset);
router.post('/reset', resetPassword);
router.get('/validate/:token', validateResetToken);

export default router;
