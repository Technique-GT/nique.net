import { Router } from 'express';

import {
  adminPublish,
  adminUnpublish,
  createDraft,
  deleteArticle,
  getAdminArticleById,
  getArticles,
  requestReview,
  requestChanges,
  toggleFeatured,
  toggleSticky,
  transferOwnership,
  unrequestReview,
  updateArticle,
  updateArticleStatus,
} from '../controllers/article.controller';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { updateArticleBodySchema, updateArticleStatusBodySchema } from '../schemas/article.mutate.schema';
import { listArticlesQuerySchema } from '../schemas/article.query.schema';
import { idParamSchema } from '../schemas/params.schema';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth to all admin article routes
router.use(authMiddleware);

router.get('/articles', validateQuery(listArticlesQuerySchema), getArticles);
router.post('/articles/draft', createDraft);
router.get('/articles/:id', validateParams(idParamSchema), getAdminArticleById);
router.put('/articles/:id', validateParams(idParamSchema), validateBody(updateArticleBodySchema), updateArticle);

router.post('/articles/:id/request-review', validateParams(idParamSchema), requestReview);
router.post('/articles/:id/request-changes', validateParams(idParamSchema), requestChanges);
router.post('/articles/:id/unrequest-review', validateParams(idParamSchema), unrequestReview);
router.post('/articles/:id/publish', validateParams(idParamSchema), adminPublish);
router.post('/articles/:id/unpublish', validateParams(idParamSchema), adminUnpublish);
router.post('/articles/:id/transfer-ownership', validateParams(idParamSchema), transferOwnership);

router.patch('/articles/:id/status', validateParams(idParamSchema), validateBody(updateArticleStatusBodySchema), updateArticleStatus);
router.patch('/articles/:id/featured', validateParams(idParamSchema), toggleFeatured);
router.patch('/articles/:id/sticky', validateParams(idParamSchema), toggleSticky);
router.delete('/articles/:id', validateParams(idParamSchema), deleteArticle);

export default router;
