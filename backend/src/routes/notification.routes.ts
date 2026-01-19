import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

router.get('/', protect, notificationController.getNotifications);
router.patch('/:id/read', protect, notificationController.markAsRead);
router.post('/read-all', protect, notificationController.markAllAsRead);

export default router;
