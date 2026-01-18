import mongoose from 'mongoose';
import Notification, { INotification } from '../models/Notification';
import User from '../models/User';
import { logger } from '../utils/logger';

export class NotificationService {
  /**
   * Create a notification for a single user
   */
  static async create(
    recipientId: string | mongoose.Types.ObjectId,
    type: INotification['type'],
    title: string,
    message: string,
    link?: string,
    data?: Record<string, any>
  ) {
    try {
      return await Notification.create({
        recipientId,
        type,
        title,
        message,
        link,
        data,
      });
    } catch (error) {
      logger.error({ err: error, recipientId, type }, 'Failed to create notification');
      // Don't throw, just log. Notifications shouldn't break the main flow.
      return null;
    }
  }

  /**
   * Create notifications for multiple users (e.g. all admins)
   */
  static async notifyAdmins(
    type: INotification['type'],
    title: string,
    message: string,
    link?: string,
    data?: Record<string, any>
  ) {
    try {
      const admins = await User.find({ isAdmin: true }).select('_id');
      const notifications = admins.map(admin => ({
        recipientId: admin._id,
        type,
        title,
        message,
        link,
        data
      }));
      
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (error) {
      logger.error({ err: error, type }, 'Failed to notify admins');
    }
  }

  /**
   * Get notifications for a user
   */
  static async list(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipientId: userId })
    ]);
    
    const unreadCount = await Notification.countDocuments({ recipientId: userId, read: false });

    return { notifications, total, unreadCount };
  }

  /**
   * Mark as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { read: true },
      { new: true }
    );
  }

  /**
   * Mark all as read
   */
  static async markAllAsRead(userId: string) {
    return Notification.updateMany(
      { recipientId: userId, read: false },
      { read: true }
    );
  }
}
