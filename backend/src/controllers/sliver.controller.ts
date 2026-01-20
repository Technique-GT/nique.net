import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sliver from '../models/Sliver';
import { safeRegex, safeErrorResponse } from '../utils/security';

const SLIVER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const toObjectId = (id: string | string[] | undefined): mongoose.Types.ObjectId | null => {
  if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

export const createSliver = async (req: Request, res: Response): Promise<void> => {
  try {
    const textRaw = typeof req.body?.text === 'string' ? req.body.text : typeof req.body?.content === 'string' ? req.body.content : '';
    const text = textRaw.trim();

    if (!text) {
      res.status(400).json({ success: false, message: 'text is required' });
      return;
    }

    const expiresAt = new Date(Date.now() + SLIVER_TTL_MS);

    const sliver = await Sliver.create({ text, expiresAt });

    res.status(201).json({ success: true, data: sliver });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error creating sliver', error));
  }
};

export const getAllSlivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { active, page = 1, limit = 20, search, sortBy, sortDir } = req.query as unknown as {
      active?: boolean;
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: 'createdAt' | 'expiresAt' | 'text';
      sortDir?: 'asc' | 'desc';
    };

    const query: any = {};
    if (active === true) {
      query.expiresAt = { $gt: new Date() };
    } else if (active === false) {
      query.expiresAt = { $lte: new Date() };
    }

    if (typeof search === 'string' && search.trim().length > 0) {
      const rx = safeRegex(search.trim());
      query.text = rx;
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 20, 1);
    const skip = (pageNum - 1) * limitNum;

    const sortKey = sortBy ?? 'createdAt';
    const sortDirection = sortDir === 'asc' ? 1 : -1;

    const [slivers, total] = await Promise.all([
      Sliver.find(query).sort({ [sortKey]: sortDirection }).skip(skip).limit(limitNum).lean(),
      Sliver.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: slivers,
      count: slivers.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching slivers', error));
  }
};

export const deleteSliver = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid sliver ID' });
      return;
    }

    const sliver = await Sliver.findByIdAndDelete(objectId);
    if (!sliver) {
      res.status(404).json({ success: false, message: 'Sliver not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Sliver deleted successfully' });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error deleting sliver', error));
  }
};
