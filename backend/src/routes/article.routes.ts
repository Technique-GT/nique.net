import { Router } from 'express';

import {
  getArticleById,
  getArticleBySlug,
  getArticlesByCategory,
  getFeaturedArticles,
  getFeed,
  getPublishedArticles,
  getStickyArticles,
} from '../controllers/article.controller';
import { validateParams, validateQuery } from '../middleware/validate.middleware';
import { publishedArticlesQuerySchema } from '../schemas/article.query.schema';
import { feedQuerySchema } from '../schemas/article.feed.schema';
import { idParamSchema, slugParamSchema } from '../schemas/params.schema';

const router = Router();

// Public routes (read-only, published content only)

// Fast public feed (paginated, no content)
router.get('/feed', validateQuery(feedQuerySchema), getFeed);

router.get('/published', validateQuery(publishedArticlesQuerySchema), getPublishedArticles);
router.get('/featured', getFeaturedArticles);
router.get('/sticky', getStickyArticles);

router.get('/category/:category', getArticlesByCategory);

router.get('/slug/:slug', validateParams(slugParamSchema), getArticleBySlug);
router.get('/:id', validateParams(idParamSchema), getArticleById);

export default router;
