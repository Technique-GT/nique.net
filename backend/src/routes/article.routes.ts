import { Router } from 'express';

import {
  getArticleById,
  getArticleBySlug,
  getArticlesByCategory,
  getFeaturedArticles,
  getFeed,
  getPublishedArticles,
  getStickyArticles,
  incrementArticleView,
} from '../controllers/article.controller';
import { applyPublicReadCacheHeaders } from '../middleware/public-cache.middleware';
import { validateParams, validateQuery } from '../middleware/validate.middleware';
import { publishedArticlesQuerySchema } from '../schemas/article.query.schema';
import { feedQuerySchema } from '../schemas/article.feed.schema';
import { idParamSchema, slugParamSchema } from '../schemas/params.schema';

const router = Router();

// Public routes (read-only, published content only)

// Fast public feed (paginated, no content)
router.get('/feed', applyPublicReadCacheHeaders, validateQuery(feedQuerySchema), getFeed);

router.get('/published', applyPublicReadCacheHeaders, validateQuery(publishedArticlesQuerySchema), getPublishedArticles);
router.get('/featured', applyPublicReadCacheHeaders, getFeaturedArticles);
router.get('/sticky', applyPublicReadCacheHeaders, getStickyArticles);

router.get('/category/:category', applyPublicReadCacheHeaders, getArticlesByCategory);

router.get('/slug/:slug', applyPublicReadCacheHeaders, validateParams(slugParamSchema), getArticleBySlug);
router.get('/:id', applyPublicReadCacheHeaders, validateParams(idParamSchema), getArticleById);
router.post('/:id/view', validateParams(idParamSchema), incrementArticleView);

export default router;
