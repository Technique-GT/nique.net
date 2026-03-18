import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import Article from '../models/Article';
import MediaAsset from '../models/MediaAsset';
import { CloudflareCacheService } from '../services/cloudflare-cache.service';
import { deleteFromR2, listR2Objects, uploadToR2 } from '../utils/r2';
import { env } from '../utils/env';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const MAX_SIZE = 10 * 1024 * 1024;
const MAX_LIST_LIMIT = 100;
const DEFAULT_LIST_LIMIT = 24;
const SYNC_BATCH_SIZE = 1000;
const SYNC_COOLDOWN_MS = 2 * 60 * 1000;
const DEFAULT_USAGE_LIMIT = 10;
const MAX_USAGE_LIMIT = 50;

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.avif',
]);

let syncPromise: Promise<void> | null = null;
let lastSyncAt = 0;

type SortBy = 'date' | 'size';
type SortDir = 'asc' | 'desc';

type MediaCursor = {
  sortBy: SortBy;
  sortDir: SortDir;
  q: string;
  lastSortValue: string | number;
  lastId: string;
};

type UsagePagination = {
  total: number;
  page: number;
  pages: number;
  limit: number;
};

function isImageKey(key: string): boolean {
  const lower = key.toLowerCase();
  return Array.from(IMAGE_EXTENSIONS).some((ext) => lower.endsWith(ext));
}

function buildMediaUrl(key: string): string {
  return `${(env.R2_PUBLIC_URL || '').replace(/\/$/, '')}/${key}`;
}

function getBaseFileName(key: string): string {
  return key.split('/').pop() || key;
}

function normalizeQuery(query: unknown): string {
  if (typeof query !== 'string') return '';
  return query.trim().toLowerCase();
}

function parsePositiveInt(input: unknown, fallback: number): number {
  const parsed = Number(input);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(Math.floor(parsed), 1);
}

function parseObjectId(id: unknown): mongoose.Types.ObjectId | null {
  if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePurgeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const normalizedPath = parsed.pathname
      .split('/')
      .map((segment, index) => {
        if (index === 0 || segment.length === 0) return segment;
        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch {
          return encodeURIComponent(segment);
        }
      })
      .join('/');

    parsed.pathname = normalizedPath;
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function encodeCursor(cursor: MediaCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function decodeCursor(raw?: string): {
  sortBy: SortBy;
  sortDir: SortDir;
  q: string;
  lastSortValue: string | number;
  lastId: mongoose.Types.ObjectId;
} | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as MediaCursor;
    if (parsed.sortBy !== 'date' && parsed.sortBy !== 'size') return null;
    if (parsed.sortDir !== 'asc' && parsed.sortDir !== 'desc') return null;
    if (typeof parsed.q !== 'string') return null;
    if (!mongoose.Types.ObjectId.isValid(parsed.lastId)) return null;
    if (parsed.sortBy === 'date') {
      const date = new Date(String(parsed.lastSortValue));
      if (Number.isNaN(date.getTime())) return null;
    }
    if (parsed.sortBy === 'size' && typeof parsed.lastSortValue !== 'number') return null;

    return {
      sortBy: parsed.sortBy,
      sortDir: parsed.sortDir,
      q: parsed.q,
      lastSortValue: parsed.lastSortValue,
      lastId: new mongoose.Types.ObjectId(parsed.lastId),
    };
  } catch {
    return null;
  }
}

async function syncMediaIndexFromR2(): Promise<void> {
  let cursor: string | undefined;

  do {
    const page = await listR2Objects({
      limit: SYNC_BATCH_SIZE,
      ...(cursor ? { cursor } : {}),
    });
    const imageObjects = page.items.filter((item) => isImageKey(item.key));

    if (imageObjects.length > 0) {
      const now = new Date();
      await MediaAsset.bulkWrite(
        imageObjects.map((item) => {
          const setPayload: Record<string, unknown> = {
            key: item.key,
            fileName: getBaseFileName(item.key),
            fileNameLower: getBaseFileName(item.key).toLowerCase(),
            url: buildMediaUrl(item.key),
            size: item.size,
            uploadedAt: item.lastModified ?? now,
          };
          if (item.etag !== undefined) setPayload.etag = item.etag;
          if (item.lastModified !== undefined) setPayload.lastModified = item.lastModified;

          return {
            updateOne: {
              filter: { key: item.key },
              update: {
                $set: setPayload,
              },
              upsert: true,
            },
          };
        }),
        { ordered: false },
      );
    }

    cursor = page.nextCursor ?? undefined;
  } while (cursor);
}

