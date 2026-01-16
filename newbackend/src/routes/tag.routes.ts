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

const router = express.Router();

router.post('/', validateBody(createTagBodySchema), createTag);
router.get('/', getTags);
router.get('/stats', getTagStats);
router.get('/:id', validateParams(idParamSchema), getTagById);
router.get('/slug/:slug', validateParams(slugParamSchema), getTagBySlug);
router.put('/:id', validateParams(idParamSchema), validateBody(updateTagBodySchema), updateTag);
router.patch('/:id', validateParams(idParamSchema), validateBody(updateTagBodySchema), updateTag);
router.delete('/:id', validateParams(idParamSchema), deleteTag);
router.delete('/:id/hard', validateParams(idParamSchema), hardDeleteTag);

export default router;
