import { Response } from 'express';
import mongoose from 'mongoose';
import { NotificationService } from '../services/notification.service';
import { safeErrorResponse } from '../utils/security';

export const getNotifications = async (req: any, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    
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
    res.status(500).json(safeErrorResponse('Failed to fetch notifications', error));
  }
};

export const markAsRead = async (req: any, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid notification ID' });
      return;
    }

    const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    res.json({ success: true, data: notification });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Failed to mark notification as read', error));
  }
};

export const markAllAsRead = async (req: any, res: Response): Promise<void> => {
  try {
    await NotificationService.markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Failed to mark all as read', error));
  }
};
