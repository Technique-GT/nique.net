import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Media from '../models/Media';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = 'uploads/media';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const uuid = require('uuid');
    const uniqueName = `${uuid.v4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type'));
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const maybeDeleteUploadedFile = (url: string) => {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
    if (!pathname.startsWith('uploads/')) return;

    if (fs.existsSync(pathname)) {
      fs.unlinkSync(pathname);
    }
  } catch {
    // ignore best-effort cleanup
  }
};

export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const { originalname, path: filePath } = req.file;

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/${filePath}`;

    const media = await Media.create({
      url: fileUrl,
      altText: originalname || 'uploaded file',
    });

    res.status(201).json({ success: true, message: 'File uploaded successfully', data: media });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error uploading file', error: error?.message });
  }
};

export const getMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search = '' } = req.query;

    const filter: any = {};
    if (typeof search === 'string' && search.trim().length > 0) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ altText: rx }, { url: rx }];
    }

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit as string, 10) || 20, 1);
    const skip = (pageNum - 1) * limitNum;

    const [media, total] = await Promise.all([
      Media.find(filter).sort({ _id: -1 }).skip(skip).limit(limitNum).lean(),
      Media.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: media,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching media', error: error?.message });
  }
};

export const getMediaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      res.status(404).json({ success: false, message: 'Media not found' });
      return;
    }

    res.status(200).json({ success: true, data: media });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching media', error: error?.message });
  }
};

export const serveMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      res.status(404).json({ success: false, message: 'Media not found' });
      return;
    }

    res.redirect(media.url);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error serving media', error: error?.message });
  }
};

export const deleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const media = await Media.findByIdAndDelete(req.params.id);
    if (!media) {
      res.status(404).json({ success: false, message: 'Media not found' });
      return;
    }

    maybeDeleteUploadedFile(media.url);

    res.status(200).json({ success: true, message: 'Media deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deleting media', error: error?.message });
  }
};

export const hardDeleteMedia = deleteMedia;
