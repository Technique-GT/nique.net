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

const router = express.Router();

// GET routes
router.get('/', getMedia);
router.get('/:id', getMediaById);
router.get('/file/:id', serveMedia);

// POST routes
router.post('/upload', uploadMiddleware.single('file'), uploadMedia);

// DELETE routes
router.delete('/:id', deleteMedia);
router.delete('/:id/hard', hardDeleteMedia);

export default router;