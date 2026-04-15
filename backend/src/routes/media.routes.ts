import { Router } from 'express';
import multer from 'multer';
import { deleteMediaImage, getMediaImageUsage, listMediaImages, uploadMedia } from '../controllers/media.controller';
import { adminMiddleware } from '../middleware/admin.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);
router.get('/images', listMediaImages);
router.post('/upload', upload.single('file'), uploadMedia);
router.get('/:id/usage', adminMiddleware, getMediaImageUsage);
router.delete('/:id', adminMiddleware, deleteMediaImage);

export default router;
