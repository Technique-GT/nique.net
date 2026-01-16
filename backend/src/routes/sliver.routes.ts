import express from 'express';

import { createSliver, deleteSliver, getAllSlivers } from '../controllers/sliver.controller';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { createSliverBodySchema } from '../schemas/sliver.schema';
import { listSliversQuerySchema } from '../schemas/sliver.query.schema';
import { idParamSchema } from '../schemas/params.schema';

const router = express.Router();

router.post('/', validateBody(createSliverBodySchema), createSliver);
router.get('/', validateQuery(listSliversQuerySchema), getAllSlivers);
const activeSliversQuerySchema = listSliversQuerySchema.extend({
  active: listSliversQuerySchema.shape.active.default(true),
});

router.get('/active', validateQuery(activeSliversQuerySchema), getAllSlivers);
router.delete('/:id', validateParams(idParamSchema), deleteSliver);

export default router;
