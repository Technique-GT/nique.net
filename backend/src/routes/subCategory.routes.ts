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

const router = express.Router();

router.get('/stats', getSubCategoryStats);
router.get('/', getSubCategories);
router.get('/category/:categoryId', validateParams(idParamSchema), getSubCategoriesByCategory);
router.get('/slug/:slug', validateParams(slugParamSchema), getSubCategoryBySlug);
router.get('/:id', validateParams(idParamSchema), getSubCategoryById);

router.post('/', validateBody(createSubcategoryBodySchema), createSubCategory);
router.put('/:id', validateParams(idParamSchema), validateBody(updateSubcategoryBodySchema), updateSubCategory);
router.delete('/:id', validateParams(idParamSchema), deleteSubCategory);
router.delete('/:id/hard', validateParams(idParamSchema), hardDeleteSubCategory);

export default router;
