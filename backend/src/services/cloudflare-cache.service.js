"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudflareCacheService = void 0;
const env_1 = require("../utils/env");
const logger_1 = require("../utils/logger");
const PURGE_ENDPOINT = (zoneId) => `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;
const purgeCloudflareCache = async (body, context, successMessage, failureMessage) => {
    if (!env_1.env.CLOUDFLARE_ZONE_ID || !env_1.env.CLOUDFLARE_API_TOKEN) {
        logger_1.logger.warn('Cloudflare cache purge skipped because credentials are not configured');
        return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(PURGE_ENDPOINT(env_1.env.CLOUDFLARE_ZONE_ID), {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env_1.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null));
        logger_1.logger.info({ ...context, status: response.status, payload }, successMessage);
        if (!response.ok || !payload?.success) {
            logger_1.logger.error({ ...context, status: response.status, response: payload }, failureMessage);
        }
    }
    catch (error) {
        logger_1.logger.error({ error, ...context }, `${failureMessage} request failed`);
    }
    finally {
        clearTimeout(timeout);
    }
};
class CloudflareCacheService {
    static async purgeEverything() {
        if (!env_1.env.CLOUDFLARE_PURGE_ENABLED) {
            logger_1.logger.debug('Cloudflare full purge skipped because it is disabled');
            return;
        }
        logger_1.logger.info('Cloudflare purge everything');
        await purgeCloudflareCache({ purge_everything: true }, { purgeEverything: true }, 'Cloudflare purge-everything response', 'Cloudflare purge-everything failed');
    }
    static async purgeTags(tags) {
        const uniqueTags = Array.from(new Set(tags.filter(Boolean)));
        if (uniqueTags.length === 0)
            return;
        if (!env_1.env.CLOUDFLARE_PURGE_ENABLED) {
            logger_1.logger.debug({ tags: uniqueTags }, 'Cloudflare cache purge skipped because it is disabled');
            return;
        }
        logger_1.logger.info({ tags: uniqueTags }, 'Cloudflare purge tags');
        await purgeCloudflareCache({ tags: uniqueTags }, { tags: uniqueTags }, 'Cloudflare purge response', 'Cloudflare cache purge failed');
    }
    static async purgeUrls(urls) {
        const uniqueUrls = Array.from(new Map(urls
            .filter((url) => {
            if (typeof url === 'string')
                return Boolean(url);
            return Boolean(url.url);
        })
            .map((url) => [
            typeof url === 'string'
                ? url
                : JSON.stringify({
                    url: url.url,
                    headers: url.headers ?? {},
                }),
            url,
        ])).values());
        if (uniqueUrls.length === 0)
            return;
        if (!env_1.env.CLOUDFLARE_PURGE_ENABLED) {
            logger_1.logger.debug({ urls: uniqueUrls }, 'Cloudflare URL purge skipped because it is disabled');
            return;
        }
        logger_1.logger.info({ urls: uniqueUrls }, 'Cloudflare purge urls');
        await purgeCloudflareCache({ files: uniqueUrls }, { urls: uniqueUrls }, 'Cloudflare URL purge response', 'Cloudflare URL purge failed');
    }
}
exports.CloudflareCacheService = CloudflareCacheService;
