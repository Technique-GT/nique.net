"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = require("../utils/logger");
class NotificationService {
    /**
     * Create a notification for a single user
     */
    static async create(recipientId, type, title, message, link, data) {
        try {
            return await Notification_1.default.create({
                recipientId,
                type,
                title,
                message,
                link,
                data,
            });
        }
        catch (error) {
            logger_1.logger.error({ err: error, recipientId, type }, 'Failed to create notification');
            // Don't throw, just log. Notifications shouldn't break the main flow.
            return null;
        }
    }
    /**
     * Create notifications for multiple users (e.g. all admins)
     */
    static async notifyAdmins(type, title, message, link, data) {
        try {
            const admins = await User_1.default.find({ isAdmin: true }).select('_id');
            const notifications = admins.map(admin => ({
                recipientId: admin._id,
                type,
                title,
                message,
                link,
                data
            }));
            if (notifications.length > 0) {
                await Notification_1.default.insertMany(notifications);
            }
        }
        catch (error) {
            logger_1.logger.error({ err: error, type }, 'Failed to notify admins');
        }
    }
    /**
     * Get notifications for a user
     */
    static async list(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total, unreadCount] = await Promise.all([
            Notification_1.default.find({ recipientId: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification_1.default.countDocuments({ recipientId: userId }),
            Notification_1.default.countDocuments({ recipientId: userId, read: false })
        ]);
        return { notifications, total, unreadCount };
    }
    /**
     * Mark as read
     */
    static async markAsRead(notificationId, userId) {
        return Notification_1.default.findOneAndUpdate({ _id: notificationId, recipientId: userId }, { read: true }, { new: true });
    }
    /**
     * Mark all as read
     */
    static async markAllAsRead(userId) {
        return Notification_1.default.updateMany({ recipientId: userId, read: false }, { read: true });
    }
}
exports.NotificationService = NotificationService;
