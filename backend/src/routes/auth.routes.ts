import express from 'express';

import {
  getCurrentUser,
  googleAuth,
  googleAuthCallback,
  logout
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

router.post('/logout', logout);

router.get('/me', authMiddleware, getCurrentUser);

export default router;
