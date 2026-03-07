import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Middleware that requires the user to be an admin.
 * Must be used AFTER authMiddleware.
 */
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
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

/**
 * Alias for adminMiddleware for readability in routes.
 */
export const requireAdmin = adminMiddleware;
