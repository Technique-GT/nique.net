"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPublicReadCacheHeaders = exports.applyNoStoreHeaders = void 0;
const EDGE_CACHE_CONTROL = 'public, max-age=21600, stale-while-revalidate=60, stale-if-error=86400';
const NO_STORE = 'no-store';
const setHeaderIfMissing = (res, name, value) => {
    if (!res.getHeader(name)) {
        res.setHeader(name, value);
    }
};
const applyNoStoreHeaders = (res) => {
    res.setHeader('Cache-Control', NO_STORE);
    res.setHeader('Cloudflare-CDN-Cache-Control', NO_STORE);
};
exports.applyNoStoreHeaders = applyNoStoreHeaders;
const applyPublicReadCacheHeaders = (req, res, next) => {
    if (req.method !== 'GET') {
        next();
        return;
    }
    const search = req.query?.search;
    const hasSearch = typeof search === 'string' && search.trim().length > 0;
    if (hasSearch) {
        (0, exports.applyNoStoreHeaders)(res);
        next();
        return;
    }
    setHeaderIfMissing(res, 'Cache-Control', NO_STORE);
    setHeaderIfMissing(res, 'Cloudflare-CDN-Cache-Control', EDGE_CACHE_CONTROL);
    next();
};
exports.applyPublicReadCacheHeaders = applyPublicReadCacheHeaders;
