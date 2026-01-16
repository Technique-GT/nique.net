import { Request, Response } from 'express';
import mongoose from 'mongoose';
import SubCategory from '../models/Subcategory';
import Category from '../models/Category';

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

export const createSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const nameRaw = typeof req.body?.name === 'string' ? req.body.name : '';
    const name = nameRaw.trim();
    if (!name) {
      res.status(400).json({ success: false, message: 'Sub-category name is required' });
      return;
    }

    const categoryIdRaw = typeof req.body?.categoryId === 'string' ? req.body.categoryId : typeof req.body?.category === 'string' ? req.body.category : undefined;
    const categoryId = toObjectId(categoryIdRaw);
    if (!categoryId) {
      res.status(400).json({ success: false, message: 'Invalid category ID' });
      return;
    }

    const parentCategory = await Category.findById(categoryId);
    if (!parentCategory) {
      res.status(404).json({ success: false, message: 'Parent category not found' });
      return;
    }

    const slug = typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0 ? req.body.slug.trim() : slugify(name);

    const existing = await SubCategory.findOne({ $or: [{ slug }, { name: { $regex: new RegExp(`^${name}$`, 'i') } }] });
    if (existing) {
      res.status(409).json({ success: false, message: 'Sub-category with this name or slug already exists' });
      return;
    }

    const subCategory = await SubCategory.create({ name, slug, categoryId });

    res.status(201).json({ success: true, message: 'Sub-category created successfully', data: subCategory });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ success: false, message: 'Sub-category with this slug already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error', error: error?.message });
  }
};

export const getSubCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, categoryId } = req.query;

    const query: any = {};

    if (typeof search === 'string' && search.trim().length > 0) {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [{ name: rx }, { slug: rx }];
    }

    const catRaw = typeof categoryId === 'string' ? categoryId : typeof category === 'string' ? category : undefined;
    if (catRaw) {
      const catId = toObjectId(catRaw);
      if (!catId) {
        res.status(400).json({ success: false, message: 'Invalid category ID' });
        return;
      }
      query.categoryId = catId;
    }

    const subCategories = await SubCategory.find(query).sort({ name: 1 }).lean();

    res.status(200).json({ success: true, data: subCategories, count: subCategories.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching sub-categories', error: error?.message });
  }
};

export const getSubCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid sub-category ID' });
      return;
    }

    const subCategory = await SubCategory.findById(objectId);
    if (!subCategory) {
      res.status(404).json({ success: false, message: 'Sub-category not found' });
      return;
    }

    res.status(200).json({ success: true, data: subCategory });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching sub-category', error: error?.message });
  }
};

export const getSubCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const subCategory = await SubCategory.findOne({ slug });
    if (!subCategory) {
      res.status(404).json({ success: false, message: 'Sub-category not found' });
      return;
    }

    res.status(200).json({ success: true, data: subCategory });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching sub-category', error: error?.message });
  }
};

export const updateSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid sub-category ID' });
      return;
    }

    const update: any = {};

    if (typeof req.body?.name === 'string') {
      update.name = req.body.name.trim();
      if (!update.name) {
        res.status(400).json({ success: false, message: 'Sub-category name cannot be empty' });
        return;
      }
    }

    if (typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0) {
      update.slug = req.body.slug.trim();
    } else if (update.name) {
      update.slug = slugify(update.name);
    }

    const categoryIdRaw = typeof req.body?.categoryId === 'string' ? req.body.categoryId : typeof req.body?.category === 'string' ? req.body.category : undefined;
    if (categoryIdRaw !== undefined) {
      const catId = toObjectId(categoryIdRaw);
      if (!catId) {
        res.status(400).json({ success: false, message: 'Invalid category ID' });
        return;
      }

      const parentCategory = await Category.findById(catId);
      if (!parentCategory) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }

      update.categoryId = catId;
    }

    const subCategory = await SubCategory.findByIdAndUpdate(objectId, update, { new: true, runValidators: true });
    if (!subCategory) {
      res.status(404).json({ success: false, message: 'Sub-category not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Sub-category updated successfully', data: subCategory });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ success: false, message: 'Sub-category with this slug already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Error updating sub-category', error: error?.message });
  }
};

export const deleteSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid sub-category ID' });
      return;
    }

    const subCategory = await SubCategory.findByIdAndDelete(objectId);
    if (!subCategory) {
      res.status(404).json({ success: false, message: 'Sub-category not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Sub-category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deleting sub-category', error: error?.message });
  }
};

export const hardDeleteSubCategory = deleteSubCategory;

export const getSubCategoriesByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryObjectId = toObjectId(req.params.categoryId);
    if (!categoryObjectId) {
      res.status(400).json({ success: false, message: 'Invalid category ID' });
      return;
    }

    const subCategories = await SubCategory.find({ categoryId: categoryObjectId }).sort({ name: 1 }).lean();

    res.status(200).json({ success: true, data: subCategories, count: subCategories.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching sub-categories', error: error?.message });
  }
};

export const getSubCategoryStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalSubCategories = await SubCategory.countDocuments({});
    res.status(200).json({ success: true, data: { totalSubCategories } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching sub-category stats', error: error?.message });
  }
};
