"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.adminMiddleware = void 0;
/**
 * Middleware that requires the user to be an admin.
 * Must be used AFTER authMiddleware.
 */
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
    }
    if (!req.user.isAdmin) {
        res.status(403).json({ success: false, message: 'Admin access required' });
        return;
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
/**
 * Alias for adminMiddleware for readability in routes.
 */
exports.requireAdmin = exports.adminMiddleware;
