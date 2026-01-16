import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Tag from '../models/Tag';

const toObjectId = (id: string | string[] | undefined): mongoose.Types.ObjectId | null => {
  if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const createTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const nameRaw = typeof req.body?.name === 'string' ? req.body.name : '';
    const name = nameRaw.trim();
    if (!name) {
      res.status(400).json({ success: false, message: 'Tag name is required' });
      return;
    }

    const slug = typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0 ? req.body.slug.trim() : slugify(name);

    const existing = await Tag.findOne({ $or: [{ slug }, { name: { $regex: new RegExp(`^${name}$`, 'i') } }] });
    if (existing) {
      res.status(409).json({ success: false, message: 'Tag with this name or slug already exists' });
      return;
    }

    const tag = await Tag.create({ name, slug });
    res.status(201).json({ success: true, message: 'Tag created successfully', data: tag });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ success: false, message: 'Tag with this slug already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error', error: error?.message });
  }
};

export const getTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const query: any = {};
    if (typeof search === 'string' && search.trim().length > 0) {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [{ name: rx }, { slug: rx }];
    }

    const tags = await Tag.find(query).sort({ name: 1 }).lean();
    res.status(200).json({ success: true, data: tags, count: tags.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching tags', error: error?.message });
  }
};

export const getTagById = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid tag ID' });
      return;
    }

    const tag = await Tag.findById(objectId);
    if (!tag) {
      res.status(404).json({ success: false, message: 'Tag not found' });
      return;
    }

    res.status(200).json({ success: true, data: tag });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching tag', error: error?.message });
  }
};

export const getTagBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const tag = await Tag.findOne({ slug });
    if (!tag) {
      res.status(404).json({ success: false, message: 'Tag not found' });
      return;
    }

    res.status(200).json({ success: true, data: tag });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching tag', error: error?.message });
  }
};

export const updateTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid tag ID' });
      return;
    }

    const update: any = {};
    if (typeof req.body?.name === 'string') {
      update.name = req.body.name.trim();
      if (!update.name) {
        res.status(400).json({ success: false, message: 'Tag name cannot be empty' });
        return;
      }
    }

    if (typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0) {
      update.slug = req.body.slug.trim();
    } else if (update.name) {
      update.slug = slugify(update.name);
    }

    const tag = await Tag.findByIdAndUpdate(objectId, update, { new: true, runValidators: true });
    if (!tag) {
      res.status(404).json({ success: false, message: 'Tag not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Tag updated successfully', data: tag });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ success: false, message: 'Tag with this slug already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Error updating tag', error: error?.message });
  }
};

export const deleteTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid tag ID' });
      return;
    }

    const tag = await Tag.findByIdAndDelete(objectId);
    if (!tag) {
      res.status(404).json({ success: false, message: 'Tag not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Tag deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deleting tag', error: error?.message });
  }
};

export const hardDeleteTag = deleteTag;

export const getTagStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalTags = await Tag.countDocuments({});
    res.status(200).json({ success: true, data: { totalTags } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching tag stats', error: error?.message });
  }
};
