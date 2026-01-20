import express from 'express';

import {
  createSubCategory,
  deleteSubCategory,
  getSubCategories,
  getSubCategoriesByCategory,
  getSubCategoryById,
  getSubCategoryBySlug,
  getSubCategoryStats,
  hardDeleteSubCategory,
  updateSubCategory,
} from '../controllers/subCategory.controller';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import { createSubcategoryBodySchema, updateSubcategoryBodySchema } from '../schemas/subcategory.schema';
import { idParamSchema, slugParamSchema } from '../schemas/params.schema';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = express.Router();

// Public routes (read-only)
router.get('/stats', getSubCategoryStats);
router.get('/', getSubCategories);
router.get('/category/:categoryId', validateParams(idParamSchema), getSubCategoriesByCategory);
router.get('/slug/:slug', validateParams(slugParamSchema), getSubCategoryBySlug);
router.get('/:id', validateParams(idParamSchema), getSubCategoryById);

// Protected routes (require authentication + admin)
router.post('/', authMiddleware, adminMiddleware, validateBody(createSubcategoryBodySchema), createSubCategory);
router.put('/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), validateBody(updateSubcategoryBodySchema), updateSubCategory);
router.delete('/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), deleteSubCategory);
router.delete('/:id/hard', authMiddleware, adminMiddleware, validateParams(idParamSchema), hardDeleteSubCategory);

export default router;
