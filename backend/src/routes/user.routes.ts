import express from 'express';

import {
  bulkDeleteUsers,
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  inviteUser,
  updateUser,
} from '../controllers/user.controller';
import { mergeUsers, getUserArticleCount } from '../controllers/user.merge.controller';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import { bulkDeleteUsersBodySchema, createUserBodySchema, updateUserBodySchema } from '../schemas/user.schema';
import { idParamSchema } from '../schemas/params.schema';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = express.Router();

// All user management routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Static paths MUST come before parameterized /:id routes
router.get('/', getUsers);
router.post('/', validateBody(createUserBodySchema), createUser);
router.post('/invite', inviteUser);
router.post('/bulk-delete', validateBody(bulkDeleteUsersBodySchema), bulkDeleteUsers);
router.post('/merge', mergeUsers);

// Parameterized /:id routes — order matters: sub-paths first
router.get('/:id/article-count', validateParams(idParamSchema), getUserArticleCount);
router.get('/:id', validateParams(idParamSchema), getUserById);

router.put('/:id', validateParams(idParamSchema), validateBody(updateUserBodySchema), updateUser);
router.patch('/:id', validateParams(idParamSchema), validateBody(updateUserBodySchema), updateUser);

router.delete('/:id', validateParams(idParamSchema), deleteUser);

export default router;
