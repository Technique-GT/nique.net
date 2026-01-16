import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sliver from '../models/Sliver';

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
    res.status(500).json({ success: false, message: 'Error creating sliver', error: error?.message });
  }
};

export const getAllSlivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { active } = req.query as unknown as { active?: boolean };

    const query: any = {};
    if (active === true) {
      query.expiresAt = { $gt: new Date() };
    }

    const slivers = await Sliver.find(query).sort({ createdAt: -1 }).lean();

    res.status(200).json({ success: true, data: slivers, count: slivers.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching slivers', error: error?.message });
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
    res.status(500).json({ success: false, message: 'Error deleting sliver', error: error?.message });
  }
};
