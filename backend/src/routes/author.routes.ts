import { Router } from 'express';

import { getAuthorByName } from '../controllers/author.controller';
import { validateParams } from '../middleware/validate.middleware';
import { authorNameParamSchema } from '../schemas/params.schema';

const router = Router();

// Public route (read-only)
router.get('/:authorName', validateParams(authorNameParamSchema), getAuthorByName);

export default router;
