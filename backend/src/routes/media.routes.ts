import express from 'express';
import {
  uploadMedia,
  getMedia,
  getMediaById,
  deleteMedia,
  hardDeleteMedia,
  serveMedia,
  uploadMiddleware,
} from '../controllers/media.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes (read-only)
router.get('/', getMedia);
router.get('/:id', getMediaById);
router.get('/file/:id', serveMedia);

// Protected routes (require authentication)
router.post('/upload', authMiddleware, uploadMiddleware.single('file'), uploadMedia);
router.delete('/:id', authMiddleware, deleteMedia);
router.delete('/:id/hard', authMiddleware, hardDeleteMedia);

export default router;
