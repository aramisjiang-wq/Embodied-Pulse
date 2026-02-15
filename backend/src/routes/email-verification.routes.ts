import express from 'express';
import { sendVerificationCode, verifyCode } from '../controllers/email-verification.controller';

const router = express.Router();

router.post('/send', sendVerificationCode);
router.post('/verify', verifyCode);

export default router;
