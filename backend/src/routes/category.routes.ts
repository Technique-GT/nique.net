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

const router = express.Router();

router.post('/', validateBody(createCategoryBodySchema), createCategory);
router.get('/', getCategories);
router.get('/stats', getCategoryStats);
router.get('/:id', validateParams(idParamSchema), getCategoryById);
router.get('/slug/:slug', validateParams(slugParamSchema), getCategoryBySlug);
router.put('/:id', validateParams(idParamSchema), validateBody(updateCategoryBodySchema), updateCategory);
router.patch('/:id', validateParams(idParamSchema), validateBody(updateCategoryBodySchema), updateCategory);
router.delete('/:id', validateParams(idParamSchema), deleteCategory);
router.delete('/:id/hard', validateParams(idParamSchema), hardDeleteCategory);

export default router;
