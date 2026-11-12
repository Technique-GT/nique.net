"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleCacheInvalidationService = void 0;
const cloudflare_cache_service_1 = require("./cloudflare-cache.service");
class ArticleCacheInvalidationService {
    static async invalidatePublicArticleCache(_params) {
        await cloudflare_cache_service_1.CloudflareCacheService.purgeEverything();
    }
}
exports.ArticleCacheInvalidationService = ArticleCacheInvalidationService;
