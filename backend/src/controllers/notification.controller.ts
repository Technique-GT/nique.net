import { Response } from 'express';
import { NotificationService } from '../services/notification.service';

export const getNotifications = async (req: any, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    
    const { notifications, total, unreadCount } = await NotificationService.list(req.user.id, page, limit);
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      metadata: {
        unreadCount
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
};

export const markAsRead = async (req: any, res: Response): Promise<void> => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    res.json({ success: true, data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read', error: error.message });
  }
};

export const markAllAsRead = async (req: any, res: Response): Promise<void> => {
  try {
    await NotificationService.markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read', error: error.message });
  }
};
