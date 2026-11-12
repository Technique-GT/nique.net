"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const article_controller_1 = require("../controllers/article.controller");
const public_cache_middleware_1 = require("../middleware/public-cache.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const article_query_schema_1 = require("../schemas/article.query.schema");
const article_feed_schema_1 = require("../schemas/article.feed.schema");
const params_schema_1 = require("../schemas/params.schema");
const router = (0, express_1.Router)();
// Public routes (read-only, published content only)
// Fast public feed (paginated, no content)
router.get('/feed', public_cache_middleware_1.applyPublicReadCacheHeaders, (0, validate_middleware_1.validateQuery)(article_feed_schema_1.feedQuerySchema), article_controller_1.getFeed);
router.get('/published', public_cache_middleware_1.applyPublicReadCacheHeaders, (0, validate_middleware_1.validateQuery)(article_query_schema_1.publishedArticlesQuerySchema), article_controller_1.getPublishedArticles);
router.get('/featured', public_cache_middleware_1.applyPublicReadCacheHeaders, article_controller_1.getFeaturedArticles);
router.get('/sticky', public_cache_middleware_1.applyPublicReadCacheHeaders, article_controller_1.getStickyArticles);
router.get('/category/:category', public_cache_middleware_1.applyPublicReadCacheHeaders, article_controller_1.getArticlesByCategory);
router.get('/slug/:slug', public_cache_middleware_1.applyPublicReadCacheHeaders, (0, validate_middleware_1.validateParams)(params_schema_1.slugParamSchema), article_controller_1.getArticleBySlug);
router.get('/:id', public_cache_middleware_1.applyPublicReadCacheHeaders, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), article_controller_1.getArticleById);
router.post('/:id/view', (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), article_controller_1.incrementArticleView);
exports.default = router;
