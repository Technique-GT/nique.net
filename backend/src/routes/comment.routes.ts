import express from 'express';

import {
  createComment,
  deleteComment,
  dislikeComment,
  getAllComments,
  getCommentById,
  getCommentStats,
  getCommentsByArticle,
  likeComment,
  updateComment,
  updateCommentStatus,
} from '../controllers/comment.controller';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { createCommentBodySchema, updateCommentBodySchema, updateCommentStatusBodySchema } from '../schemas/comment.schema';
import { listCommentsQuerySchema } from '../schemas/comment.admin.query.schema';
import { listCommentsQuerySchema as listCommentsByQuerySchema } from '../schemas/comment.list.query.schema';
import { commentsByArticleQuerySchema } from '../schemas/comment.query.schema';
import { articleIdParamSchema, idParamSchema } from '../schemas/params.schema';

const router = express.Router();

router.post('/', validateBody(createCommentBodySchema), createComment);
// Plan.md: GET /api/comments?articleId=... (paginated)
router.get('/by-article', validateQuery(listCommentsByQuerySchema), getCommentsByArticle);

// Legacy path-style alias
router.get('/article/:articleId', validateParams(articleIdParamSchema), validateQuery(commentsByArticleQuerySchema), getCommentsByArticle);

// Admin routes
router.get('/', validateQuery(listCommentsQuerySchema), getAllComments);
router.patch('/:id/like', validateParams(idParamSchema), likeComment);
router.patch('/:id/dislike', validateParams(idParamSchema), dislikeComment);
router.get('/stats', getCommentStats);
router.get('/:id', validateParams(idParamSchema), getCommentById);
router.put('/:id', validateParams(idParamSchema), validateBody(updateCommentBodySchema), updateComment);
router.delete('/:id', validateParams(idParamSchema), deleteComment);
router.patch('/:id/status', validateParams(idParamSchema), validateBody(updateCommentStatusBodySchema), updateCommentStatus);

export default router;
