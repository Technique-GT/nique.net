import { Router } from 'express';
import multer from 'multer';
import { uploadMedia } from '../controllers/media.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);
router.post('/upload', upload.single('file'), uploadMedia);

export default router;
