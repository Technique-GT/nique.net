import express from 'express';

import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  getCategoryStats,
  hardDeleteCategory,
  updateCategory,
} from '../controllers/category.controller';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import { createCategoryBodySchema, updateCategoryBodySchema } from '../schemas/category.schema';
import { idParamSchema, slugParamSchema } from '../schemas/params.schema';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = express.Router();

// Public routes (read-only)
router.get('/', getCategories);
router.get('/stats', getCategoryStats);
router.get('/:id', validateParams(idParamSchema), getCategoryById);
router.get('/slug/:slug', validateParams(slugParamSchema), getCategoryBySlug);

// Protected routes (require authentication + admin)
router.post('/', authMiddleware, adminMiddleware, validateBody(createCategoryBodySchema), createCategory);
router.put('/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), validateBody(updateCategoryBodySchema), updateCategory);
router.patch('/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), validateBody(updateCategoryBodySchema), updateCategory);
router.delete('/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), deleteCategory);
router.delete('/:id/hard', authMiddleware, adminMiddleware, validateParams(idParamSchema), hardDeleteCategory);

export default router;
