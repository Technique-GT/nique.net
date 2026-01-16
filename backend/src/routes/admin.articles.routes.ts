import { Router } from 'express';

import {
  deleteArticle,
  getArticleById,
  getArticles,
  toggleFeatured,
  toggleSticky,
  updateArticle,
  updateArticleStatus,
} from '../controllers/article.controller';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { updateArticleBodySchema, updateArticleStatusBodySchema } from '../schemas/article.mutate.schema';
import { listArticlesQuerySchema } from '../schemas/article.query.schema';
import { idParamSchema } from '../schemas/params.schema';

const router = Router();

router.get('/articles', validateQuery(listArticlesQuerySchema), getArticles);
router.get('/articles/:id', validateParams(idParamSchema), getArticleById);
router.put('/articles/:id', validateParams(idParamSchema), validateBody(updateArticleBodySchema), updateArticle);
router.patch('/articles/:id/status', validateParams(idParamSchema), validateBody(updateArticleStatusBodySchema), updateArticleStatus);
router.patch('/articles/:id/featured', validateParams(idParamSchema), toggleFeatured);
router.patch('/articles/:id/sticky', validateParams(idParamSchema), toggleSticky);
router.delete('/articles/:id', validateParams(idParamSchema), deleteArticle);

export default router;
