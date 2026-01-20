import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Media from '../models/Media';
import { safeRegex, safeErrorResponse } from '../utils/security';

// Magic byte signatures for allowed file types
const MAGIC_SIGNATURES: { [key: string]: { bytes: number[]; offset?: number }[] } = {
  // Images
  'image/jpeg': [{ bytes: [0xFF, 0xD8, 0xFF] }],
  'image/png': [{ bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  'image/gif': [{ bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }],
  'image/webp': [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }],
  // Videos
  'video/mp4': [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }], // ftyp at offset 4
  'video/quicktime': [{ bytes: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74], offset: 4 }], // ftypqt
  // Documents
  'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  'application/msword': [{ bytes: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] }], // OLE compound
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [{ bytes: [0x50, 0x4B, 0x03, 0x04] }], // ZIP (docx)
};

/**
 * Validates file magic bytes against the declared mimetype.
 * Returns true if the file signature matches an allowed type.
 */
const validateMagicBytes = (filePath: string, declaredMime: string): boolean => {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // Check if declared mime has a known signature
    const signatures = MAGIC_SIGNATURES[declaredMime];
    if (!signatures) {
      // For types without magic bytes (text/plain), allow if mime was already validated
      if (declaredMime === 'text/plain' || declaredMime === 'video/mpeg') {
        return true;
      }
      return false;
    }

    // Check each possible signature for this mime type
    for (const sig of signatures) {
      const offset = sig.offset ?? 0;
      let matches = true;
      for (let i = 0; i < sig.bytes.length; i++) {
        if (buffer[offset + i] !== sig.bytes[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }

    return false;
  } catch {
    return false;
  }
};

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
    const uuid = require('uuid');
    const uniqueName = `${uuid.v4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

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

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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

const deleteFileByPath = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // ignore
  }
};

export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const { originalname, path: filePath, mimetype } = req.file;

    // Validate magic bytes after upload
    if (!validateMagicBytes(filePath, mimetype)) {
      // Delete the uploaded file since it failed validation
      deleteFileByPath(filePath);
      res.status(400).json({ 
        success: false, 
        message: 'File content does not match declared type. Upload rejected.' 
      });
      return;
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/${filePath}`;

    const media = await Media.create({
      url: fileUrl,
      altText: originalname || 'uploaded file',
    });

    res.status(201).json({ success: true, message: 'File uploaded successfully', data: media });
  } catch (error: any) {
    // Clean up file on error
    if (req.file?.path) {
      deleteFileByPath(req.file.path);
    }
    res.status(500).json(safeErrorResponse('Error uploading file', error));
  }
};

export const getMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search = '' } = req.query;

    const filter: any = {};
    if (typeof search === 'string' && search.trim().length > 0) {
      const rx = safeRegex(search.trim());
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
    res.status(500).json(safeErrorResponse('Error fetching media', error));
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
    res.status(500).json(safeErrorResponse('Error fetching media', error));
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
    res.status(500).json(safeErrorResponse('Error serving media', error));
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
    res.status(500).json(safeErrorResponse('Error deleting media', error));
  }
};

export const hardDeleteMedia = deleteMedia;
