import { Response } from 'express';
import { uploadToR2 } from '../utils/r2';
import { AuthRequest } from '../middleware/auth.middleware';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const MAX_SIZE = 100 * 1024 * 1024;

export const uploadMedia = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }

    if (!ALLOWED_TYPES.has(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG.',
      });
      return;
    }

    if (file.size > MAX_SIZE) {
      res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100 MB.',
      });
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sanitized = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
    const key = `${year}/${month}/${sanitized}`;
    const url = await uploadToR2(file.buffer, key, file.mimetype);

    res.json({ success: true, data: { url, key } });
  } catch (error: any) {
    console.error('Media upload failed:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};
