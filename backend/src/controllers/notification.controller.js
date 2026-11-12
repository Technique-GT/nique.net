"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const notification_service_1 = require("../services/notification.service");
const security_1 = require("../utils/security");
const getNotifications = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
        const { notifications, total, unreadCount } = await notification_service_1.NotificationService.list(req.user.id, page, limit);
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
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Failed to fetch notifications', error));
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid notification ID' });
            return;
        }
        const notification = await notification_service_1.NotificationService.markAsRead(req.params.id, req.user.id);
        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }
        res.json({ success: true, data: notification });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Failed to mark notification as read', error));
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        await notification_service_1.NotificationService.markAllAsRead(req.user.id);
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Failed to mark all as read', error));
    }
};
exports.markAllAsRead = markAllAsRead;
