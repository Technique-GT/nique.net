import express from 'express';

import { createSliver, deleteSliver, getAllSlivers } from '../controllers/sliver.controller';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { createSliverBodySchema } from '../schemas/sliver.schema';
import { listSliversQuerySchema } from '../schemas/sliver.query.schema';
import { idParamSchema } from '../schemas/params.schema';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = express.Router();

router.get('/all', authMiddleware, adminMiddleware, validateQuery(listSliversQuerySchema), getAllSlivers);

router.post('/', validateBody(createSliverBodySchema), createSliver);

// Protected routes (require authentication + admin)
router.delete('/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), deleteSliver);

export default router;
