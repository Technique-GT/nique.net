import express from 'express';

import {
  createTag,
  deleteTag,
  getTagById,
  getTagBySlug,
  getTagStats,
  getTags,
  hardDeleteTag,
  updateTag,
} from '../controllers/tag.controller';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import { createTagBodySchema, updateTagBodySchema } from '../schemas/tag.schema';
import { idParamSchema, slugParamSchema } from '../schemas/params.schema';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = express.Router();

// Public routes (read-only)
router.get('/', getTags);
router.get('/stats', getTagStats);
router.get('/:id', validateParams(idParamSchema), getTagById);
router.get('/slug/:slug', validateParams(slugParamSchema), getTagBySlug);

// Protected routes (require authentication + admin)
router.post('/', authMiddleware, adminMiddleware, validateBody(createTagBodySchema), createTag);
router.put('/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), validateBody(updateTagBodySchema), updateTag);
router.patch('/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), validateBody(updateTagBodySchema), updateTag);
router.delete('/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), deleteTag);
router.delete('/:id/hard', authMiddleware, adminMiddleware, validateParams(idParamSchema), hardDeleteTag);

export default router;
