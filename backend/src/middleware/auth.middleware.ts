import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import RevokedToken from '../models/RevokedToken';
import { hashToken } from '../utils/security';

export interface AuthRequest extends Request {
  user?: any;
}

export const getTokenFromRequest = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  if (typeof req.cookies?.jwt === 'string' && req.cookies.jwt.trim()) {
    return req.cookies.jwt.trim();
  }
  return null;
};

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = getTokenFromRequest(req);

  if (!token) {
    res.status(401).json({ message: 'No token provided, authorization denied' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN as string);
    req.user = decoded;
    const tokenHash = hashToken(token);
    const revoked = await RevokedToken.exists({ tokenHash });
    if (revoked) {
      res.status(401).json({ message: 'Token has been revoked' });
      return;
    }
    next();
  } catch (_err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const protect = authMiddleware;
