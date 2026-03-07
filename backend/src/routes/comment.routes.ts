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
  setCommentReaction,
  updateComment,
  updateCommentStatus,
} from '../controllers/comment.controller';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { createCommentBodySchema, updateCommentBodySchema, updateCommentStatusBodySchema } from '../schemas/comment.schema';
import { listCommentsQuerySchema } from '../schemas/comment.admin.query.schema';
import { listCommentsQuerySchema as listCommentsByQuerySchema } from '../schemas/comment.list.query.schema';
import { commentsByArticleQuerySchema } from '../schemas/comment.query.schema';
import { articleIdParamSchema, idParamSchema } from '../schemas/params.schema';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (no authentication required)
// ==========================================

// Create a new comment (public, but comments require approval)
router.post('/', validateBody(createCommentBodySchema), createComment);

// Get approved comments for an article (public)
router.get('/by-article', validateQuery(listCommentsByQuerySchema), getCommentsByArticle);
router.get('/article/:articleId', validateParams(articleIdParamSchema), validateQuery(commentsByArticleQuerySchema), getCommentsByArticle);

// Reaction endpoints (public - uses device ID for tracking)
router.patch('/:id/like', validateParams(idParamSchema), likeComment);
router.patch('/:id/dislike', validateParams(idParamSchema), dislikeComment);
router.put('/:id/reaction', validateParams(idParamSchema), setCommentReaction);

// ==========================================
// ADMIN ROUTES (authentication + admin required)
// ==========================================

// List all comments (admin only - includes pending)
router.get('/', authMiddleware, adminMiddleware, validateQuery(listCommentsQuerySchema), getAllComments);

// Comment stats (admin only)
router.get('/stats', authMiddleware, adminMiddleware, getCommentStats);

// Get single comment (admin only - may include unapproved)
router.get('/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), getCommentById);

// Update comment content (admin only)
router.put('/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), validateBody(updateCommentBodySchema), updateComment);

// Delete comment (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), deleteComment);

// Approve/reject comment (admin only)
router.patch('/:id/status', authMiddleware, adminMiddleware, validateParams(idParamSchema), validateBody(updateCommentStatusBodySchema), updateCommentStatus);

export default router;