async function ensureMediaIndexFresh(force = false): Promise<void> {
  const isFresh = Date.now() - lastSyncAt < SYNC_COOLDOWN_MS;
  if (!force && isFresh) return;

  if (!syncPromise) {
    syncPromise = syncMediaIndexFromR2()
      .then(() => {
        lastSyncAt = Date.now();
      })
      .catch((error) => {
        console.error('Media index sync failed:', error);
      })
      .finally(() => {
        syncPromise = null;
      });
  }

  if (force) {
    await syncPromise;
  }
}

async function getMediaUsageByUrl(params: {
  mediaUrl: string;
  page: number;
  limit: number;
}): Promise<{
  articles: Array<{
    _id: string;
    title: string;
    slug: string;
    published: boolean;
    updatedAt: Date;
    reviewStatus?: string;
  }>;
  pagination: UsagePagination;
}> {
  const { mediaUrl, page, limit } = params;
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    Article.find({ featuredMediaUrl: mediaUrl })
      .select('_id title slug published updatedAt reviewStatus')
      .sort({ updatedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Article.countDocuments({ featuredMediaUrl: mediaUrl }),
  ]);

  return {
    articles: rows.map((row) => ({
      _id: String(row._id),
      title: row.title,
      slug: row.slug,
      published: !!row.published,
      updatedAt: row.updatedAt,
      reviewStatus: row.reviewStatus,
    })),
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
}

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
        message: 'File too large. Maximum size is 10 MB.',
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
    const nowForMeta = new Date();

    await MediaAsset.updateOne(
      { key },
      {
        $set: {
          key,
          fileName: getBaseFileName(key),
          fileNameLower: getBaseFileName(key).toLowerCase(),
          url,
          contentType: file.mimetype,
          size: file.size,
          uploadedAt: nowForMeta,
          lastModified: nowForMeta,
        },
      },
      { upsert: true },
    );

    res.json({ success: true, data: { url, key } });
  } catch (error: any) {
    console.error('Media upload failed:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

export const listMediaImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limitRaw = Number(req.query.limit);
    const limit = Math.min(Math.max(Number.isNaN(limitRaw) ? DEFAULT_LIST_LIMIT : limitRaw, 1), MAX_LIST_LIMIT);
    const cursorRaw = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const forceSync = req.query.refresh === 'true';
    const q = normalizeQuery(req.query.q);
    const sortByRaw = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'date';
    const sortDirRaw = typeof req.query.sortDir === 'string' ? req.query.sortDir : 'desc';
    const sortBy: SortBy = sortByRaw === 'size' ? 'size' : 'date';
    const sortDir: SortDir = sortDirRaw === 'asc' ? 'asc' : 'desc';
    const cursor = decodeCursor(cursorRaw);

    if (cursorRaw && !cursor) {
      res.status(400).json({ success: false, message: 'Invalid cursor' });
      return;
    }
    if (cursor && (cursor.sortBy !== sortBy || cursor.sortDir !== sortDir || cursor.q !== q)) {
      res.status(400).json({ success: false, message: 'Cursor does not match current search/sort' });
      return;
    }

    await ensureMediaIndexFresh(forceSync);

    const sortField = sortBy === 'size' ? 'size' : 'uploadedAt';
    const sortDirection = sortDir === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDirection, _id: sortDirection } as Record<string, 1 | -1>;

    const filterClauses: Record<string, unknown>[] = [];
    if (q) {
      filterClauses.push({
        fileNameLower: { $regex: escapeRegex(q) },
      });
    }

    if (cursor) {
      const comparison = sortDir === 'asc' ? '$gt' : '$lt';
      if (sortBy === 'date') {
        const cursorDate = new Date(String(cursor.lastSortValue));
        filterClauses.push({
          $or: [
            { uploadedAt: { [comparison]: cursorDate } },
            { uploadedAt: cursorDate, _id: { [comparison]: cursor.lastId } },
          ],
        });
      } else {
        const cursorSize = Number(cursor.lastSortValue);
        filterClauses.push({
          $or: [
            { size: { [comparison]: cursorSize } },
            { size: cursorSize, _id: { [comparison]: cursor.lastId } },
          ],
        });
      }
    }

    let filter: Record<string, unknown> = {};
    if (filterClauses.length === 1) {
      filter = filterClauses[0] as Record<string, unknown>;
    } else if (filterClauses.length > 1) {
      filter = { $and: filterClauses };
    }

    const rows = await MediaAsset.find(filter)
      .sort(sort)
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor = hasMore && last
      ? encodeCursor({
          sortBy,
          sortDir,
          q,
          lastSortValue: sortBy === 'date' ? new Date(last.uploadedAt).toISOString() : last.size,
          lastId: String(last._id),
        })
      : null;

    const data = page.map((item) => ({
      _id: String(item._id),
      key: item.key,
      fileName: item.fileName,
      url: item.url,
      contentType: item.contentType,
      size: item.size,
      etag: item.etag,
      uploadedAt: item.uploadedAt,
      lastModified: item.lastModified ?? item.uploadedAt,
    }));

    res.json({
      success: true,
      data,
      pagination: {
        limit,
        hasMore,
        nextCursor,
      },
    });
  } catch (error: any) {
    console.error('Failed to list media images:', error);
    res.status(500).json({ success: false, message: 'Failed to load images' });
  }
};

