import { Router } from 'express';

import {
  createArticle,
  deleteArticle,
  getArticleById,
  getArticleBySlug,
  getArticles,
  getArticlesByCategory,
  getFeaturedArticles,
  getFeed,
  getPublishedArticles,
  getStickyArticles,
  toggleFeatured,
  toggleSticky,
  updateArticle,
  updateArticleStatus,
} from '../controllers/article.controller';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { createArticleBodySchema, updateArticleBodySchema, updateArticleStatusBodySchema } from '../schemas/article.mutate.schema';
import { listArticlesQuerySchema, publishedArticlesQuerySchema } from '../schemas/article.query.schema';
import { feedQuerySchema } from '../schemas/article.feed.schema';
import { idParamSchema, slugParamSchema } from '../schemas/params.schema';

const router = Router();

router.post('/', validateBody(createArticleBodySchema), createArticle);

// Admin listing (includes drafts)
router.get('/', validateQuery(listArticlesQuerySchema), getArticles);

// Alias for TechniqueDash/admin
router.get('/admin', validateQuery(listArticlesQuerySchema), getArticles);

// Fast public feed (paginated, no content)
router.get('/feed', validateQuery(feedQuerySchema), getFeed);

router.get('/published', validateQuery(publishedArticlesQuerySchema), getPublishedArticles);
router.get('/featured', getFeaturedArticles);
router.get('/sticky', getStickyArticles);

router.get('/category/:category', getArticlesByCategory);

router.get('/slug/:slug', validateParams(slugParamSchema), getArticleBySlug);
router.get('/:id', validateParams(idParamSchema), getArticleById);

router.put('/:id', validateParams(idParamSchema), validateBody(updateArticleBodySchema), updateArticle);
router.patch('/:id/featured', validateParams(idParamSchema), toggleFeatured);
router.patch('/:id/sticky', validateParams(idParamSchema), toggleSticky);
router.delete('/:id', validateParams(idParamSchema), deleteArticle);

router.patch('/:id/status', validateParams(idParamSchema), validateBody(updateArticleStatusBodySchema), updateArticleStatus);

export default router;
