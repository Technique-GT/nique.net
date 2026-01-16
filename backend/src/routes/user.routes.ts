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
import { validateBody, validateParams } from '../middleware/validate.middleware';
import { bulkDeleteUsersBodySchema, createUserBodySchema, updateUserBodySchema } from '../schemas/user.schema';
import { idParamSchema } from '../schemas/params.schema';

const router = express.Router();

router.get('/', getUsers);
router.get('/:id', validateParams(idParamSchema), getUserById);

router.post('/', validateBody(createUserBodySchema), createUser);
router.post('/invite', inviteUser);
router.post('/bulk-delete', validateBody(bulkDeleteUsersBodySchema), bulkDeleteUsers);

router.put('/:id', validateParams(idParamSchema), validateBody(updateUserBodySchema), updateUser);
router.patch('/:id', validateParams(idParamSchema), validateBody(updateUserBodySchema), updateUser);

router.delete('/:id', validateParams(idParamSchema), deleteUser);

export default router;
