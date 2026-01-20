import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../models/Category';
import SubCategory from '../models/Subcategory';
import { escapeRegex, safeRegex, safeErrorResponse } from '../utils/security';

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

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const nameRaw = typeof req.body?.name === 'string' ? req.body.name : '';
    const name = nameRaw.trim();
    if (!name) {
      res.status(400).json({ success: false, message: 'Category name is required' });
      return;
    }

    const slug = typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0 ? req.body.slug.trim() : slugify(name);

    const existing = await Category.findOne({ $or: [{ slug }, { name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } }] });
    if (existing) {
      res.status(409).json({ success: false, message: 'Category with this name or slug already exists' });
      return;
    }

    const category = await Category.create({ name, slug });

    res.status(201).json({ success: true, message: 'Category created successfully', data: category });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ success: false, message: 'Category with this slug already exists' });
      return;
    }
    res.status(500).json(safeErrorResponse('Server error', error));
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    const query: any = {};
    if (typeof search === 'string' && search.trim().length > 0) {
      const rx = safeRegex(search.trim());
      query.$or = [{ name: rx }, { slug: rx }];
    }

    const categories = await Category.find(query).sort({ name: 1 }).lean();

    res.status(200).json({ success: true, data: categories, count: categories.length });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching categories', error));
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid category ID' });
      return;
    }

    const category = await Category.findById(objectId);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching category', error));
  }
};

export const getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug });
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching category', error));
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid category ID' });
      return;
    }

    const update: any = {};
    if (typeof req.body?.name === 'string') {
      update.name = req.body.name.trim();
      if (!update.name) {
        res.status(400).json({ success: false, message: 'Category name cannot be empty' });
        return;
      }
    }

    if (typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0) {
      update.slug = req.body.slug.trim();
    } else if (update.name) {
      update.slug = slugify(update.name);
    }

    const category = await Category.findByIdAndUpdate(objectId, update, { new: true, runValidators: true });
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ success: false, message: 'Category with this slug already exists' });
      return;
    }
    res.status(500).json(safeErrorResponse('Error updating category', error));
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid category ID' });
      return;
    }

    const category = await Category.findByIdAndDelete(objectId);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    await SubCategory.deleteMany({ categoryId: objectId });

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error deleting category', error));
  }
};

export const hardDeleteCategory = deleteCategory;

export const getCategoryStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalCategories = await Category.countDocuments({});
    res.status(200).json({ success: true, data: { totalCategories } });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching category stats', error));
  }
};