export const getMediaImageUsage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mediaId = parseObjectId(req.params.id);
    if (!mediaId) {
      res.status(400).json({ success: false, message: 'Invalid media id' });
      return;
    }

    const media = await MediaAsset.findById(mediaId).lean();
    if (!media) {
      res.status(404).json({ success: false, message: 'Media not found' });
      return;
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_USAGE_LIMIT), MAX_USAGE_LIMIT);
    const usage = await getMediaUsageByUrl({ mediaUrl: media.url, page, limit });

    res.json({
      success: true,
      data: usage.articles,
      pagination: usage.pagination,
    });
  } catch (error: any) {
    console.error('Failed to fetch media usage:', error);
    res.status(500).json({ success: false, message: 'Failed to load media usage' });
  }
};

export const deleteMediaImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mediaId = parseObjectId(req.params.id);
    if (!mediaId) {
      res.status(400).json({ success: false, message: 'Invalid media id' });
      return;
    }

    const media = await MediaAsset.findById(mediaId).lean();
    if (!media) {
      res.status(404).json({ success: false, message: 'Media not found' });
      return;
    }

    const confirmInUse = req.query.confirmInUse === 'true' || req.query.confirmInUse === '1';
    const usage = await getMediaUsageByUrl({
      mediaUrl: media.url,
      page: 1,
      limit: DEFAULT_USAGE_LIMIT,
    });

    if (usage.pagination.total > 0 && !confirmInUse) {
      res.status(409).json({
        success: false,
        message: 'Image is currently used by existing articles',
        data: usage.articles,
        pagination: usage.pagination,
      });
      return;
    }

    await deleteFromR2(media.key);
    await MediaAsset.deleteOne({ _id: mediaId });
    try {
      await CloudflareCacheService.purgeUrls([normalizePurgeUrl(media.url)]);
    } catch (purgeError) {
      console.error('Cloudflare media purge failed after delete:', purgeError);
    }

    res.json({
      success: true,
      data: {
        _id: String(media._id),
        key: media.key,
        url: media.url,
        usageCount: usage.pagination.total,
      },
    });
  } catch (error: any) {
    console.error('Failed to delete media image:', error);
    res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
};
